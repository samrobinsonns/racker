<?php

namespace App\Http\Controllers\TenantAdmin;

use App\Http\Controllers\Controller;
use App\Models\EmailSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class ImapSettingsController extends Controller
{
    /**
     * Store IMAP settings
     */
    public function store(Request $request)
    {
        $request->validate([
            'imap_host' => 'required|string|max:255',
            'imap_port' => 'required|integer|min:1|max:65535',
            'imap_username' => 'required|string|max:255',
            'imap_password' => 'required|string',
            'imap_encryption' => 'required|in:ssl,tls,none',
            'imap_folder' => 'required|string|max:255',
            'imap_enabled' => 'boolean',
        ]);

        try {
            $tenantId = Auth::user()->tenant_id;

            // Find existing email settings for this tenant
            $emailSettings = EmailSetting::where('tenant_id', $tenantId)->first();

            if ($emailSettings) {
                // Update existing settings
                $emailSettings->update([
                    'imap_host' => $request->imap_host,
                    'imap_port' => $request->imap_port,
                    'imap_username' => $request->imap_username,
                    'imap_password' => $request->imap_password,
                    'imap_encryption' => $request->imap_encryption,
                    'imap_folder' => $request->imap_folder,
                    'imap_enabled' => $request->boolean('imap_enabled'),
                ]);
            } else {
                // Create new settings
                $emailSettings = EmailSetting::create([
                    'tenant_id' => $tenantId,
                    'imap_host' => $request->imap_host,
                    'imap_port' => $request->imap_port,
                    'imap_username' => $request->imap_username,
                    'imap_password' => $request->imap_password,
                    'imap_encryption' => $request->imap_encryption,
                    'imap_folder' => $request->imap_folder,
                    'imap_enabled' => $request->boolean('imap_enabled'),
                ]);
            }

            return back()->with('success', 'IMAP settings saved successfully.');

        } catch (\Exception $e) {
            Log::error('Failed to save IMAP settings: ' . $e->getMessage(), [
                'tenant_id' => Auth::user()->tenant_id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['error' => 'Failed to save IMAP settings. Please try again.']);
        }
    }

    /**
     * Test IMAP connection
     */
    public function test(Request $request, $settingsId = null)
    {
        $request->validate([
            'imap_host' => 'required|string',
            'imap_port' => 'required|integer',
            'imap_username' => 'required|string',
            'imap_password' => 'required|string',
            'imap_encryption' => 'required|in:ssl,tls,none',
            'imap_folder' => 'required|string',
        ]);

        try {
            $result = $this->testImapConnection(
                $request->imap_host,
                $request->imap_port,
                $request->imap_username,
                $request->imap_password,
                $request->imap_encryption,
                $request->imap_folder
            );

            // Update the last check status in the database
            $emailSettings = $this->updateImapCheckStatus($settingsId, $result['success'], $result['message']);

            return back()->with([
                'imap_test_result' => [
                    'success' => $result['success'],
                    'message' => $result['message']
                ],
                'email_settings' => $emailSettings
            ]);

        } catch (\Exception $e) {
            Log::error('IMAP connection test failed: ' . $e->getMessage(), [
                'tenant_id' => Auth::user()->tenant_id,
                'error' => $e->getMessage(),
            ]);

            // Update the last check status with error
            $emailSettings = $this->updateImapCheckStatus($settingsId, false, $e->getMessage());

            return back()->with([
                'imap_test_result' => [
                    'success' => false,
                    'message' => 'Connection test failed: ' . $e->getMessage()
                ],
                'email_settings' => $emailSettings
            ]);
        }
    }

    /**
     * Test IMAP connection using PHP's imap functions
     */
    private function testImapConnection($host, $port, $username, $password, $encryption, $folder)
    {
        // Set timeout options
        $timeout = 10; // 10 seconds timeout
        imap_timeout(IMAP_OPENTIMEOUT, $timeout);
        imap_timeout(IMAP_READTIMEOUT, $timeout);
        imap_timeout(IMAP_WRITETIMEOUT, $timeout);
        imap_timeout(IMAP_CLOSETIMEOUT, $timeout);

        // Build the connection string
        $connectionString = $this->buildImapConnectionString($host, $port, $encryption, $folder);

        // Test the connection with retries
        $maxRetries = 2;
        $retryDelay = 1; // seconds
        $attempt = 0;

        while ($attempt < $maxRetries) {
            $connection = @imap_open($connectionString, $username, $password, OP_HALFOPEN | CL_EXPUNGE, 1);
            
            if ($connection) {
                imap_close($connection);
                return [
                    'success' => true,
                    'message' => "Connection successful. IMAP server is accessible.",
                ];
            }

            $attempt++;
            if ($attempt < $maxRetries) {
                sleep($retryDelay);
            }
        }

        $errors = imap_errors();
        $errorMessage = $errors ? implode(', ', $errors) : 'Unknown connection error';

        return [
            'success' => false,
            'message' => "Connection failed: {$errorMessage}",
        ];
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
     * Update IMAP check status in database
     */
    private function updateImapCheckStatus($settingsId, $success, $message)
    {
        if (!$settingsId) {
            return null;
        }

        try {
            $emailSettings = EmailSetting::find($settingsId);
            
            if ($emailSettings) {
                $emailSettings->update([
                    'imap_last_check_at' => now(),
                    'imap_last_check_successful' => $success,
                    'imap_last_check_error' => $success ? null : $message,
                ]);

                return $emailSettings->fresh();
            }
        } catch (\Exception $e) {
            Log::error('Failed to update IMAP check status: ' . $e->getMessage());
        }

        return null;
    }
} 