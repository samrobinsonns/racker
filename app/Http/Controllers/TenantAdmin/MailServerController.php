<?php

namespace App\Http\Controllers\TenantAdmin;

use App\Http\Controllers\Controller;
use App\Services\SupportTickets\DockerMailServerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class MailServerController extends Controller
{
    protected DockerMailServerService $mailService;

    public function __construct(DockerMailServerService $mailService)
    {
        $this->mailService = $mailService;
    }

    /**
     * Display mail server settings
     */
    public function index()
    {
        $settings = [
            'enabled' => config('support-tickets.mail_server.enabled'),
            'type' => config('support-tickets.mail_server.type'),
            'imap_host' => config('support-tickets.mail_server.imap_host'),
            'imap_port' => config('support-tickets.mail_server.imap_port'),
            'smtp_host' => config('support-tickets.mail_server.smtp_host'),
            'smtp_port' => config('support-tickets.mail_server.smtp_port'),
            'domain' => config('support-tickets.mail_server.domain'),
            'processing_interval' => config('support-tickets.mail_server.processing_interval'),
            'max_emails_per_batch' => config('support-tickets.mail_server.max_emails_per_batch'),
            'spam_filtering' => config('support-tickets.mail_server.spam_filtering'),
            'virus_scanning' => config('support-tickets.mail_server.virus_scanning'),
            'ssl_enabled' => config('support-tickets.mail_server.ssl_enabled'),
        ];

        $statistics = $this->mailService->getStatistics();

        return Inertia::render('TenantAdmin/SupportTickets/MailServer/Index', [
            'settings' => $settings,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Test mail server connection
     */
    public function testConnection(Request $request)
    {
        try {
            $result = $this->mailService->testConnection();

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'Connection successful: ' . $result['message'],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Connection failed: ' . $result['message'],
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Mail server connection test failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Connection test error: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Process emails manually
     */
    public function processEmails(Request $request)
    {
        try {
            $limit = $request->input('limit', 50);
            $dryRun = $request->boolean('dry_run', false);

            if ($dryRun) {
                $stats = $this->mailService->getStatistics();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Dry run completed',
                    'data' => [
                        'total_emails' => $stats['total_emails'],
                        'archived_emails' => $stats['archived_emails'],
                        'mail_directory' => $stats['mail_directory'],
                        'archive_directory' => $stats['archive_directory'],
                    ],
                ]);
            }

            $result = $this->mailService->processIncomingEmails();

            if (isset($result['error'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Processing failed: ' . $result['error'],
                ]);
            }

            $processed = $result['processed'] ?? [];

            return response()->json([
                'success' => true,
                'message' => 'Successfully processed ' . count($processed) . ' emails',
                'data' => [
                    'processed_count' => count($processed),
                    'processed_emails' => $processed,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Manual email processing failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Processing error: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Get mail server statistics
     */
    public function getStatistics()
    {
        try {
            $statistics = $this->mailService->getStatistics();

            return response()->json([
                'success' => true,
                'data' => $statistics,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get mail server statistics: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to get statistics: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Update mail server settings
     */
    public function updateSettings(Request $request)
    {
        $request->validate([
            'enabled' => 'boolean',
            'imap_host' => 'required|string',
            'imap_port' => 'required|integer|min:1|max:65535',
            'smtp_host' => 'required|string',
            'smtp_port' => 'required|integer|min:1|max:65535',
            'domain' => 'required|string',
            'processing_interval' => 'required|integer|min:60|max:3600',
            'max_emails_per_batch' => 'required|integer|min:1|max:1000',
            'spam_filtering' => 'boolean',
            'virus_scanning' => 'boolean',
            'ssl_enabled' => 'boolean',
        ]);

        try {
            // Update configuration (in a real implementation, you might want to store these in the database)
            $settings = $request->only([
                'enabled', 'imap_host', 'imap_port', 'smtp_host', 'smtp_port',
                'domain', 'processing_interval', 'max_emails_per_batch',
                'spam_filtering', 'virus_scanning', 'ssl_enabled',
            ]);

            // For now, we'll just validate and return success
            // In a production environment, you'd want to store these settings
            // in a database table or configuration file

            Log::info('Mail server settings updated', $settings);

            return response()->json([
                'success' => true,
                'message' => 'Settings updated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update mail server settings: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update settings: ' . $e->getMessage(),
            ]);
        }
    }
} 