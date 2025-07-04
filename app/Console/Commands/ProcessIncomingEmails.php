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
            $result = $this->getEmailBody($connection, $messageNumber);
            $body = $result['body'];
            $rawHtml = $result['raw_html'] ?? null;
        }

        $this->info("Final subject: {$subject}");
        $this->info("Subject length: " . strlen($subject));
        $this->info("Body length: " . strlen($body));
        $this->info("Body preview (first 100 chars): " . substr($body, 0, 100));
        if ($rawHtml) {
            $this->info("HTML content available: " . strlen($rawHtml) . " characters");
        }

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
            $this->createSupportTicket($emailSettings, $from, $subject, $body, $messageNumber, $rawHtml);

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
        
        $this->info("DEBUG: Raw content after normalization:");
        $this->info(substr($rawContent, 0, 200) . "...");
        
        $lines = explode("\n", $rawContent);
        $subject = '';
        $body = '';
        $inHeaders = true;
        $headersParsed = false;
        $from = '';
        
        $parsedHeaders = [];
        $subjectLineIndex = null;
        
        for ($i = 0; $i < count($lines); $i++) {
            $line = $lines[$i];
            
            if ($inHeaders && !$headersParsed) {
                // Parse header lines
                if (preg_match('/^([A-Za-z\-]+):\s*(.*)$/', $line, $matches)) {
                    $headerName = strtolower($matches[1]);
                    $headerValue = $matches[2];
                    $parsedHeaders[$headerName] = $headerValue;
                    $this->info("DEBUG: Found header: {$headerName} = {$headerValue}");
                    if ($headerName === 'subject') {
                        $subject = $headerValue;
                        $subjectLineIndex = $i;
                    } elseif ($headerName === 'from') {
                        $from = $this->extractEmailFromHeader($headerValue);
                        $this->info("DEBUG: Extracted from email: {$from}");
                    }
                } elseif (trim($line) === '') {
                    // Empty line indicates end of headers
                    $inHeaders = false;
                    $headersParsed = true;
                    $this->info("DEBUG: End of headers detected");
                } elseif (!isset($parsedHeaders['subject']) && trim($line) !== '') {
                    // If no proper headers found and we have content, treat first line as subject
                    $subject = trim($line);
                    $subjectLineIndex = $i;
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
        
        // If no 'from' found in headers, check the line(s) after the subject for a 'From:' header
        if (empty($from) && $subjectLineIndex !== null) {
            for ($j = $subjectLineIndex + 1; $j < min($subjectLineIndex + 4, count($lines)); $j++) {
                if (preg_match('/^From:\s*(.*)$/i', $lines[$j], $matches)) {
                    $from = $this->extractEmailFromHeader($matches[1]);
                    $this->info("DEBUG: Extracted from email after subject: {$from}");
                    break;
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
        
        $this->info("DEBUG: Final parsed results - subject: '{$subject}', from: '{$from}'");
        
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
        // Check if this is HTML content
        if (str_contains($body, '<html') || str_contains($body, '<body') || str_contains($body, '<div') || str_contains($body, '<p>')) {
            // For HTML content, preserve formatting but clean up
            $body = $this->cleanHtmlBody($body);
        } else {
            // For plain text, preserve line breaks but clean up excessive whitespace
            $body = imap_utf8($body);
            
            // Handle base64 or quoted-printable encoding if present
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

    private function createSupportTicket($emailSettings, $from, $subject, $body, $messageNumber, $rawHtml = null)
    {
        // Get first available status and priority for this tenant, or use defaults
        $defaultStatus = SupportTicketStatus::where('tenant_id', $emailSettings->tenant_id)->first();
        $defaultPriority = SupportTicketPriority::where('tenant_id', $emailSettings->tenant_id)->first();

        // Check if body contains HTML
        $isHtml = str_contains($body, '<') && str_contains($body, '>');

        // Prepare ticket data for TicketService
        $ticketData = [
            'subject' => $subject,
            'description' => $body,
            'raw_html' => $rawHtml,
            'is_html' => $isHtml,
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