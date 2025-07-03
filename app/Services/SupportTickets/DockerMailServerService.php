<?php

namespace App\Services\SupportTickets;

use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Models\Tenant;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Carbon\Carbon;

class DockerMailServerService
{
    protected TicketService $ticketService;
    protected ReplyService $replyService;
    protected AttachmentService $attachmentService;

    public function __construct(
        TicketService $ticketService,
        ReplyService $replyService,
        AttachmentService $attachmentService
    ) {
        $this->ticketService = $ticketService;
        $this->replyService = $replyService;
        $this->attachmentService = $attachmentService;
    }

    /**
     * Process emails from the mail server
     */
    public function processIncomingEmails(): array
    {
        $processed = [];
        $mailDir = config('support-tickets.mail_server.maildir_path', '/var/mail');

        try {
            // Get all email files from the mail directory
            $emailFiles = $this->getEmailFiles($mailDir);

            foreach ($emailFiles as $emailFile) {
                $result = $this->processEmailFile($emailFile);
                if ($result) {
                    $processed[] = $result;
                }
            }

            return ['processed' => $processed];

        } catch (\Exception $e) {
            Log::error('Error processing emails from mail server: ' . $e->getMessage());
            return ['error' => 'Failed to process emails: ' . $e->getMessage()];
        }
    }

    /**
     * Get email files from mail directory
     */
    private function getEmailFiles(string $mailDir): array
    {
        $files = [];
        
        if (!is_dir($mailDir)) {
            Log::warning("Mail directory does not exist: {$mailDir}");
            return $files;
        }

        // Recursively find all .eml files
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($mailDir, \RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'eml') {
                $files[] = $file->getPathname();
            }
        }

        return $files;
    }

    /**
     * Process individual email file
     */
    private function processEmailFile(string $emailFile): ?array
    {
        try {
            $emailContent = file_get_contents($emailFile);
            $emailData = $this->parseEmail($emailContent);

            if (!$emailData) {
                Log::warning("Failed to parse email file: {$emailFile}");
                return null;
            }

            // Check if this is a reply to existing ticket
            $existingTicket = $this->findExistingTicket($emailData);

            if ($existingTicket) {
                return $this->createReplyFromEmail($existingTicket, $emailData, $emailFile);
            } else {
                return $this->createTicketFromEmail($emailData, $emailFile);
            }

        } catch (\Exception $e) {
            Log::error("Error processing email file {$emailFile}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Parse email content
     */
    private function parseEmail(string $emailContent): ?array
    {
        try {
            // Use PHP's built-in email parsing
            $email = new \Zend\Mail\Message();
            $email->fromString($emailContent);

            $headers = $email->getHeaders();
            $body = $email->getBody();

            return [
                'from_email' => $this->extractEmailAddress($headers->get('From')->getFieldValue()),
                'from_name' => $this->extractEmailName($headers->get('From')->getFieldValue()),
                'to_email' => $this->extractEmailAddress($headers->get('To')->getFieldValue()),
                'subject' => $headers->get('Subject')->getFieldValue(),
                'message_id' => $headers->get('Message-ID')->getFieldValue(),
                'date' => $headers->get('Date')->getFieldValue(),
                'body_text' => $body->getContent(),
                'body_html' => $this->extractHtmlBody($email),
                'headers' => $this->extractHeaders($headers),
                'attachments' => $this->extractAttachments($email),
            ];

        } catch (\Exception $e) {
            Log::error('Error parsing email: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Extract email address from header
     */
    private function extractEmailAddress(string $header): string
    {
        if (preg_match('/<(.+?)>/', $header, $matches)) {
            return $matches[1];
        }
        return $header;
    }

    /**
     * Extract email name from header
     */
    private function extractEmailName(string $header): string
    {
        if (preg_match('/"(.+?)"/', $header, $matches)) {
            return $matches[1];
        }
        return '';
    }

    /**
     * Extract HTML body from email
     */
    private function extractHtmlBody(\Zend\Mail\Message $email): string
    {
        $body = $email->getBody();
        
        if ($body instanceof \Zend\Mime\Message) {
            foreach ($body->getParts() as $part) {
                if ($part->getType() === 'text/html') {
                    return $part->getContent();
                }
            }
        }
        
        return '';
    }

    /**
     * Extract headers from email
     */
    private function extractHeaders($headers): array
    {
        $extracted = [];
        
        foreach ($headers as $header) {
            $extracted[$header->getFieldName()] = $header->getFieldValue();
        }
        
        return $extracted;
    }

    /**
     * Extract attachments from email
     */
    private function extractAttachments(\Zend\Mail\Message $email): array
    {
        $attachments = [];
        $body = $email->getBody();
        
        if ($body instanceof \Zend\Mime\Message) {
            foreach ($body->getParts() as $part) {
                if ($part->getDisposition() === 'attachment') {
                    $attachments[] = [
                        'filename' => $part->getFileName(),
                        'content' => $part->getContent(),
                        'mime_type' => $part->getType(),
                        'size' => strlen($part->getContent()),
                    ];
                }
            }
        }
        
        return $attachments;
    }

    /**
     * Find existing ticket by email thread or subject
     */
    private function findExistingTicket(array $emailData): ?SupportTicket
    {
        $subject = $emailData['subject'] ?? '';
        
        // Look for ticket number in subject
        if (preg_match('/\[TKT-\d{4}-\d{6}\]/', $subject, $matches)) {
            $ticketNumber = trim($matches[0], '[]');
            return SupportTicket::where('ticket_number', $ticketNumber)->first();
        }

        // Look for In-Reply-To header
        $inReplyTo = $emailData['headers']['In-Reply-To'] ?? null;
        if ($inReplyTo) {
            return SupportTicket::where('email_message_id', $inReplyTo)->first();
        }

        // Look for References header
        $references = $emailData['headers']['References'] ?? null;
        if ($references) {
            return SupportTicket::where('email_message_id', $references)->first();
        }

        return null;
    }

    /**
     * Create reply from email
     */
    private function createReplyFromEmail(SupportTicket $ticket, array $emailData, string $emailFile): array
    {
        $reply = $this->replyService->createEmailReply($ticket, [
            'body_text' => $emailData['body_text'],
            'body_html' => $emailData['body_html'],
            'from_email' => $emailData['from_email'],
            'from_name' => $emailData['from_name'],
            'subject' => $emailData['subject'],
            'message_id' => $emailData['message_id'],
            'headers' => $emailData['headers'],
            'received_at' => Carbon::parse($emailData['date']),
            'source' => 'mail_server',
        ]);

        // Process attachments
        foreach ($emailData['attachments'] as $attachment) {
            $this->attachmentService->createEmailAttachment($ticket, $attachment, $reply->id);
        }

        // Archive the email file
        $this->archiveEmailFile($emailFile);

        return [
            'type' => 'reply',
            'ticket_id' => $ticket->id,
            'reply_id' => $reply->id,
        ];
    }

    /**
     * Create ticket from email
     */
    private function createTicketFromEmail(array $emailData, string $emailFile): array
    {
        // Determine tenant from email address
        $tenant = $this->determineTenantFromEmail($emailData['to_email']);
        
        if (!$tenant) {
            Log::warning("Could not determine tenant for email: {$emailData['to_email']}");
            return null;
        }

        $ticketData = [
            'subject' => $emailData['subject'] ?? 'Email Support Request',
            'description' => $emailData['body_text'] ?? '',
            'requester_email' => $emailData['from_email'],
            'requester_name' => $emailData['from_name'],
            'source' => 'email',
            'channel' => 'mail_server',
            'email_message_id' => $emailData['message_id'],
            'email_headers' => $emailData['headers'],
            'tenant_id' => $tenant->id,
        ];

        $ticket = $this->ticketService->createTicket($ticketData, $tenant->id);

        // Process attachments
        foreach ($emailData['attachments'] as $attachment) {
            $this->attachmentService->createEmailAttachment($ticket, $attachment);
        }

        // Archive the email file
        $this->archiveEmailFile($emailFile);

        return [
            'type' => 'ticket',
            'ticket_id' => $ticket->id,
        ];
    }

    /**
     * Determine tenant from email address
     */
    private function determineTenantFromEmail(string $email): ?Tenant
    {
        // Check for tenant-specific email addresses
        if (preg_match('/tenant-(\d+)@/', $email, $matches)) {
            $tenantId = $matches[1];
            return Tenant::find($tenantId);
        }

        // Check for domain-based tenant mapping
        $domain = substr(strrchr($email, '@'), 1);
        return Tenant::where('domain', $domain)->first();
    }

    /**
     * Archive processed email file
     */
    private function archiveEmailFile(string $emailFile): void
    {
        $archiveDir = config('support-tickets.mail_server.archive_path', '/var/mail/processed');
        
        if (!is_dir($archiveDir)) {
            mkdir($archiveDir, 0755, true);
        }

        $filename = basename($emailFile);
        $archivePath = $archiveDir . '/' . date('Y-m-d') . '_' . $filename;
        
        if (file_exists($emailFile)) {
            rename($emailFile, $archivePath);
        }
    }

    /**
     * Test mail server connection
     */
    public function testConnection(): array
    {
        try {
            $host = config('support-tickets.mail_server.imap_host', 'localhost');
            $port = config('support-tickets.mail_server.imap_port', 143);
            $username = config('support-tickets.mail_server.username', 'support');
            $password = config('support-tickets.mail_server.password', 'password123');

            $connection = imap_open(
                "{{$host}:{$port}/imap/notls}INBOX",
                $username,
                $password
            );

            if ($connection) {
                imap_close($connection);
                return ['success' => true, 'message' => 'Connection successful'];
            } else {
                return ['success' => false, 'message' => 'Connection failed'];
            }

        } catch (\Exception $e) {
            return ['success' => false, 'message' => 'Connection error: ' . $e->getMessage()];
        }
    }

    /**
     * Get mail server statistics
     */
    public function getStatistics(): array
    {
        $mailDir = config('support-tickets.mail_server.maildir_path', '/var/mail');
        $archiveDir = config('support-tickets.mail_server.archive_path', '/var/mail/processed');

        $totalEmails = count($this->getEmailFiles($mailDir));
        $archivedEmails = is_dir($archiveDir) ? count(glob($archiveDir . '/*.eml')) : 0;

        return [
            'total_emails' => $totalEmails,
            'archived_emails' => $archivedEmails,
            'mail_directory' => $mailDir,
            'archive_directory' => $archiveDir,
        ];
    }
} 