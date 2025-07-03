<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\EmailSetting;
use App\Models\SupportTicket;
use App\Models\SupportTicketStatus;
use App\Models\SupportTicketPriority;
use App\Models\User;
use App\Services\SupportTickets\TicketService;
use Illuminate\Support\Facades\Log;

class ProcessIncomingEmails extends Command
{
    protected $signature = 'emails:process {tenant_id? : The tenant ID to process emails for}';
    protected $description = 'Process incoming emails and create support tickets';

    protected TicketService $ticketService;

    public function __construct(TicketService $ticketService)
    {
        parent::__construct();
        $this->ticketService = $ticketService;
    }

    public function handle()
    {
        $tenantId = $this->argument('tenant_id');

        if ($tenantId) {
            $this->processTenantEmails($tenantId);
        } else {
            // Process all tenants with IMAP enabled
            $emailSettings = EmailSetting::where('imap_enabled', true)->get();
            
            foreach ($emailSettings as $settings) {
                $this->processTenantEmails($settings->tenant_id);
            }
        }

        $this->info('Email processing completed.');
    }

    private function processTenantEmails($tenantId)
    {
        $this->info("Processing emails for tenant: {$tenantId}");

        $emailSettings = EmailSetting::where('tenant_id', $tenantId)
            ->where('imap_enabled', true)
            ->first();

        if (!$emailSettings) {
            $this->warn("No IMAP settings found for tenant: {$tenantId}");
            return;
        }

        try {
            $connection = $this->connectToImap($emailSettings);
            
            if (!$connection) {
                $this->error("Failed to connect to IMAP for tenant: {$tenantId}");
                return;
            }

            // Get all messages
            $messageCount = imap_num_msg($connection);
            $this->info("Found {$messageCount} messages in mailbox");

            for ($i = 1; $i <= $messageCount; $i++) {
                $this->processEmail($connection, $i, $emailSettings);
            }

            imap_close($connection);
            
            // Update last check status
            $emailSettings->update([
                'imap_last_check_at' => now(),
                'imap_last_check_successful' => true,
                'imap_last_check_error' => null,
            ]);

        } catch (\Exception $e) {
            $this->error("Error processing emails for tenant {$tenantId}: " . $e->getMessage());
            
            $emailSettings->update([
                'imap_last_check_at' => now(),
                'imap_last_check_successful' => false,
                'imap_last_check_error' => $e->getMessage(),
            ]);
        }
    }

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

    private function processEmail($connection, $messageNumber, $emailSettings)
    {
        try {
            // Get email headers
            $headers = imap_headerinfo($connection, $messageNumber);
            
            if (!$headers) {
                $this->warn("Could not read headers for message {$messageNumber}");
                return;
            }

            $from = $headers->from[0]->mailbox . '@' . $headers->from[0]->host;
            $rawSubject = $headers->subject ?? 'No Subject';
            $date = date('Y-m-d H:i:s', strtotime($headers->date));

            $this->info("Processing email from {$from}");
            $this->info("Raw subject preview: " . substr($rawSubject, 0, 100) . "...");

            // Check if this looks like a raw email content in the subject (mailserver issue)
            if ($this->isRawEmailInSubject($rawSubject)) {
                $this->info("Detected raw email content in subject - parsing manually");
                $parsed = $this->parseRawEmailContent($rawSubject);
                $subject = $parsed['subject'];
                $body = $parsed['body'];
                // Use the extracted sender if available
                if (!empty($parsed['from'])) {
                    $from = $parsed['from'];
                    $this->info("Using extracted sender: {$from}");
                }
            } else {
                $subject = $rawSubject;
                $body = $this->getEmailBody($connection, $messageNumber);
            }

            $this->info("Final subject: {$subject}");
            $this->info("Subject length: " . strlen($subject));
            $this->info("Body length: " . strlen($body));
            $this->info("Body preview (first 100 chars): " . substr($body, 0, 100));

            // Check if ticket already exists for this email
            $existingTicket = SupportTicket::where('tenant_id', $emailSettings->tenant_id)
                ->where('source', 'email')
                ->where('source_id', $messageNumber)
                ->first();

            if ($existingTicket) {
                $this->info("Ticket already exists for message {$messageNumber}");
                return;
            }

            // Validate that we have meaningful content
            if (empty(trim($body))) {
                $this->warn("Email body is empty for message {$messageNumber}, using subject as description");
                $body = "Email content could not be parsed. Subject: {$subject}";
            }

            // Create new support ticket
            $this->createSupportTicket($emailSettings, $from, $subject, $body, $messageNumber);

            $this->info("Created ticket for message {$messageNumber}");

        } catch (\Exception $e) {
            $this->error("Error processing message {$messageNumber}: " . $e->getMessage());
            Log::error("Error processing email message {$messageNumber}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'tenant_id' => $emailSettings->tenant_id
            ]);
        }
    }

    /**
     * Check if the subject contains raw email content
     */
    private function isRawEmailInSubject($subject): bool
    {
        // Handle different types of newline characters and escape sequences
        $patterns = [
            // Standard newlines
            "\nFrom:",
            "\nTo:",
            "\nSubject:",
            // Windows line endings
            "\r\nFrom:",
            "\r\nTo:", 
            "\r\nSubject:",
            // Escaped newlines (literal \n)
            "\\nFrom:",
            "\\nTo:",
            "\\nSubject:",
        ];
        
        foreach ($patterns as $pattern) {
            if (strpos($subject, $pattern) !== false) {
                return true;
            }
        }
        
        // Check if starts with header patterns
        if (strpos($subject, "From:") === 0 || strpos($subject, "To:") === 0) {
            return true;
        }
        
        // Check for double newlines (any type)
        if (preg_match('/(\n|\r\n|\\n)\s*(\n|\r\n|\\n)/', $subject)) {
            return true;
        }
        
        // Check for multiple header-like patterns
        $headerCount = 0;
        $headerPatterns = ['From:', 'To:', 'Subject:', 'Date:', 'Message-ID:'];
        foreach ($headerPatterns as $header) {
            if (strpos($subject, $header) !== false) {
                $headerCount++;
            }
        }
        
        return $headerCount >= 2; // If we find 2+ headers, it's likely raw email
    }

    /**
     * Parse raw email content to extract subject and body
     */
    private function parseRawEmailContent($rawContent): array
    {
        // First, normalize line endings and handle escaped newlines
        $rawContent = str_replace(['\\n', '\n'], "\n", $rawContent); // Convert escaped newlines
        $rawContent = str_replace("\r\n", "\n", $rawContent); // Normalize Windows line endings
        
        $lines = explode("\n", $rawContent);
        $subject = '';
        $body = '';
        $inHeaders = true;
        $headersParsed = false;
        $from = '';
        
        $parsedHeaders = [];
        
        for ($i = 0; $i < count($lines); $i++) {
            $line = $lines[$i];
            
            if ($inHeaders && !$headersParsed) {
                // Parse header lines
                if (preg_match('/^([A-Za-z\-]+):\s*(.*)$/', $line, $matches)) {
                    $headerName = strtolower($matches[1]);
                    $headerValue = $matches[2];
                    $parsedHeaders[$headerName] = $headerValue;
                    
                    if ($headerName === 'subject') {
                        $subject = $headerValue;
                    } elseif ($headerName === 'from') {
                        $from = $this->extractEmailFromHeader($headerValue);
                    }
                } elseif (trim($line) === '') {
                    // Empty line indicates end of headers
                    $inHeaders = false;
                    $headersParsed = true;
                } elseif (!isset($parsedHeaders['subject']) && trim($line) !== '') {
                    // If no proper headers found and we have content, treat first line as subject
                    $subject = trim($line);
                    $inHeaders = false;
                    $headersParsed = true;
                    continue; // Don't add this line to body
                }
            } else {
                // This is body content
                $body .= $line;
                if ($i < count($lines) - 1) {
                    $body .= "\n";
                }
            }
        }
        
        // Clean up the results
        $subject = trim($subject);
        $body = trim($body);
        
        // If no subject was found in headers, try to extract from content
        if (empty($subject) && !empty($body)) {
            $bodyLines = explode("\n", $body);
            if (count($bodyLines) > 0) {
                $firstLine = trim($bodyLines[0]);
                if (strlen($firstLine) > 0 && strlen($firstLine) < 200) {
                    $subject = $firstLine;
                    // Remove the first line from body
                    array_shift($bodyLines);
                    $body = trim(implode("\n", $bodyLines));
                }
            }
        }
        
        // Ensure subject length limit
        if (strlen($subject) > 255) {
            $subject = substr($subject, 0, 252) . '...';
        }
        
        // If still no subject, provide default
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
        // Try to extract email from "Name <email@example.com>" format
        if (preg_match('/<(.+?)>/', $header, $matches)) {
            return $matches[1];
        }
        
        // If no angle brackets, try to find the first email-like string
        if (preg_match('/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/', $header, $matches)) {
            return $matches[1];
        }
        
        // If no email found, return the whole header
        return $header;
    }

    private function getEmailBody($connection, $messageNumber)
    {
        $structure = imap_fetchstructure($connection, $messageNumber);
        
        // Debug the email structure
        $this->info("Email structure type: " . $structure->type);
        if (isset($structure->parts)) {
            $this->info("Email has " . count($structure->parts) . " parts");
        }
        
        if ($structure->type == 0) {
            // Simple plain text message
            $this->info("Processing as plain text message");
            $body = imap_fetchbody($connection, $messageNumber, 1);
            
            // Handle encoding
            if (isset($structure->encoding)) {
                $body = $this->decodeEmailBody($body, $structure->encoding);
            }
            
            return $this->cleanEmailBody($body);
        } elseif ($structure->type == 1) {
            // Multipart message
            $this->info("Processing as multipart message");
            
            if (isset($structure->parts)) {
                // Look for text/plain part first
                foreach ($structure->parts as $partNumber => $part) {
                    $this->info("Part " . ($partNumber + 1) . " - Type: {$part->type}, Subtype: " . strtolower($part->subtype));
                    
                    if ($part->type == 0 && strtolower($part->subtype) == 'plain') {
                        $this->info("Found plain text part at position " . ($partNumber + 1));
                        $body = imap_fetchbody($connection, $messageNumber, $partNumber + 1);
                        
                        // Handle encoding
                        if (isset($part->encoding)) {
                            $body = $this->decodeEmailBody($body, $part->encoding);
                        }
                        
                        return $this->cleanEmailBody($body);
                    }
                }
                
                // If no plain text found, try text/html
                foreach ($structure->parts as $partNumber => $part) {
                    if ($part->type == 0 && strtolower($part->subtype) == 'html') {
                        $this->info("No plain text found, using HTML part at position " . ($partNumber + 1));
                        $body = imap_fetchbody($connection, $messageNumber, $partNumber + 1);
                        
                        // Handle encoding
                        if (isset($part->encoding)) {
                            $body = $this->decodeEmailBody($body, $part->encoding);
                        }
                        
                        // Strip HTML tags to get plain text
                        $body = strip_tags($body);
                        return $this->cleanEmailBody($body);
                    }
                }
                
                // If still nothing found, try the first part
                if (isset($structure->parts[0])) {
                    $this->info("No specific text part found, using first part");
                    $body = imap_fetchbody($connection, $messageNumber, 1);
                    
                    // Handle encoding
                    if (isset($structure->parts[0]->encoding)) {
                        $body = $this->decodeEmailBody($body, $structure->parts[0]->encoding);
                    }
                    
                    return $this->cleanEmailBody($body);
                }
            }
        }

        // Fallback - get the whole message body
        $this->info("Using fallback method to get email body");
        $body = imap_fetchbody($connection, $messageNumber, 1);
        
        // Try to handle encoding if we have structure info
        if (isset($structure->encoding)) {
            $body = $this->decodeEmailBody($body, $structure->encoding);
        }
        
        return $this->cleanEmailBody($body);
    }

    /**
     * Decode email body based on encoding type
     */
    private function decodeEmailBody($body, $encoding)
    {
        switch ($encoding) {
            case 1: // 8bit
                return $body;
            case 2: // binary
                return $body;
            case 3: // base64
                return base64_decode($body);
            case 4: // quoted-printable
                return quoted_printable_decode($body);
            default:
                return $body;
        }
    }

    private function cleanEmailBody($body)
    {
        // Decode if needed
        $body = imap_utf8($body);
        
        // Handle base64 or quoted-printable encoding if present
        if (strpos($body, '=?') !== false) {
            $body = imap_mime_header_decode($body)[0]->text ?? $body;
        }
        
        // Simple cleanup - just remove extra whitespace and common email artifacts
        $body = trim($body);
        
        // Remove any remaining raw email headers only if they appear at the very beginning
        // Only remove if the body starts with obvious header patterns
        if (preg_match('/^(From|To|Subject|Date|Message-ID):\s/i', $body)) {
            $lines = explode("\n", $body);
            $bodyStart = 0;
            
            // Find the first empty line (end of headers)
            for ($i = 0; $i < count($lines); $i++) {
                if (trim($lines[$i]) === '') {
                    $bodyStart = $i + 1;
                    break;
                }
            }
            
            // Take everything after the empty line
            if ($bodyStart > 0 && $bodyStart < count($lines)) {
                $body = implode("\n", array_slice($lines, $bodyStart));
            }
        }
        
        // Clean up common email artifacts
        $body = preg_replace('/^[\r\n\s]*/', '', $body); // Remove leading whitespace
        $body = preg_replace('/[\r\n\s]*$/', '', $body); // Remove trailing whitespace
        
        // Remove excessive line breaks (more than 2 consecutive)
        $body = preg_replace('/\n{3,}/', "\n\n", $body);
        
        // Limit length to prevent database issues
        if (strlen($body) > 65535) {
            $body = substr($body, 0, 65532) . '...';
        }
        
        return $body;
    }

    private function createSupportTicket($emailSettings, $from, $subject, $body, $messageNumber)
    {
        // Get first available status and priority for this tenant, or use defaults
        $defaultStatus = SupportTicketStatus::where('tenant_id', $emailSettings->tenant_id)->first();
        $defaultPriority = SupportTicketPriority::where('tenant_id', $emailSettings->tenant_id)->first();

        // Prepare ticket data for TicketService
        $ticketData = [
            'subject' => $subject,
            'description' => $body,
            'requester_email' => $from,
            'requester_name' => $this->extractNameFromEmail($from),
            'status_id' => $defaultStatus->id ?? 1,
            'priority_id' => $defaultPriority->id ?? 1,
            'category_id' => null, // Set to null for email-created tickets
            'source' => 'email',
            'source_id' => $messageNumber,
        ];

        // Use TicketService to create the ticket (this will auto-create/link contact)
        $ticket = $this->ticketService->createTicket($ticketData, $emailSettings->tenant_id);

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

    private function extractNameFromEmail($email)
    {
        $parts = explode('@', $email);
        $username = $parts[0];
        
        // Convert username to readable name
        $name = str_replace(['.', '_', '-'], ' ', $username);
        return ucwords($name);
    }
} 