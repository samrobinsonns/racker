<?php

namespace App\Console\Commands;

use App\Services\SupportTickets\DockerMailServerService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessMailServerEmails extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'support:process-mails 
                            {--force : Force processing even if disabled}
                            {--limit=50 : Maximum number of emails to process}
                            {--dry-run : Show what would be processed without actually processing}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process incoming emails from Docker mail server for support tickets';

    /**
     * Execute the console command.
     */
    public function handle(DockerMailServerService $mailService)
    {
        if (!config('support-tickets.mail_server.enabled') && !$this->option('force')) {
            $this->error('Mail server processing is disabled. Use --force to override.');
            return 1;
        }

        $this->info('Starting email processing from Docker mail server...');

        try {
            if ($this->option('dry-run')) {
                $this->info('DRY RUN MODE - No emails will be processed');
                $stats = $mailService->getStatistics();
                $this->table(
                    ['Metric', 'Value'],
                    [
                        ['Total emails in queue', $stats['total_emails']],
                        ['Archived emails', $stats['archived_emails']],
                        ['Mail directory', $stats['mail_directory']],
                        ['Archive directory', $stats['archive_directory']],
                    ]
                );
                return 0;
            }

            $startTime = microtime(true);
            $result = $mailService->processIncomingEmails();
            $endTime = microtime(true);

            if (isset($result['error'])) {
                $this->error('Error processing emails: ' . $result['error']);
                Log::error('Mail server processing error: ' . $result['error']);
                return 1;
            }

            $processed = $result['processed'] ?? [];
            $processingTime = round(($endTime - $startTime) * 1000, 2);

            $this->info("Email processing completed in {$processingTime}ms");

            if (empty($processed)) {
                $this->info('No emails were processed.');
                return 0;
            }

            $this->info("Successfully processed " . count($processed) . " emails:");

            $tableData = [];
            foreach ($processed as $item) {
                $tableData[] = [
                    $item['type'],
                    $item['ticket_id'],
                    $item['reply_id'] ?? 'N/A',
                    now()->format('Y-m-d H:i:s'),
                ];
            }

            $this->table(
                ['Type', 'Ticket ID', 'Reply ID', 'Processed At'],
                $tableData
            );

            // Log processing results
            Log::info('Mail server processing completed', [
                'processed_count' => count($processed),
                'processing_time_ms' => $processingTime,
                'results' => $processed,
            ]);

            return 0;

        } catch (\Exception $e) {
            $this->error('Unexpected error: ' . $e->getMessage());
            Log::error('Unexpected error in mail processing: ' . $e->getMessage(), [
                'exception' => $e,
            ]);
            return 1;
        }
    }
} 