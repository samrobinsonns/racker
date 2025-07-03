<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendTestEmail extends Command
{
    protected $signature = 'email:send-test {--to=test@example.com} {--subject=Test Ticket} {--message=This is a test email}';
    protected $description = 'Send a test email to the mailserver';

    public function handle()
    {
        $to = $this->option('to');
        $subject = $this->option('subject');
        $message = $this->option('message');

        $this->info("Sending test email to: {$to}");
        $this->info("Subject: {$subject}");
        $this->info("Message: {$message}");

        // Create a properly formatted email
        $emailContent = "From: customer@example.com\r\n";
        $emailContent .= "To: {$to}\r\n";
        $emailContent .= "Subject: {$subject}\r\n";
        $emailContent .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $emailContent .= "Date: " . date('r') . "\r\n";
        $emailContent .= "Message-ID: <test-" . time() . "@example.com>\r\n";
        $emailContent .= "\r\n";
        $emailContent .= $message . "\r\n";

        // Send using sendmail
        $result = $this->sendViaSendmail($emailContent, $to);

        if ($result) {
            $this->info("✅ Test email sent successfully!");
            return 0;
        } else {
            $this->error("❌ Failed to send test email");
            return 1;
        }
    }

    private function sendViaSendmail($emailContent, $to)
    {
        $command = "echo " . escapeshellarg($emailContent) . " | ./vendor/bin/sail exec mailserver sendmail -t " . escapeshellarg($to);
        
        $output = [];
        $returnCode = 0;
        
        exec($command, $output, $returnCode);
        
        return $returnCode === 0;
    }
} 