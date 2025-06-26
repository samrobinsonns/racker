<?php

namespace App\Console\Commands;

use App\Services\PageCleanupService;
use Illuminate\Console\Command;

class PageCleanupCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pages:cleanup 
                          {action=status : Action to perform (status, clean, validate)}
                          {--force : Force cleanup without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Manage cleanup of generated pages and their associated files';

    /**
     * Execute the console command.
     */
    public function handle(PageCleanupService $cleanupService): int
    {
        $action = $this->argument('action');

        return match ($action) {
            'status' => $this->showStatus($cleanupService),
            'clean' => $this->performCleanup($cleanupService),
            'validate' => $this->validateIntegrity($cleanupService),
            default => $this->error("Unknown action: {$action}. Use status, clean, or validate.")
        };
    }

    /**
     * Show status of generated pages
     */
    protected function showStatus(PageCleanupService $cleanupService): int
    {
        $this->info('🔍 Analyzing generated pages...');
        
        $stats = $cleanupService->getStatistics();
        
        $this->newLine();
        $this->line('<comment>Generated Pages Statistics:</comment>');
        $this->line("• Total Database Records: <info>{$stats['total_generated_pages']}</info>");
        $this->line("• Active Records: <info>{$stats['active_generated_pages']}</info>");
        $this->line("• Component Files on Disk: <info>{$stats['component_files_on_disk']}</info>");
        $this->line("• Orphaned Database Records: <info>{$stats['orphaned_database_records']}</info>");
        
        if ($stats['needs_cleanup']) {
            $this->newLine();
            $this->warn('⚠️  Cleanup recommended!');
            $this->line('Run <comment>php artisan pages:cleanup clean</comment> to fix issues.');
        } else {
            $this->newLine();
            $this->info('✅ All generated pages are in sync!');
        }

        return self::SUCCESS;
    }

    /**
     * Perform cleanup operations
     */
    protected function performCleanup(PageCleanupService $cleanupService): int
    {
        $this->info('🧹 Starting cleanup of generated pages...');
        
        // Show current status first
        $stats = $cleanupService->getStatistics();
        $this->line("Found {$stats['orphaned_database_records']} orphaned records and {$stats['component_files_on_disk']} files on disk.");
        
        if (!$stats['needs_cleanup']) {
            $this->info('✅ No cleanup needed!');
            return self::SUCCESS;
        }

        // Confirm with user unless --force flag is used
        if (!$this->option('force')) {
            if (!$this->confirm('This will permanently delete orphaned files and database records. Continue?')) {
                $this->line('Cleanup cancelled.');
                return self::SUCCESS;
            }
        }

        // Perform cleanup
        $report = $cleanupService->cleanupOrphanedFiles();
        
        $this->newLine();
        $this->line('<comment>Cleanup Report:</comment>');
        $this->line("• Files Removed: <info>{$report['files_removed']}</info>");
        $this->line("• Directories Removed: <info>{$report['directories_removed']}</info>");
        $this->line("• Routes Cleaned: <info>{$report['routes_cleaned']}</info>");
        $this->line("• Database Records Cleaned: <info>{$report['database_records_cleaned']}</info>");
        
        if (!empty($report['errors'])) {
            $this->newLine();
            $this->warn('⚠️  Some issues encountered:');
            foreach ($report['errors'] as $error) {
                $this->line("  • {$error}");
            }
        }

        $totalCleaned = $report['files_removed'] + $report['database_records_cleaned'] + $report['routes_cleaned'];
        
        if ($totalCleaned > 0) {
            $this->newLine();
            $this->info("✅ Cleanup completed! {$totalCleaned} items cleaned up.");
        } else {
            $this->info('✅ No cleanup was needed.');
        }

        return self::SUCCESS;
    }

    /**
     * Validate page integrity
     */
    protected function validateIntegrity(PageCleanupService $cleanupService): int
    {
        $this->info('🔎 Validating page integrity...');
        
        $issues = $cleanupService->validatePageIntegrity();
        
        if (empty($issues)) {
            $this->info('✅ All pages are valid!');
            return self::SUCCESS;
        }

        $this->newLine();
        $this->warn("⚠️  Found " . count($issues) . " integrity issues:");
        $this->newLine();

        $missingFiles = array_filter($issues, fn($issue) => $issue['type'] === 'missing_file');
        $orphanedRecords = array_filter($issues, fn($issue) => $issue['type'] === 'orphaned_record');

        if (!empty($missingFiles)) {
            $this->line('<comment>Missing Files (' . count($missingFiles) . '):</comment>');
            foreach ($missingFiles as $issue) {
                $this->line("  • {$issue['page']}: {$issue['expected_path']}");
            }
            $this->newLine();
        }

        if (!empty($orphanedRecords)) {
            $this->line('<comment>Orphaned Records (' . count($orphanedRecords) . '):</comment>');
            foreach ($orphanedRecords as $issue) {
                $this->line("  • {$issue['page']}: {$issue['message']}");
            }
            $this->newLine();
        }

        $this->line('Run <comment>php artisan pages:cleanup clean</comment> to fix these issues.');

        return self::SUCCESS;
    }
} 