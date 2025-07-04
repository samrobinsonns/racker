<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\EmailSetting;
use App\Services\SupportTickets\TicketService;
use Illuminate\Support\Facades\Log;

class ProcessEmailQueue implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 minutes timeout
    public $tries = 3; // Retry 3 times if it fails
    
    protected $tenantId;

    /**
     * Create a new job instance.
     */
    public function __construct(?string $tenantId = null)
    {
        $this->tenantId = $tenantId;
        $this->onQueue('emails'); // Use the emails queue
    }

    /**
     * Execute the job.
     */
    public function handle(TicketService $ticketService): void
    {
        Log::info('Starting email queue processing', [
            'tenant_id' => $this->tenantId,
            'job_id' => $this->job->getJobId(),
        ]);

        try {
            if ($this->tenantId) {
                $this->processTenantEmails($this->tenantId, $ticketService);
            } else {
                // Process all tenants with IMAP enabled
                $emailSettings = EmailSetting::where('imap_enabled', true)->get();
                
                foreach ($emailSettings as $settings) {
                    $this->processTenantEmails($settings->tenant_id, $ticketService);
                }
            }

            Log::info('Email queue processing completed successfully', [
                'tenant_id' => $this->tenantId,
                'job_id' => $this->job->getJobId(),
            ]);

        } catch (\Exception $e) {
            Log::error('Email queue processing failed', [
                'tenant_id' => $this->tenantId,
                'job_id' => $this->job->getJobId(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            throw $e; // Re-throw to trigger retry
        }
    }

    /**
     * Process emails for a specific tenant
     */
    private function processTenantEmails(string $tenantId, TicketService $ticketService): void
    {
        $emailSettings = EmailSetting::where('tenant_id', $tenantId)
            ->where('imap_enabled', true)
            ->first();

        if (!$emailSettings) {
            Log::warning("No IMAP settings found for tenant: {$tenantId}");
            return;
        }

        try {
            $connection = $this->connectToImap($emailSettings);
            
            if (!$connection) {
                Log::error("Failed to connect to IMAP for tenant: {$tenantId}");
                return;
            }

            // Get all messages
            $messageCount = imap_num_msg($connection);
            Log::info("Found {$messageCount} messages for tenant {$tenantId}");

            $processedCount = 0;
            for ($i = 1; $i <= $messageCount; $i++) {
                if ($this->processEmail($connection, $i, $emailSettings, $ticketService)) {
                    $processedCount++;
                }
            }

            imap_close($connection);
            
            // Update last check status
            $emailSettings->update([
                'imap_last_check_at' => now(),
                'imap_last_check_successful' => true,
                'imap_last_check_error' => null,
            ]);

            Log::info("Processed {$processedCount} emails for tenant {$tenantId}");

        } catch (\Exception $e) {
            Log::error("Error processing emails for tenant {$tenantId}: " . $e->getMessage());
            
            $emailSettings->update([
                'imap_last_check_at' => now(),
                'imap_last_check_successful' => false,
                'imap_last_check_error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Connect to IMAP server
     */
    private function connectToImap($emailSettings)
    {
        $connectionString = $this->buildImapConnectionString(
            $emailSettings->imap_host,
            $emailSettings->imap_port,
            $emailSettings->imap_encryption,
            $emailSettings->imap_folder
        );

        return @imap_open($connectionString, $emailSettings->imap_username, $emailSettings->imap_password, 0, 1);
    }

    /**
     * Build IMAP connection string
     */
    private function buildImapConnectionString($host, $port, $encryption, $folder)
    {
        $encryptionFlag = '';
        
        switch ($encryption) {
            case 'ssl':
                $encryptionFlag = '/ssl';
                break;
            case 'tls':
                $encryptionFlag = '/tls';
                break;
            case 'none':
                $encryptionFlag = '/notls';
                break;
        }

        return "{{$host}:{$port}/imap{$encryptionFlag}}{$folder}";
    }

    /**
     * Process individual email
     */
    private function processEmail($connection, $messageNumber, $emailSettings, TicketService $ticketService): bool
    {
        try {
            // Get email headers
            $headers = imap_headerinfo($connection, $messageNumber);
            
            if (!$headers) {
                Log::warning("Could not read headers for message {$messageNumber}");
                return false;
            }

            $from = $headers->from[0]->mailbox . '@' . $headers->from[0]->host;
            $rawSubject = $headers->subject ?? 'No Subject';
            $date = date('Y-m-d H:i:s', strtotime($headers->date));

            Log::info("Processing email from {$from} for tenant {$emailSettings->tenant_id}");

            // Check if this looks like a raw email content in the subject
            if ($this->isRawEmailInSubject($rawSubject)) {
                $parsed = $this->parseRawEmailContent($rawSubject);
                $subject = $parsed['subject'];
                $body = $parsed['body'];
                if (!empty($parsed['from'])) {
                    $from = $parsed['from'];
                }
            } else {
                $subject = $rawSubject;
                $result = $this->getEmailBody($connection, $messageNumber);
                $body = $result['body'];
                $rawHtml = $result['raw_html'] ?? null;
            }

            // Check if ticket already exists for this email
            $existingTicket = \App\Models\SupportTicket::where('tenant_id', $emailSettings->tenant_id)
                ->where('source', 'email')
                ->where('source_id', $messageNumber)
                ->first();

            if ($existingTicket) {
                Log::info("Ticket already exists for message {$messageNumber}");
                return false;
            }

            // Validate that we have meaningful content
            if (empty(trim($body))) {
                Log::warning("Email body is empty for message {$messageNumber}, using subject as description");
                $body = "Email content could not be parsed. Subject: {$subject}";
            }

            // Create new support ticket
            $this->createSupportTicket($emailSettings, $from, $subject, $body, $messageNumber, $ticketService, $rawHtml);

            Log::info("Created ticket for message {$messageNumber}");
            return true;

        } catch (\Exception $e) {
            Log::error("Error processing message {$messageNumber}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if the subject contains raw email content
     */
    private function isRawEmailInSubject($subject): bool
    {
        $patterns = [
            "\nFrom:", "\nTo:", "\nSubject:",
            "\r\nFrom:", "\r\nTo:", "\r\nSubject:",
            "\\nFrom:", "\\nTo:", "\\nSubject:",
        ];
        
        foreach ($patterns as $pattern) {
            if (strpos($subject, $pattern) !== false) {
                return true;
            }
        }
        
        if (strpos($subject, "From:") === 0 || strpos($subject, "To:") === 0) {
            return true;
        }
        
        if (preg_match('/(\n|\r\n|\\n)\s*(\n|\r\n|\\n)/', $subject)) {
            return true;
        }
        
        $headerCount = 0;
        $headerPatterns = ['From:', 'To:', 'Subject:', 'Date:', 'Message-ID:'];
        foreach ($headerPatterns as $header) {
            if (strpos($subject, $header) !== false) {
                $headerCount++;
            }
        }
        
        return $headerCount >= 2;
    }

    /**
     * Parse raw email content
     */
    private function parseRawEmailContent($rawContent): array
    {
        $rawContent = str_replace(['\\n', '\n'], "\n", $rawContent);
        $rawContent = str_replace("\r\n", "\n", $rawContent);
        
        $lines = explode("\n", $rawContent);
        $subject = '';
        $body = '';
        $inHeaders = true;
        $headersParsed = false;
        $from = '';
        $subjectLineIndex = null;
        
        $parsedHeaders = [];
        
        for ($i = 0; $i < count($lines); $i++) {
            $line = $lines[$i];
            
            if ($inHeaders && !$headersParsed) {
                if (preg_match('/^([A-Za-z\-]+):\s*(.*)$/', $line, $matches)) {
                    $headerName = strtolower($matches[1]);
                    $headerValue = $matches[2];
                    $parsedHeaders[$headerName] = $headerValue;
                    
                    if ($headerName === 'subject') {
                        $subject = $headerValue;
                        $subjectLineIndex = $i;
                    } elseif ($headerName === 'from') {
                        $from = $this->extractEmailFromHeader($headerValue);
                    }
                } elseif (trim($line) === '') {
                    $inHeaders = false;
                    $headersParsed = true;
                } elseif (!isset($parsedHeaders['subject']) && trim($line) !== '') {
                    $subject = trim($line);
                    $subjectLineIndex = $i;
                    $inHeaders = false;
                    $headersParsed = true;
                    continue;
                }
            } else {
                $body .= $line;
                if ($i < count($lines) - 1) {
                    $body .= "\n";
                }
            }
        }
        
        // If no 'from' found in headers, check the line(s) after the subject
        if (empty($from) && $subjectLineIndex !== null) {
            for ($j = $subjectLineIndex + 1; $j < min($subjectLineIndex + 4, count($lines)); $j++) {
                if (preg_match('/^From:\s*(.*)$/i', $lines[$j], $matches)) {
                    $from = $this->extractEmailFromHeader($matches[1]);
                    break;
                }
            }
        }
        
        $subject = trim($subject);
        $body = trim($body);
        
        if (empty($subject) && !empty($body)) {
            $bodyLines = explode("\n", $body);
            if (count($bodyLines) > 0) {
                $firstLine = trim($bodyLines[0]);
                if (strlen($firstLine) > 0 && strlen($firstLine) < 200) {
                    $subject = $firstLine;
                    array_shift($bodyLines);
                    $body = trim(implode("\n", $bodyLines));
                }
            }
        }
        
        if (strlen($subject) > 255) {
            $subject = substr($subject, 0, 252) . '...';
        }
        
        if (empty($subject)) {
            $subject = 'Email Support Request';
        }
        
        return [
            'subject' => $subject,
            'body' => $body,
            'headers' => $parsedHeaders,
            'from' => $from
        ];
    }

    /**
     * Extract email address from header value
     */
    private function extractEmailFromHeader($header): string
    {
        if (preg_match('/<(.+?)>/', $header, $matches)) {
            return $matches[1];
        }
        
        if (preg_match('/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/', $header, $matches)) {
            return $matches[1];
        }
        
        return $header;
    }

    /**
     * Get email body
     */
    private function getEmailBody($connection, $messageNumber)
    {
        $structure = imap_fetchstructure($connection, $messageNumber);
        
        // Use the improved method that handles both plain text and HTML
        $result = $this->findBestPart($connection, $messageNumber, $structure);
        
        return $result;
    }

    /**
     * Find the best part (plain text or HTML) from the email
     */
    private function findBestPart($connection, $messageNumber, $structure, $partNumberPrefix = '', $attachments = [])
    {
        $bestPlain = null;
        $bestHtml = null;
        $bestPlainLen = 0;
        $bestHtmlLen = 0;

        if (isset($structure->parts) && is_array($structure->parts)) {
            foreach ($structure->parts as $idx => $part) {
                $partNumber = $partNumberPrefix === '' ? ($idx + 1) : ($partNumberPrefix . '.' . ($idx + 1));
                $found = $this->findBestPart($connection, $messageNumber, $part, $partNumber, $attachments);
                
                if ($found['body'] && !$found['raw_html']) {
                    if (strlen($found['body']) > $bestPlainLen) {
                        $bestPlain = $found['body'];
                        $bestPlainLen = strlen($found['body']);
                    }
                } elseif ($found['raw_html'] && strlen($found['raw_html']) > $bestHtmlLen) {
                    $bestHtml = $found['raw_html'];
                    $bestHtmlLen = strlen($found['raw_html']);
                }
            }
        } else {
            $body = imap_fetchbody($connection, $messageNumber, $partNumberPrefix ?: 1);
            if (isset($structure->encoding)) {
                $body = $this->decodeEmailBody($body, $structure->encoding);
            }

            if (isset($structure->subtype) && strtoupper($structure->subtype) === 'HTML') {
                return [
                    'body' => $this->cleanEmailBody($body),
                    'raw_html' => $body
                ];
            } elseif (isset($structure->subtype) && strtoupper($structure->subtype) === 'PLAIN') {
                return [
                    'body' => $this->cleanEmailBody($body),
                    'raw_html' => null
                ];
            }
        }
        
        if ($bestHtml) {
            return [
                'body' => $this->cleanEmailBody($bestHtml),
                'raw_html' => $bestHtml
            ];
        } elseif ($bestPlain) {
            return [
                'body' => $this->cleanEmailBody($bestPlain),
                'raw_html' => null
            ];
        } else {
            return [
                'body' => 'No readable content found',
                'raw_html' => null
            ];
        }
    }

    /**
     * Decode email body based on encoding type
     */
    private function decodeEmailBody($body, $encoding)
    {
        switch ($encoding) {
            case 1: return $body; // 8bit
            case 2: return $body; // binary
            case 3: return base64_decode($body); // base64
            case 4: return quoted_printable_decode($body); // quoted-printable
            default: return $body;
        }
    }

    /**
     * Clean email body
     */
    private function cleanEmailBody($body)
    {
        // Check if this is HTML content
        if (str_contains($body, '<html') || str_contains($body, '<body') || str_contains($body, '<div') || str_contains($body, '<p>')) {
            // For HTML content, preserve formatting but clean up
            $body = $this->cleanHtmlBody($body);
        } else {
            // For plain text, preserve line breaks but clean up excessive whitespace
            $body = imap_utf8($body);
            
            if (strpos($body, '=?') !== false) {
                $body = imap_mime_header_decode($body)[0]->text ?? $body;
            }
            
            $body = strip_tags($body);
            $body = html_entity_decode($body, ENT_QUOTES, 'UTF-8');
            // Preserve line breaks but clean up multiple spaces within lines
            $body = preg_replace('/[ \t]+/', ' ', $body);
            // Normalize line endings
            $body = str_replace(["\r\n", "\r"], "\n", $body);
        }
        
        $body = trim($body);
        
        if (preg_match('/^(From|To|Subject|Date|Message-ID):\s/i', $body)) {
            $lines = explode("\n", $body);
            $bodyStart = 0;
            
            for ($i = 0; $i < count($lines); $i++) {
                if (trim($lines[$i]) === '') {
                    $bodyStart = $i + 1;
                    break;
                }
            }
            
            if ($bodyStart > 0 && $bodyStart < count($lines)) {
                $body = implode("\n", array_slice($lines, $bodyStart));
            }
        }
        
        $body = preg_replace('/^[\r\n\s]*/', '', $body);
        $body = preg_replace('/[\r\n\s]*$/', '', $body);
        $body = preg_replace('/\n{3,}/', "\n\n", $body);
        
        if (strlen($body) > 65535) {
            $body = substr($body, 0, 65532) . '...';
        }
        
        return $body;
    }

    /**
     * Clean HTML email body while preserving formatting
     */
    private function cleanHtmlBody($body)
    {
        // Remove potentially dangerous tags but keep formatting
        $dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
        foreach ($dangerousTags as $tag) {
            $body = preg_replace('/<' . $tag . '[^>]*>.*?<\/' . $tag . '>/is', '', $body);
            $body = preg_replace('/<' . $tag . '[^>]*\/?>/i', '', $body);
        }
        // Remove on* attributes (onclick, onload, etc.)
        $body = preg_replace('/\s+on\w+\s*=\s*["\'][^"\']*["\']/i', '', $body);
        // Remove javascript: URLs
        $body = preg_replace('/javascript:/i', '', $body);
        // Decode HTML entities
        $body = html_entity_decode($body, ENT_QUOTES, 'UTF-8');
        // Do NOT remove style attributes, table, tr, td, th, font, span, img tags
        // Do NOT collapse whitespace or strip tags further
        return $body;
    }

    /**
     * Create support ticket
     */
    private function createSupportTicket($emailSettings, $from, $subject, $body, $messageNumber, TicketService $ticketService, $rawHtml = null)
    {
        $defaultStatus = \App\Models\SupportTicketStatus::where('tenant_id', $emailSettings->tenant_id)->first();
        $defaultPriority = \App\Models\SupportTicketPriority::where('tenant_id', $emailSettings->tenant_id)->first();

        // Check if body contains HTML
        $isHtml = str_contains($body, '<') && str_contains($body, '>');

        $ticketData = [
            'subject' => $subject,
            'description' => $body,
            'raw_html' => $rawHtml,
            'is_html' => $isHtml,
            'requester_email' => $from,
            'requester_name' => $this->extractNameFromEmail($from),
            'status_id' => $defaultStatus->id ?? 1,
            'priority_id' => $defaultPriority->id ?? 1,
            'category_id' => null,
            'source' => 'email',
            'source_id' => $messageNumber,
        ];

        $ticket = $ticketService->createTicket($ticketData, $emailSettings->tenant_id);

        Log::info("Created support ticket from email", [
            'ticket_id' => $ticket->id,
            'ticket_number' => $ticket->ticket_number,
            'from' => $from,
            'subject' => $subject,
            'tenant_id' => $emailSettings->tenant_id,
            'contact_id' => $ticket->contact_id,
        ]);

        return $ticket;
    }

    /**
     * Extract name from email
     */
    private function extractNameFromEmail($email)
    {
        $parts = explode('@', $email);
        $username = $parts[0];
        
        $name = str_replace(['.', '_', '-'], ' ', $username);
        return ucwords($name);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Email queue processing job failed', [
            'tenant_id' => $this->tenantId,
            'job_id' => $this->job->getJobId(),
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }
} 