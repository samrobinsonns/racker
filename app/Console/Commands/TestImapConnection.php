<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\EmailSetting;

class TestImapConnection extends Command
{
    protected $signature = 'imap:test {tenant_id? : The tenant ID to test}';
    protected $description = 'Test IMAP connection for a tenant';

    public function handle()
    {
        $tenantId = $this->argument('tenant_id');
        
        if (!$tenantId) {
            $this->error('Please provide a tenant ID');
            return 1;
        }

        $emailSettings = EmailSetting::where('tenant_id', $tenantId)->first();
        
        if (!$emailSettings) {
            $this->error("No email settings found for tenant: {$tenantId}");
            return 1;
        }

        if (!$emailSettings->imap_enabled) {
            $this->error("IMAP is not enabled for tenant: {$tenantId}");
            return 1;
        }

        $this->info("Testing IMAP connection for tenant: {$tenantId}");
        $this->info("Host: {$emailSettings->imap_host}:{$emailSettings->imap_port}");
        $this->info("Username: {$emailSettings->imap_username}");
        $this->info("Encryption: {$emailSettings->imap_encryption}");
        $this->info("Folder: {$emailSettings->imap_folder}");

        try {
            $result = $this->testImapConnection(
                $emailSettings->imap_host,
                $emailSettings->imap_port,
                $emailSettings->imap_username,
                $emailSettings->imap_password,
                $emailSettings->imap_encryption,
                $emailSettings->imap_folder
            );

            if ($result['success']) {
                $this->info("✅ " . $result['message']);
                return 0;
            } else {
                $this->error("❌ " . $result['message']);
                return 1;
            }
        } catch (\Exception $e) {
            $this->error("❌ Connection test failed: " . $e->getMessage());
            return 1;
        }
    }

    private function testImapConnection($host, $port, $username, $password, $encryption, $folder)
    {
        // Build the connection string
        $connectionString = $this->buildImapConnectionString($host, $port, $encryption, $folder);

        // Test the connection
        $connection = @imap_open($connectionString, $username, $password, 0, 1);

        if ($connection) {
            // Get mailbox info
            $mailboxInfo = imap_mailboxmsginfo($connection);
            $messageCount = $mailboxInfo->Nmsgs ?? 0;

            imap_close($connection);

            return [
                'success' => true,
                'message' => "Connection successful. Found {$messageCount} messages in {$folder}.",
            ];
        } else {
            $errors = imap_errors();
            $errorMessage = $errors ? implode(', ', $errors) : 'Unknown connection error';

            return [
                'success' => false,
                'message' => "Connection failed: {$errorMessage}",
            ];
        }
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
} 