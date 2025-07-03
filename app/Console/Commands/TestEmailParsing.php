<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\EmailSetting;

class TestEmailParsing extends Command
{
    protected $signature = 'emails:test-parsing {tenant_id : The tenant ID to test}';
    protected $description = 'Test email parsing to debug subject/body separation';

    public function handle()
    {
        $tenantId = $this->argument('tenant_id');

        $emailSettings = EmailSetting::where('tenant_id', $tenantId)->first();
        
        if (!$emailSettings) {
            $this->error("No email settings found for tenant: {$tenantId}");
            return 1;
        }

        if (!$emailSettings->imap_enabled) {
            $this->error("IMAP is not enabled for tenant: {$tenantId}");
            return 1;
        }

        $this->info("Testing email parsing for tenant: {$tenantId}");
        $this->info("Host: {$emailSettings->imap_host}:{$emailSettings->imap_port}");
        $this->info("Username: {$emailSettings->imap_username}");

        try {
            $connection = $this->connectToImap($emailSettings);
            
            if (!$connection) {
                $this->error('Failed to connect to IMAP server');
                return 1;
            }

            $this->info('✅ Connected to IMAP server');

            // Get message count
            $messageCount = imap_num_msg($connection);
            $this->info("Found {$messageCount} messages in mailbox");

            if ($messageCount == 0) {
                $this->info('No messages to test with');
                imap_close($connection);
                return 0;
            }

            // Test parsing the most recent message
            $messageNumber = $messageCount;
            $this->info("Testing parsing of message #{$messageNumber}");
            
            $this->testEmailParsing($connection, $messageNumber);

            imap_close($connection);
            return 0;

        } catch (\Exception $e) {
            $this->error('Error testing email parsing: ' . $e->getMessage());
            return 1;
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

    private function testEmailParsing($connection, $messageNumber)
    {
        // Get email headers
        $headers = imap_headerinfo($connection, $messageNumber);
        
        if (!$headers) {
            $this->error("Could not read headers for message {$messageNumber}");
            return;
        }

        $from = $headers->from[0]->mailbox . '@' . $headers->from[0]->host;
        $rawSubject = $headers->subject ?? 'No Subject';
        $date = date('Y-m-d H:i:s', strtotime($headers->date));

        $this->info("=== EMAIL PARSING TEST RESULTS ===");
        $this->info("From: {$from}");
        $this->info("Date: {$date}");
        $this->info("Raw Subject Length: " . strlen($rawSubject));
        $this->info("Raw Subject Preview: " . substr($rawSubject, 0, 100) . "...");

        // Debug the raw email detection
        $this->info("=== RAW EMAIL DETECTION DEBUG ===");
        $this->info("Contains \\nFrom: " . (strpos($rawSubject, "\nFrom:") !== false ? 'YES' : 'NO'));
        $this->info("Contains \\nTo: " . (strpos($rawSubject, "\nTo:") !== false ? 'YES' : 'NO'));
        $this->info("Contains \\nSubject: " . (strpos($rawSubject, "\nSubject:") !== false ? 'YES' : 'NO'));
        $this->info("Starts with From: " . (strpos($rawSubject, "From:") === 0 ? 'YES' : 'NO'));
        $this->info("Starts with To: " . (strpos($rawSubject, "To:") === 0 ? 'YES' : 'NO'));
        $this->info("Has double newlines: " . (preg_match('/\n\s*\n/', $rawSubject) ? 'YES' : 'NO'));
        $isRaw = $this->isRawEmailInSubject($rawSubject);
        $this->info("Final detection result: " . ($isRaw ? 'RAW EMAIL' : 'NORMAL EMAIL'));

        // Check if this looks like a raw email content in the subject (mailserver issue)
        if ($isRaw) {
            $this->info("✅ Detected raw email content in subject - parsing manually");
            $parsed = $this->parseRawEmailContent($rawSubject);
            $subject = $parsed['subject'];
            $body = $parsed['body'];
            $this->info("📧 Using manual parsing for mailserver format");
        } else {
            $this->info("📧 Using standard IMAP parsing");
            // Clean up subject
            $subject = trim(str_replace(["\n", "\r"], ' ', $rawSubject));
            if (strlen($subject) > 255) {
                $subject = substr($subject, 0, 252) . '...';
            }
            
            // Get email body using the improved method
            $body = $this->getEmailBody($connection, $messageNumber);
        }

        $this->info("=== PARSED RESULTS ===");
        $this->info("Parsed Subject: {$subject}");
        $this->info("Subject Length: " . strlen($subject));
        $this->info("Body Length: " . strlen($body));
        $this->info("Body Preview (first 200 chars):");
        $this->line(str_repeat('-', 40));
        $this->line(substr($body, 0, 200));
        $this->line(str_repeat('-', 40));

        if (strlen($body) > 200) {
            $this->info("Body contains " . (strlen($body) - 200) . " more characters...");
        }

        // Check if subject and body are properly separated
        if (strlen($subject) > 0 && strlen($body) > 0) {
            $this->info("✅ Subject and body are properly separated");
        } elseif (strlen($subject) > 0 && strlen($body) == 0) {
            $this->warn("⚠️  Subject found but body is empty");
        } elseif (strlen($subject) == 0 && strlen($body) > 0) {
            $this->warn("⚠️  Body found but subject is empty");
        } else {
            $this->error("❌ Both subject and body are empty");
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
            'headers' => $parsedHeaders
        ];
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
} 