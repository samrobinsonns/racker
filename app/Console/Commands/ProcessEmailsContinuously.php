<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\ProcessEmailQueue;
use Illuminate\Support\Facades\Log;
use App\Models\EmailSetting;
use App\Services\SupportTickets\TicketService;
use App\Models\SupportTicket;
use App\Models\EmailSettings;
use App\Services\SupportTickets\AttachmentService;

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
            $unreadEmails = $this->fetchNewEmails($connection);
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
            
            // Check if this email has already been processed
            $existingTicket = \App\Models\SupportTicket::where('tenant_id', $emailSettings->tenant_id)
                ->where('source', 'email')
                ->where('source_id', $messageNumber)
                ->first();
                
            if ($existingTicket) {
                return false; // Already processed
            }
            
            // Check if this is a reply to an existing ticket
            $existingTicket = $this->findExistingTicket($emailSettings->tenant_id, $headers, $subject);
            
            if ($existingTicket) {
                // This is a reply to an existing ticket - create a reply instead
                $this->createEmailReply($existingTicket, $from, $subject, $body, $messageNumber, $rawHtml, $structure, $connection, $headers);
                $this->info("Added reply to existing ticket #{$existingTicket->ticket_number} from email: {$from}");
                return true;
            }
            
            // Extract file attachments
            $fileAttachments = $this->extractFileAttachments($connection, $messageNumber, $structure);
            
            // Create the ticket
            $ticket = $this->createSupportTicket($emailSettings, $from, $subject, $body, $messageNumber, $rawHtml);
            
            // Store file attachments if any
            if (!empty($fileAttachments) && $ticket) {
                $attachmentService = app(AttachmentService::class);
                foreach ($fileAttachments as $attachmentData) {
                    try {
                        $attachmentService->createEmailAttachment($ticket, $attachmentData);
                        if (property_exists($this, 'debugMode') && $this->debugMode) {
                            $this->info("[DEBUG] Stored file attachment: {$attachmentData['filename']}");
                            \Log::info('[DEBUG] Stored file attachment', ['filename' => $attachmentData['filename']]);
                        }
                    } catch (\Exception $e) {
                        $this->error("Error storing attachment {$attachmentData['filename']}: " . $e->getMessage());
                        \Log::error('Error storing attachment', ['filename' => $attachmentData['filename'], 'error' => $e->getMessage()]);
                    }
                }
            }
            
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
        
        // Extract attachments (including inline images)
        $attachments = $this->extractAttachments($connection, $messageNumber, $structure);
        
        $bestParts = $this->findBestPart($connection, $messageNumber, $structure);
        $plain = $bestParts['body'] ?? null;
        $html = $bestParts['raw_html'] ?? null;

        // Ensure proper UTF-8 encoding for both plain text and HTML content
        if ($plain) {
            $plain = mb_convert_encoding($plain, 'UTF-8', 'AUTO');
            $plain = html_entity_decode($plain, ENT_QUOTES, 'UTF-8');
            $description = $this->cleanReplyContent($plain);
        } elseif ($html) {
            $html = mb_convert_encoding($html, 'UTF-8', 'AUTO');
            $html = html_entity_decode($html, ENT_QUOTES, 'UTF-8');
            $description = $this->cleanReplyContent(strip_tags($html));
        } else {
            $description = '';
        }
        
        // Process HTML content to handle images
        $raw_html = null;
        if ($html) {
            $raw_html = $this->processHtmlContent($html, $attachments);
            // Clean the HTML content for replies
            $raw_html = $this->cleanReplyHtmlContent($raw_html);
        }

        return [
            'body' => $description,
            'raw_html' => $raw_html
        ];
    }

    /**
     * Clean reply content by removing quoted text, signatures, and email headers
     */
    private function cleanReplyContent($content): string
    {
        // Split content into lines
        $lines = explode("\n", $content);
        $cleanedLines = [];
        $inQuotedText = false;
        $inSignature = false;
        
        foreach ($lines as $line) {
            $trimmedLine = trim($line);
            
            // Skip empty lines at the beginning
            if (empty($trimmedLine) && empty($cleanedLines)) {
                continue;
            }
            
            // Check for quoted text indicators
            if (preg_match('/^>+\s/', $trimmedLine) || 
                preg_match('/^\|+\s/', $trimmedLine) ||
                preg_match('/^On .+ wrote:$/', $trimmedLine) ||
                preg_match('/^From: .+$/', $trimmedLine) ||
                preg_match('/^Sent: .+$/', $trimmedLine) ||
                preg_match('/^To: .+$/', $trimmedLine) ||
                preg_match('/^Subject: .+$/', $trimmedLine) ||
                preg_match('/^Date: .+$/', $trimmedLine) ||
                preg_match('/^Reply-To: .+$/', $trimmedLine) ||
                preg_match('/^CC: .+$/', $trimmedLine) ||
                preg_match('/^BCC: .+$/', $trimmedLine)) {
                $inQuotedText = true;
                continue;
            }
            
            // Check for signature indicators
            if (preg_match('/^--\s*$/', $trimmedLine) ||
                preg_match('/^Best regards,?$/i', $trimmedLine) ||
                preg_match('/^Sincerely,?$/i', $trimmedLine) ||
                preg_match('/^Thanks,?$/i', $trimmedLine) ||
                preg_match('/^Regards,?$/i', $trimmedLine) ||
                preg_match('/^Kind regards,?$/i', $trimmedLine) ||
                preg_match('/^Yours truly,?$/i', $trimmedLine) ||
                preg_match('/^Cheers,?$/i', $trimmedLine) ||
                preg_match('/^Thank you,?$/i', $trimmedLine) ||
                preg_match('/^This email is regarding ticket #/', $trimmedLine) ||
                preg_match('/^© \d{4} .+\. All rights reserved\.$/', $trimmedLine) ||
                preg_match('/^Disclaimer$/', $trimmedLine) ||
                preg_match('/^This e-mail is confidential/', $trimmedLine) ||
                preg_match('/^Registered in England/', $trimmedLine) ||
                preg_match('/^T: \d/', $trimmedLine) ||
                preg_match('/^F: \d/', $trimmedLine) ||
                preg_match('/^E: .+@.+$/', $trimmedLine) ||
                preg_match('/^W: .+$/', $trimmedLine)) {
                $inSignature = true;
                continue;
            }
            
            // If we're in quoted text or signature, skip this line
            if ($inQuotedText || $inSignature) {
                continue;
            }
            
            // Add the line if it's not empty or if we have content already
            if (!empty($trimmedLine) || !empty($cleanedLines)) {
                $cleanedLines[] = $line;
            }
        }
        
        $cleanedContent = implode("\n", $cleanedLines);
        
        // Remove excessive whitespace
        $cleanedContent = preg_replace('/\n\s*\n\s*\n/', "\n\n", $cleanedContent);
        $cleanedContent = trim($cleanedContent);
        
        return $cleanedContent;
    }

    /**
     * Clean HTML reply content by removing quoted text, signatures, and email headers
     */
    private function cleanReplyHtmlContent($html): string
    {
        // Remove raw CSS styles that appear as text (common in Outlook emails)
        $html = preg_replace('/[A-Za-z]+\s*\{[^}]*\}/', '', $html);
        
        // Remove style tags and their content
        $html = preg_replace('/<style[^>]*>.*?<\/style>/is', '', $html);
        
        // Remove script tags and their content
        $html = preg_replace('/<script[^>]*>.*?<\/script>/is', '', $html);
        
        // Remove quoted text blocks
        $html = preg_replace('/<blockquote[^>]*>.*?<\/blockquote>/is', '', $html);
        $html = preg_replace('/<div[^>]*class="[^"]*quote[^"]*"[^>]*>.*?<\/div>/is', '', $html);
        
        // Remove signature blocks
        $html = preg_replace('/<div[^>]*class="[^"]*signature[^"]*"[^>]*>.*?<\/div>/is', '', $html);
        $html = preg_replace('/<div[^>]*style="[^"]*border-left[^"]*"[^>]*>.*?<\/div>/is', '', $html);
        
        // Remove email headers in HTML
        $html = preg_replace('/<div[^>]*>From:.*?<\/div>/is', '', $html);
        $html = preg_replace('/<div[^>]*>Sent:.*?<\/div>/is', '', $html);
        $html = preg_replace('/<div[^>]*>To:.*?<\/div>/is', '', $html);
        $html = preg_replace('/<div[^>]*>Subject:.*?<\/div>/is', '', $html);
        $html = preg_replace('/<div[^>]*>Date:.*?<\/div>/is', '', $html);
        $html = preg_replace('/<div[^>]*>Reply-To:.*?<\/div>/is', '', $html);
        $html = preg_replace('/<div[^>]*>CC:.*?<\/div>/is', '', $html);
        $html = preg_replace('/<div[^>]*>BCC:.*?<\/div>/is', '', $html);
        
        // Remove "On ... wrote:" lines
        $html = preg_replace('/<div[^>]*>On .+ wrote:.*?<\/div>/is', '', $html);
        
        // Remove disclaimer and copyright notices
        $html = preg_replace('/<div[^>]*>Disclaimer.*?<\/div>/is', '', $html);
        $html = preg_replace('/<div[^>]*>This e-mail is confidential.*?<\/div>/is', '', $html);
        $html = preg_replace('/<div[^>]*>© \d{4} .+\. All rights reserved\..*?<\/div>/is', '', $html);
        $html = preg_replace('/<div[^>]*>Registered in England.*?<\/div>/is', '', $html);
        
        // Remove contact information blocks
        $html = preg_replace('/<div[^>]*>T: \d.*?<\/div>/is', '', $html);
        $html = preg_replace('/<div[^>]*>F: \d.*?<\/div>/is', '', $html);
        $html = preg_replace('/<div[^>]*>E: .+@.+<\/div>/is', '', $html);
        $html = preg_replace('/<div[^>]*>W: .+<\/div>/is', '', $html);
        
        // Remove "This email is regarding ticket" messages
        $html = preg_replace('/<div[^>]*>This email is regarding ticket #.*?<\/div>/is', '', $html);
        
        // Remove excessive whitespace and empty divs
        $html = preg_replace('/<div[^>]*>\s*<\/div>/', '', $html);
        $html = preg_replace('/\s*\n\s*\n\s*/', "\n", $html);
        
        // Remove any remaining raw CSS-like content
        $html = preg_replace('/[A-Za-z]+\s*\{[^}]*\}/', '', $html);
        
        // Clean up the HTML
        $html = trim($html);
        
        return $html;
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
            
            // Check for inline disposition (embedded images)
            if (isset($structure->disposition) && strtolower($structure->disposition) === 'inline') {
                $isAttachment = true;
            }
            // Check for attachment disposition
            elseif (isset($structure->disposition) && strtolower($structure->disposition) === 'attachment') {
                $isAttachment = true;
            }
            
            // Get Content-ID for inline images
            if (isset($structure->ifid) && $structure->ifid && isset($structure->id)) {
                $cid = trim($structure->id, '<>');
                $isAttachment = true;
            }
            
            // Also check for images in the parts array
            if (isset($structure->type) && $structure->type === 5) { // 5 = image
                $isAttachment = true;
                if (isset($structure->ifid) && $structure->ifid && isset($structure->id)) {
                    $cid = trim($structure->id, '<>');
                }
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
     * Process HTML content to handle images properly
     */
    private function processHtmlContent($html, $attachments = [])
    {
        // Debug: log attachment count
        if (property_exists($this, 'debugMode') && $this->debugMode && !empty($attachments)) {
            $this->info("[DEBUG] Found " . count($attachments) . " attachments/inline images");
            \Log::info('[DEBUG] Found attachments', ['count' => count($attachments), 'cids' => array_keys($attachments)]);
        }
        
        // Replace CID images with data URLs
        if (!empty($attachments)) {
            $originalHtml = $html;
            $html = $this->replaceCidImages($html, $attachments);
            
            // Debug: check if any CID images were replaced
            if (property_exists($this, 'debugMode') && $this->debugMode && $originalHtml !== $html) {
                $this->info("[DEBUG] Replaced CID images with data URLs");
                \Log::info('[DEBUG] Replaced CID images with data URLs');
            }
        }
        
        // Ensure external images are allowed (but be careful with security)
        // For now, we'll keep external images as-is, but you might want to proxy them
        // or add security checks depending on your requirements
        
        return $html;
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
        // Remove raw CSS styles that appear as text (common in Outlook emails)
        $body = preg_replace('/[A-Za-z]+\s*\{[^}]*\}/', '', $body);
        
        // Remove style tags and their content
        $body = preg_replace('/<style[^>]*>.*?<\/style>/is', '', $body);
        
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

                    // Get the actual email Message-ID for threading
            $emailMessageId = isset($headers->message_id) ? trim($headers->message_id, '<>') : null;
            
            // Create the ticket
            $ticket = $ticketService->createTicket([
                'subject' => $subject,
                'description' => $body,
                'raw_html' => $rawHtml,
                'requester_email' => $from,
                'requester_name' => $name['first_name'] . ' ' . $name['last_name'],
                'source' => 'email',
                'source_id' => $messageNumber,
                'email_message_id' => $emailMessageId,
                'is_html' => $isHtml,
            ], $emailSettings->tenant_id);

        $this->info("Created ticket #{$ticket->id} from email: {$from}" . ($isHtml ? ' (HTML)' : ' (Plain text)'));

        return $ticket;
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

    private function fetchNewEmails($connection)
    {
        // Only fetch unread emails to avoid processing old emails
        $emails = imap_search($connection, 'UNSEEN');
        
        if (!$emails) {
            return [];
        }
        
        return $emails;
    }

    /**
     * Extract file attachments (not inline images) from email
     */
    private function extractFileAttachments($connection, $messageNumber, $structure, $partNumberPrefix = '', &$attachments = [])
    {
        if (isset($structure->parts) && is_array($structure->parts)) {
            foreach ($structure->parts as $idx => $part) {
                $partNumber = $partNumberPrefix === '' ? ($idx + 1) : ($partNumberPrefix . '.' . ($idx + 1));
                $this->extractFileAttachments($connection, $messageNumber, $part, $partNumber, $attachments);
            }
        } else {
            // Check if this is a file attachment (not inline image)
            $isFileAttachment = false;
            $filename = null;
            
            // Check for attachment disposition
            if (isset($structure->disposition) && strtolower($structure->disposition) === 'attachment') {
                $isFileAttachment = true;
            }
            
            // Get filename from parameters
            if (isset($structure->ifparameters) && $structure->ifparameters) {
                foreach ($structure->parameters as $param) {
                    if (strtolower($param->attribute) === 'name' || strtolower($param->attribute) === 'filename') {
                        $filename = $param->value;
                        $isFileAttachment = true;
                        break;
                    }
                }
            }
            
            // Also check for filename in dparameters (disposition parameters)
            if (isset($structure->ifdparameters) && $structure->ifdparameters) {
                foreach ($structure->dparameters as $param) {
                    if (strtolower($param->attribute) === 'filename') {
                        $filename = $param->value;
                        $isFileAttachment = true;
                        break;
                    }
                }
            }
            
            // Skip if this is an inline image (has Content-ID)
            if (isset($structure->ifid) && $structure->ifid && isset($structure->id)) {
                $isFileAttachment = false; // This is an inline image, not a file attachment
            }
            
            if ($isFileAttachment && $filename) {
                $body = imap_fetchbody($connection, $messageNumber, $partNumberPrefix ?: 1);
                if (isset($structure->encoding)) {
                    $body = $this->decodeEmailBody($body, $structure->encoding);
                }
                $mime = $this->getMimeType($structure);
                
                $attachments[] = [
                    'filename' => $filename,
                    'content' => $body,
                    'mime_type' => $mime,
                    'size' => strlen($body),
                ];
                
                if (property_exists($this, 'debugMode') && $this->debugMode) {
                    $this->info("[DEBUG] Found file attachment: {$filename} ({$mime}, " . number_format(strlen($body)) . " bytes)");
                    \Log::info('[DEBUG] Found file attachment', ['filename' => $filename, 'mime_type' => $mime, 'size' => strlen($body)]);
                }
            }
        }
        return $attachments;
    }

    /**
     * Find existing ticket by email thread or subject
     */
    private function findExistingTicket($tenantId, $headers, $subject): ?\App\Models\SupportTicket
    {
        if (property_exists($this, 'debugMode') && $this->debugMode) {
            $this->info("[DEBUG] Looking for existing ticket for subject: {$subject}");
            $this->info("[DEBUG] Headers: " . json_encode($headers));
        }
        
        // Look for ticket number in subject (e.g., [TKT-2024-123456] or TKT-2025-822401)
        if (preg_match('/\[TKT-\d{4}-\d{6}\]/', $subject, $matches)) {
            $ticketNumber = trim($matches[0], '[]');
            $ticket = \App\Models\SupportTicket::where('tenant_id', $tenantId)
                ->where('ticket_number', $ticketNumber)
                ->first();
            
            if ($ticket) {
                $this->info("Found existing ticket by ticket number in subject: {$ticketNumber}");
                return $ticket;
            }
        }
        
        // Also look for ticket number without brackets (e.g., TKT-2025-822401)
        if (preg_match('/TKT-\d{4}-\d{6}/', $subject, $matches)) {
            $ticketNumber = $matches[0];
            $ticket = \App\Models\SupportTicket::where('tenant_id', $tenantId)
                ->where('ticket_number', $ticketNumber)
                ->first();
            
            if ($ticket) {
                $this->info("Found existing ticket by ticket number in subject (no brackets): {$ticketNumber}");
                return $ticket;
            }
        }
        
        // Look for In-Reply-To header
        if (isset($headers->in_reply_to) && $headers->in_reply_to) {
            $inReplyTo = trim($headers->in_reply_to, '<>');
            if (property_exists($this, 'debugMode') && $this->debugMode) {
                $this->info("[DEBUG] Checking In-Reply-To: {$inReplyTo}");
            }
            
            // First check tickets
            $ticket = \App\Models\SupportTicket::where('tenant_id', $tenantId)
                ->where('email_message_id', $inReplyTo)
                ->first();
            
            if ($ticket) {
                $this->info("Found existing ticket by In-Reply-To header: {$inReplyTo}");
                return $ticket;
            }
            
            // Then check replies
            $reply = \App\Models\SupportTicketReply::where('tenant_id', $tenantId)
                ->where('microsoft365_message_id', $inReplyTo)
                ->first();
            
            if ($reply) {
                $this->info("Found existing ticket by In-Reply-To in reply: {$inReplyTo}");
                return $reply->ticket;
            }
        }
        
        // Look for References header
        if (isset($headers->references) && $headers->references) {
            $references = trim($headers->references, '<>');
            if (property_exists($this, 'debugMode') && $this->debugMode) {
                $this->info("[DEBUG] Checking References: {$references}");
            }
            
            // First check tickets
            $ticket = \App\Models\SupportTicket::where('tenant_id', $tenantId)
                ->where('email_message_id', $references)
                ->first();
            
            if ($ticket) {
                $this->info("Found existing ticket by References header: {$references}");
                return $ticket;
            }
            
            // Then check replies
            $reply = \App\Models\SupportTicketReply::where('tenant_id', $tenantId)
                ->where('microsoft365_message_id', $references)
                ->first();
            
            if ($reply) {
                $this->info("Found existing ticket by References in reply: {$references}");
                return $reply->ticket;
            }
        }
        
        // Look for Message-ID in existing replies
        if (isset($headers->message_id) && $headers->message_id) {
            $messageId = trim($headers->message_id, '<>');
            if (property_exists($this, 'debugMode') && $this->debugMode) {
                $this->info("[DEBUG] Checking Message-ID: {$messageId}");
            }
            
            $reply = \App\Models\SupportTicketReply::where('tenant_id', $tenantId)
                ->where('microsoft365_message_id', $messageId)
                ->first();
            
            if ($reply) {
                $this->info("Found existing ticket by Message-ID in reply: {$messageId}");
                return $reply->ticket;
            }
        }
        
        // Additional check: Look for "Re:" in subject and try to match by email address and similar subject
        if (stripos($subject, 're:') === 0) {
            $originalSubject = trim(substr($subject, 3)); // Remove "Re: " prefix
            if (property_exists($this, 'debugMode') && $this->debugMode) {
                $this->info("[DEBUG] Checking for reply with subject: {$originalSubject}");
            }
            
            // Look for tickets with similar subject (case insensitive)
            $ticket = \App\Models\SupportTicket::where('tenant_id', $tenantId)
                ->whereRaw('LOWER(subject) = ?', [strtolower($originalSubject)])
                ->first();
            
            if ($ticket) {
                $this->info("Found existing ticket by similar subject (reply): {$originalSubject}");
                return $ticket;
            }
        }
        
        if (property_exists($this, 'debugMode') && $this->debugMode) {
            $this->info("[DEBUG] No existing ticket found");
        }
        
        return null;
    }

    /**
     * Create email reply to existing ticket
     */
    private function createEmailReply($ticket, $from, $subject, $body, $messageNumber, $rawHtml, $structure, $connection, $headers)
    {
        $replyService = app(\App\Services\SupportTickets\ReplyService::class);
        
        // Extract name from email
        $name = $this->extractNameFromEmail($from);
        
        // Check if body contains HTML
        $isHtml = str_contains($body, '<') && str_contains($body, '>');
        
        // Get the actual email Message-ID for threading
        $emailMessageId = isset($headers->message_id) ? trim($headers->message_id, '<>') : null;
        
        // Ensure proper UTF-8 encoding for HTML content
        if ($rawHtml) {
            // Convert to UTF-8 if needed and handle special characters
            $rawHtml = mb_convert_encoding($rawHtml, 'UTF-8', 'AUTO');
            // Clean up any remaining encoding issues
            $rawHtml = html_entity_decode($rawHtml, ENT_QUOTES, 'UTF-8');
        }
        
        // Ensure proper UTF-8 encoding for text content
        $body = mb_convert_encoding($body, 'UTF-8', 'AUTO');
        $body = html_entity_decode($body, ENT_QUOTES, 'UTF-8');
        
        // Create the reply
        $reply = $replyService->createEmailReply($ticket, [
            'body_text' => $body,
            'body_html' => $rawHtml,
            'from_email' => $from,
            'from_name' => $name['first_name'] . ' ' . $name['last_name'],
            'subject' => $subject,
            'message_id' => $emailMessageId,
            'headers' => [
                'message_id' => $emailMessageId,
                'received_at' => now(),
            ],
            'received_at' => now(),
            'microsoft365_message_id' => $emailMessageId, // Store message ID for threading
        ]);
        
        // Extract and store file attachments if any
        $fileAttachments = $this->extractFileAttachments($connection, $messageNumber, $structure);
        if (!empty($fileAttachments)) {
            $attachmentService = app(AttachmentService::class);
            foreach ($fileAttachments as $attachmentData) {
                try {
                    $attachmentService->createEmailAttachment($ticket, $attachmentData, $reply->id);
                    if (property_exists($this, 'debugMode') && $this->debugMode) {
                        $this->info("[DEBUG] Stored file attachment for reply: {$attachmentData['filename']}");
                        \Log::info('[DEBUG] Stored file attachment for reply', ['filename' => $attachmentData['filename']]);
                    }
                } catch (\Exception $e) {
                    $this->error("Error storing attachment {$attachmentData['filename']}: " . $e->getMessage());
                    \Log::error('Error storing attachment for reply', ['filename' => $attachmentData['filename'], 'error' => $e->getMessage()]);
                }
            }
        }
        
        return $reply;
    }
}
