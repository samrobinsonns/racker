<?php

namespace App\Services;

use App\Models\EmailSetting;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport;
use Exception;

class EmailSettingsService
{
    /**
     * Create or update email settings for a tenant
     *
     * @param string $tenantId
     * @param array $data
     * @return EmailSetting
     */
    public function updateSettings(string $tenantId, array $data): EmailSetting
    {
        $settings = EmailSetting::firstOrNew(['tenant_id' => $tenantId]);
        
        // If there's an existing active configuration, deactivate it
        if ($data['is_active'] ?? false) {
            EmailSetting::where('tenant_id', $tenantId)
                       ->where('id', '!=', $settings->id)
                       ->update(['is_active' => false]);
        }

        $settings->fill($data);
        $settings->save();

        return $settings;
    }

    /**
     * Test SMTP connection with given credentials
     *
     * @param EmailSetting $settings
     * @return array
     */
    public function testConnection(EmailSetting $settings): array
    {
        try {
            $transport = new EsmtpTransport(
                $settings->smtp_host,
                $settings->smtp_port,
                $settings->use_ssl
            );

            $transport->setUsername($settings->smtp_username);
            $transport->setPassword($settings->smtp_password);

            // Try to connect and authenticate
            $transport->start();

            // Update the settings with test results
            $settings->update([
                'last_tested_at' => now(),
                'last_test_successful' => true,
                'last_test_error' => null
            ]);

            return [
                'success' => true,
                'message' => 'Connection successful'
            ];
        } catch (Exception $e) {
            // Update the settings with test results
            $settings->update([
                'last_tested_at' => now(),
                'last_test_successful' => false,
                'last_test_error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get active email settings for a tenant
     *
     * @param string $tenantId
     * @return EmailSetting|null
     */
    public function getActiveSettings(string $tenantId): ?EmailSetting
    {
        return EmailSetting::where('tenant_id', $tenantId)
                          ->where('is_active', true)
                          ->first();
    }

    /**
     * Configure mail settings for the current tenant
     *
     * @param EmailSetting $settings
     * @return void
     */
    public function configureMail(EmailSetting $settings): void
    {
        config(['mail.mailers.smtp' => $settings->getMailConfig()]);
        config(['mail.from' => [
            'address' => $settings->from_email,
            'name' => $settings->from_name,
        ]]);
    }
}
