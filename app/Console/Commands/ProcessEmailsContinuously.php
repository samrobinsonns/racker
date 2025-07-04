<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\ProcessEmailQueue;
use Illuminate\Support\Facades\Log;
use App\Models\EmailSetting;
use App\Services\SupportTickets\TicketService;

class ProcessEmailsContinuously extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'emails:process-continuously 
                            {--frequency=60 : Frequency in seconds between email checks (default: 60)}
                            {--debug : Enable debug output for MIME structure and part selection}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Continuously process emails with configurable frequency for development';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $frequency = (int) $this->option('frequency');
        $debug = $this->option('debug');
        $this->debugMode = $debug;
        
        $this->info("Starting continuous email processing...");
        $this->info("Frequency: {$frequency} seconds");
        $this->info("Press Ctrl+C to stop");
        $this->newLine();

        $iteration = 1;
        
        while (true) {
            try {
                $this->info("[" . now()->format('Y-m-d H:i:s') . "] Iteration {$iteration}: Processing emails...");
                
                // Process emails directly instead of using queue
                $this->processAllTenantEmails();
                
                $this->info("[" . now()->format('Y-m-d H:i:s') . "] Email processing completed");
                
                // Wait for the specified frequency
                $this->info("Waiting {$frequency} seconds until next check...");
                sleep($frequency);
                
                $iteration++;
                
            } catch (\Exception $e) {
                $this->error("Error in iteration {$iteration}: " . $e->getMessage());
                Log::error("Continuous email processing error", [
                    'iteration' => $iteration,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                
                // Wait a bit before retrying
                sleep(10);
            }
        }
    }

    /**
     * Process emails for all tenants with IMAP enabled
     */
    private function processAllTenantEmails(): void
    {
        $emailSettings = EmailSetting::where('imap_enabled', true)->get();
        
        if ($emailSettings->isEmpty()) {
            $this->warn("No IMAP-enabled email settings found");
            return;
        }

        $this->info("Found " . $emailSettings->count() . " IMAP-enabled tenants");
        
        foreach ($emailSettings as $settings) {
            $this->processTenantEmails($settings);
        }
    }

    /**
     * Process emails for a specific tenant
     */
    private function processTenantEmails($emailSettings): void
    {
        try {
            $connection = $this->connectToImap($emailSettings);
            
            if (!$connection) {
                $this->error("Failed to connect to IMAP for tenant: {$emailSettings->tenant_id}");
                return;
            }

            // Get all unread messages
            $processedCount = 0;
            $unreadEmails = imap_search($connection, 'UNSEEN');
            if ($unreadEmails) {
                foreach ($unreadEmails as $msgNum) {
                    if ($this->processEmail($connection, $msgNum, $emailSettings)) {
                        $processedCount++;
                    }
                }
            }

            imap_close($connection);
            
            if ($processedCount > 0) {
                $this->info("Processed {$processedCount} emails for tenant {$emailSettings->tenant_id}");
            }

            // Update last check status
            $emailSettings->update([
                'imap_last_check_at' => now(),
                'imap_last_check_successful' => true,
                'imap_last_check_error' => null,
            ]);

        } catch (\Exception $e) {
            $this->error("Error processing emails for tenant {$emailSettings->tenant_id}: " . $e->getMessage());
            
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
    private function processEmail($connection, $messageNumber, $emailSettings): bool
    {
        try {
            // Get email headers
            $headers = imap_headerinfo($connection, $messageNumber);
            if (!$headers) {
                return false;
            }
            // Log the MIME structure for debugging
            $structure = imap_fetchstructure($connection, $messageNumber);
            if ($this->option('debug')) {
                $this->info("[DEBUG] Full MIME structure: " . json_encode($structure));
                \Log::info('[DEBUG] Full MIME structure', ['structure' => $structure]);
            }
            $from = $headers->from[0]->mailbox . '@' . $headers->from[0]->host;
            $rawSubject = $headers->subject ?? 'No Subject';
            $date = date('Y-m-d H:i:s', strtotime($headers->date));
            if ($this->isRawEmailInSubject($rawSubject)) {
                $parsed = $this->parseRawEmailContent($rawSubject);
                $subject = $parsed['subject'];
                $body = $parsed['body'];
                $rawHtml = null;
                if (!empty($parsed['from'])) {
                    $from = $parsed['from'];
                }
            } else {
                $subject = $rawSubject;
                $bodyParts = $this->getEmailBody($connection, $messageNumber);
                $body = $bodyParts['body'];
                $rawHtml = $bodyParts['raw_html'] ?? null;
            }
            $existingTicket = \App\Models\SupportTicket::where('tenant_id', $emailSettings->tenant_id)
                ->where('source', 'email')
                ->where('source_id', $messageNumber)
                ->first();
            if ($existingTicket) {
                return false; // Already processed
            }
            $this->createSupportTicket($emailSettings, $from, $subject, $body, $messageNumber, $rawHtml);
            imap_setflag_full($connection, $messageNumber, "\\Seen");
            return true;
        } catch (\Exception $e) {
            $this->error("Error processing email {$messageNumber}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if subject contains raw email content
     */
    private function isRawEmailInSubject($subject): bool
    {
        return str_contains($subject, 'From:') && 
               str_contains($subject, 'Subject:') && 
               str_contains($subject, 'Date:');
    }

    /**
     * Parse raw email content from subject
     */
    private function parseRawEmailContent($rawContent): array
    {
        $lines = explode("\n", $rawContent);
        $from = '';
        $subject = '';
        $body = '';
        $inBody = false;

        foreach ($lines as $line) {
            $line = trim($line);
            
            if (empty($line)) {
                $inBody = true;
                continue;
            }

            if (!$inBody) {
                if (str_starts_with($line, 'From:')) {
                    $from = $this->extractEmailFromHeader($line);
                } elseif (str_starts_with($line, 'Subject:')) {
                    $subject = trim(substr($line, 8));
                }
            } else {
                $body .= $line . "\n";
            }
        }

        return [
            'from' => $from,
            'subject' => $subject,
            'body' => trim($body)
        ];
    }

    /**
     * Extract email from header line
     */
    private function extractEmailFromHeader($header): string
    {
        if (preg_match('/<(.+?)>/', $header, $matches)) {
            return $matches[1];
        }
        
        if (preg_match('/[\w\.-]+@[\w\.-]+\.\w+/', $header, $matches)) {
            return $matches[0];
        }
        
        return '';
    }

    /**
     * Recursively search for the best HTML or plain text part in any MIME structure, and extract CID images.
     */
    private function getEmailBody($connection, $messageNumber)
    {
        $structure = imap_fetchstructure($connection, $messageNumber);
        if (!$structure) {
            return [
                'body' => 'No body content',
                'raw_html' => null
            ];
        }
        $attachments = $this->extractAttachments($connection, $messageNumber, $structure);
        $result = $this->findBestPart($connection, $messageNumber, $structure, '', $attachments);
        // If HTML, replace cid: links with data URLs
        if ($result['raw_html']) {
            $result['raw_html'] = $this->replaceCidImages($result['raw_html'], $attachments);
        }
        return [
            'body' => $result['body'],
            'raw_html' => $result['raw_html']
        ];
    }

    /**
     * Recursively find the largest HTML part (fallback to largest plain text) in any MIME structure.
     * Handles deeply nested multiparts, multipart/alternative, multipart/related, etc.
     * Returns: [ 'body' => plain text or null, 'raw_html' => HTML or null ]
     */
    private function findBestPart($connection, $messageNumber, $structure, $partNumberPrefix = '', $attachments = [])
    {
        $bestHtml = null;
        $bestHtmlLen = 0;
        $bestPlain = null;
        $bestPlainLen = 0;

        // Debug: print structure info
        if (property_exists($this, 'debugMode') && $this->debugMode) {
            $type = isset($structure->type) ? $structure->type : null;
            $subtype = isset($structure->subtype) ? strtoupper($structure->subtype) : '';
            $this->info("[DEBUG] Traversing part: partNumber={$partNumberPrefix} type={$type} subtype={$subtype}");
            \Log::info('[DEBUG] Traversing part', ['partNumber' => $partNumberPrefix, 'type' => $type, 'subtype' => $subtype]);
        }

        // If this part has subparts, recurse into them
        if (isset($structure->parts) && is_array($structure->parts)) {
            foreach ($structure->parts as $idx => $part) {
                $partNumber = $partNumberPrefix === '' ? ($idx + 1) : ($partNumberPrefix . '.' . ($idx + 1));
                $found = $this->findBestPart($connection, $messageNumber, $part, $partNumber, $attachments);
                if ($found['raw_html'] && strlen($found['raw_html']) > $bestHtmlLen) {
                    $bestHtml = $found['raw_html'];
                    $bestHtmlLen = strlen($found['raw_html']);
                    if (property_exists($this, 'debugMode') && $this->debugMode) {
                        $this->info("[DEBUG] Found HTML part at {$partNumber} (len={$bestHtmlLen})");
                        \Log::info('[DEBUG] Found HTML part', ['partNumber' => $partNumber, 'length' => $bestHtmlLen]);
                    }
                }
                if ($found['body'] && strlen($found['body']) > $bestPlainLen) {
                    $bestPlain = $found['body'];
                    $bestPlainLen = strlen($found['body']);
                    if (property_exists($this, 'debugMode') && $this->debugMode) {
                        $this->info("[DEBUG] Found plain part at {$partNumber} (len={$bestPlainLen})");
                        \Log::info('[DEBUG] Found plain part', ['partNumber' => $partNumber, 'length' => $bestPlainLen]);
                    }
                }
            }
        } else {
            // This is a leaf part
            $subtype = isset($structure->subtype) ? strtoupper($structure->subtype) : '';
            $type = isset($structure->type) ? $structure->type : null;
            $isText = ($type === 0); // 0 = text, 1 = multipart, 2 = message, etc.
            $body = imap_fetchbody($connection, $messageNumber, $partNumberPrefix ?: 1);
            if (isset($structure->encoding)) {
                $body = $this->decodeEmailBody($body, $structure->encoding);
            }
            if (property_exists($this, 'debugMode') && $this->debugMode) {
                $preview = mb_substr($body, 0, 100);
                $this->info("[DEBUG] Leaf part: partNumber={$partNumberPrefix} type={$type} subtype={$subtype} preview=" . str_replace("\n", " ", $preview));
                \Log::info('[DEBUG] Leaf part', ['partNumber' => $partNumberPrefix, 'type' => $type, 'subtype' => $subtype, 'preview' => $preview]);
            }
            if ($isText && $subtype === 'HTML') {
                // HTML part
                if (property_exists($this, 'debugMode') && $this->debugMode) {
                    $this->info("[DEBUG] Returning HTML part at {$partNumberPrefix}");
                    \Log::info('[DEBUG] Returning HTML part', ['partNumber' => $partNumberPrefix]);
                }
                return [ 'body' => null, 'raw_html' => $body ];
            } elseif ($isText && $subtype === 'PLAIN') {
                // Plain text part
                if (property_exists($this, 'debugMode') && $this->debugMode) {
                    $this->info("[DEBUG] Returning plain part at {$partNumberPrefix}");
                    \Log::info('[DEBUG] Returning plain part', ['partNumber' => $partNumberPrefix]);
                }
                return [ 'body' => $this->cleanEmailBody($body), 'raw_html' => null ];
            }
            // Some emails (esp. Outlook) use text/richtext or text/enriched
            elseif ($isText && in_array($subtype, ['ENRICHED', 'RICHTEXT'])) {
                // Optionally convert to plain text
                $plain = strip_tags($body);
                if (property_exists($this, 'debugMode') && $this->debugMode) {
                    $this->info("[DEBUG] Returning enriched/richtext part at {$partNumberPrefix}");
                    \Log::info('[DEBUG] Returning enriched/richtext part', ['partNumber' => $partNumberPrefix]);
                }
                return [ 'body' => $this->cleanEmailBody($plain), 'raw_html' => null ];
            }
        }
        // Prefer HTML if found, otherwise plain text
        if ($bestHtml) {
            if (property_exists($this, 'debugMode') && $this->debugMode) {
                $this->info("[DEBUG] Chose HTML part (len={$bestHtmlLen})");
                \Log::info('[DEBUG] Chose HTML part', ['length' => $bestHtmlLen]);
            }
            return [ 'body' => null, 'raw_html' => $bestHtml ];
        } elseif ($bestPlain) {
            if (property_exists($this, 'debugMode') && $this->debugMode) {
                $this->info("[DEBUG] Chose plain part (len={$bestPlainLen})");
                \Log::info('[DEBUG] Chose plain part', ['length' => $bestPlainLen]);
            }
            return [ 'body' => $bestPlain, 'raw_html' => null ];
        } else {
            if (property_exists($this, 'debugMode') && $this->debugMode) {
                $this->info("[DEBUG] No readable content found");
                \Log::info('[DEBUG] No readable content found');
            }
            return [ 'body' => 'No readable content found', 'raw_html' => null ];
        }
    }

    /**
     * Extract attachments and map Content-ID to base64 data URLs
     */
    private function extractAttachments($connection, $messageNumber, $structure, $partNumberPrefix = '', &$attachments = [])
    {
        if (isset($structure->parts) && is_array($structure->parts)) {
            foreach ($structure->parts as $idx => $part) {
                $partNumber = $partNumberPrefix === '' ? ($idx + 1) : ($partNumberPrefix . '.' . ($idx + 1));
                $this->extractAttachments($connection, $messageNumber, $part, $partNumber, $attachments);
            }
        } else {
            $isAttachment = false;
            $cid = null;
            if (isset($structure->disposition) && strtolower($structure->disposition) === 'attachment') {
                $isAttachment = true;
            }
            if (isset($structure->ifid) && $structure->ifid && isset($structure->id)) {
                $cid = trim($structure->id, '<>');
                $isAttachment = true;
            }
            if ($isAttachment && $cid) {
                $body = imap_fetchbody($connection, $messageNumber, $partNumberPrefix ?: 1);
                if (isset($structure->encoding)) {
                    $body = $this->decodeEmailBody($body, $structure->encoding);
                }
                $mime = $this->getMimeType($structure);
                $attachments[$cid] = 'data:' . $mime . ';base64,' . base64_encode($body);
            }
        }
        return $attachments;
    }

    /**
     * Replace <img src="cid:..."> with data URLs from attachments
     */
    private function replaceCidImages($html, $attachments)
    {
        return preg_replace_callback('/<img[^>]+src=["\"]cid:([^"\">]+)["\"][^>]*>/i', function ($matches) use ($attachments) {
            $cid = $matches[1];
            if (isset($attachments[$cid])) {
                return str_replace('cid:' . $cid, $attachments[$cid], $matches[0]);
            }
            return $matches[0];
        }, $html);
    }

    /**
     * Get MIME type from structure
     */
    private function getMimeType($structure)
    {
        $primary = [
            0 => 'text',
            1 => 'multipart',
            2 => 'message',
            3 => 'application',
            4 => 'audio',
            5 => 'image',
            6 => 'video',
            7 => 'other',
        ];
        $type = isset($primary[$structure->type]) ? $primary[$structure->type] : 'application';
        $subtype = isset($structure->subtype) ? strtolower($structure->subtype) : 'octet-stream';
        return $type . '/' . $subtype;
    }

    /**
     * Decode email body based on encoding
     */
    private function decodeEmailBody($body, $encoding)
    {
        switch ($encoding) {
            case 3: // BASE64
                return base64_decode($body);
            case 4: // QUOTED-PRINTABLE
                return quoted_printable_decode($body);
            default:
                return $body;
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
            $body = strip_tags($body);
            $body = html_entity_decode($body, ENT_QUOTES, 'UTF-8');
            // Preserve line breaks but clean up multiple spaces within lines
            $body = preg_replace('/[ \t]+/', ' ', $body);
            // Normalize line endings
            $body = str_replace(["\r\n", "\r"], "\n", $body);
        }
        
        return trim($body);
    }

    /**
     * Clean HTML email body while preserving formatting and allowing safe styles
     */
    private function cleanHtmlBody($body)
    {
        // Remove potentially dangerous tags but keep formatting
        $dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
        foreach ($dangerousTags as $tag) {
            $body = preg_replace('/<' . $tag . '[^>]*>.*?<\/' . $tag . '>/is', '', $body);
            $body = preg_replace('/<' . $tag . '[^>]*\/?\>/i', '', $body);
        }
        // Remove on* attributes (onclick, onload, etc.)
        $body = preg_replace('/\s+on\w+\s*=\s*(["\"][^"\"]*["\"]|[^\s>]*)/i', '', $body);
        // Remove javascript: URLs
        $body = preg_replace('/javascript:/i', '', $body);
        // Remove dangerous style properties from style attributes
        $body = preg_replace_callback('/style\s*=\s*(["\"]).*?\1/i', function ($matches) {
            $style = $matches[0];
            // Remove dangerous properties
            $style = preg_replace('/(position|z-index|left|top|right|bottom|behavior|expression|url)\s*:[^;"\"]+;?/i', '', $style);
            return $style;
        }, $body);
        // Decode HTML entities
        $body = html_entity_decode($body, ENT_QUOTES, 'UTF-8');
        // Do NOT remove style attributes, table, tr, td, th, font, span, img tags
        // Do NOT collapse whitespace or strip tags further
        return $body;
    }

    /**
     * Create support ticket
     */
    private function createSupportTicket($emailSettings, $from, $subject, $body, $messageNumber, $rawHtml = null)
    {
        $ticketService = app(TicketService::class);
        
        // Extract name from email
        $name = $this->extractNameFromEmail($from);

        // Check if body contains HTML
        $isHtml = str_contains($body, '<') && str_contains($body, '>');

        // Create the ticket
        $ticket = $ticketService->createTicket([
            'subject' => $subject,
            'description' => $body,
            'raw_html' => $rawHtml,
            'requester_email' => $from,
            'requester_name' => $name['first_name'] . ' ' . $name['last_name'],
            'source' => 'email',
            'source_id' => $messageNumber,
            'is_html' => $isHtml,
        ], $emailSettings->tenant_id);

        $this->info("Created ticket #{$ticket->id} from email: {$from}" . ($isHtml ? ' (HTML)' : ' (Plain text)'));
    }

    /**
     * Extract name from email
     */
    private function extractNameFromEmail($email): array
    {
        $parts = explode('@', $email);
        $localPart = $parts[0];
        
        // Try to extract name from local part
        if (str_contains($localPart, '.')) {
            $nameParts = explode('.', $localPart);
            return [
                'first_name' => ucfirst($nameParts[0]),
                'last_name' => ucfirst($nameParts[1] ?? ''),
            ];
        }
        
        return [
            'first_name' => ucfirst($localPart),
            'last_name' => '',
        ];
    }
}
