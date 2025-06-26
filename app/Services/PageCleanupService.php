<?php

namespace App\Services;

use App\Models\GeneratedPage;
use App\Models\NavigationItem;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class PageCleanupService
{
    /**
     * Clean up all orphaned files and routes
     */
    public function cleanupOrphanedFiles(): array
    {
        $report = [
            'files_removed' => 0,
            'directories_removed' => 0,
            'routes_cleaned' => 0,
            'database_records_cleaned' => 0,
            'errors' => [],
        ];

        try {
            // 1. Find GeneratedPages without corresponding NavigationItems
            $orphanedPages = GeneratedPage::whereDoesntHave('navigationItem')->get();
            
            foreach ($orphanedPages as $page) {
                $this->cleanupSinglePage($page, $report);
            }

            // 2. Find component files without database records
            $this->cleanupUnreferencedFiles($report);

            // 3. Clean up dynamic routes file
            $this->cleanupDynamicRoutes($report);

        } catch (\Exception $e) {
            $report['errors'][] = 'General cleanup error: ' . $e->getMessage();
            Log::error('Page cleanup service error', ['error' => $e->getMessage()]);
        }

        return $report;
    }

    /**
     * Clean up a single generated page
     */
    public function cleanupSinglePage(GeneratedPage $page, array &$report = null): void
    {
        $report = $report ?? ['files_removed' => 0, 'directories_removed' => 0, 'errors' => []];

        try {
            // Remove component file
            $componentPath = resource_path('js/Pages/' . $page->file_path);
            if (File::exists($componentPath)) {
                File::delete($componentPath);
                $report['files_removed']++;

                // Try to remove directory if empty
                $directory = dirname($componentPath);
                if (File::isDirectory($directory) && $this->isDirectoryEmpty($directory)) {
                    File::deleteDirectory($directory);
                    $report['directories_removed']++;
                }
            }

            // Remove from database
            $page->delete();
            $report['database_records_cleaned']++;

        } catch (\Exception $e) {
            $error = "Failed to cleanup page {$page->navigation_item_key}: " . $e->getMessage();
            $report['errors'][] = $error;
            Log::warning($error);
        }
    }

    /**
     * Find and remove component files that don't have database records
     */
    protected function cleanupUnreferencedFiles(array &$report): void
    {
        $pagesPath = resource_path('js/Pages');
        $generatedDirs = ['Customdashboard', 'Customdashboards', 'InventoryManagement', 'SalesDashboard', 'UserDirectory', 'Testpage'];

        foreach ($generatedDirs as $dir) {
            $dirPath = $pagesPath . '/' . $dir;
            
            if (!File::isDirectory($dirPath)) {
                continue;
            }

            $files = File::files($dirPath);
            
            foreach ($files as $file) {
                $fileName = $file->getBasename('.jsx');
                $relativePath = $dir . '/' . $fileName . '.jsx';
                
                // Check if this file has a corresponding database record
                $hasRecord = GeneratedPage::where('file_path', $relativePath)->exists();
                
                if (!$hasRecord) {
                    try {
                        File::delete($file->getPathname());
                        $report['files_removed']++;
                        
                        // Check if directory is now empty
                        if ($this->isDirectoryEmpty($dirPath)) {
                            File::deleteDirectory($dirPath);
                            $report['directories_removed']++;
                        }
                    } catch (\Exception $e) {
                        $report['errors'][] = "Failed to remove unreferenced file {$relativePath}: " . $e->getMessage();
                    }
                }
            }
        }
    }

    /**
     * Clean up routes in dynamic.php that don't have corresponding navigation items
     */
    protected function cleanupDynamicRoutes(array &$report): void
    {
        $dynamicRoutesFile = base_path('routes/dynamic.php');
        
        if (!File::exists($dynamicRoutesFile)) {
            return;
        }

        try {
            $content = File::get($dynamicRoutesFile);
            
            // Find all route names in the file
            preg_match_all('/->name\([\'"]([^\'"]+)[\'"]\)/', $content, $matches);
            $routeNames = $matches[1] ?? [];
            
            $cleanedContent = $content;
            $routesCleaned = 0;
            
            foreach ($routeNames as $routeName) {
                // Check if navigation item exists for this route
                $itemExists = NavigationItem::where('route_name', $routeName)->exists();
                
                if (!$itemExists && str_starts_with($routeName, 'tenant.')) {
                    // Extract title from the route comment for pattern matching
                    $pattern = '/\/\/ Auto-generated route for: ([^\n]+).*?->name\(\'' . preg_quote($routeName, '/') . '\'\);/s';
                    
                    if (preg_match($pattern, $cleanedContent)) {
                        $cleanedContent = preg_replace($pattern, '', $cleanedContent);
                        $routesCleaned++;
                    }
                }
            }
            
            if ($routesCleaned > 0) {
                // Clean up extra blank lines
                $cleanedContent = preg_replace('/\n\s*\n\s*\n/', "\n\n", $cleanedContent);
                File::put($dynamicRoutesFile, $cleanedContent);
                $report['routes_cleaned'] = $routesCleaned;
            }
            
        } catch (\Exception $e) {
            $report['errors'][] = 'Failed to cleanup dynamic routes: ' . $e->getMessage();
        }
    }

    /**
     * Check if directory is empty (contains only . and ..)
     */
    protected function isDirectoryEmpty(string $directory): bool
    {
        if (!File::isDirectory($directory)) {
            return false;
        }

        $files = scandir($directory);
        return count($files) <= 2; // Only . and .. remain
    }

    /**
     * Get statistics about generated pages
     */
    public function getStatistics(): array
    {
        $totalGenerated = GeneratedPage::count();
        $activeGenerated = GeneratedPage::where('is_active', true)->count();
        $orphanedPages = GeneratedPage::whereDoesntHave('navigationItem')->count();
        
        // Count component files on disk
        $pagesPath = resource_path('js/Pages');
        $generatedDirs = ['Customdashboard', 'Customdashboards', 'InventoryManagement', 'SalesDashboard', 'UserDirectory', 'Testpage'];
        
        $filesOnDisk = 0;
        foreach ($generatedDirs as $dir) {
            $dirPath = $pagesPath . '/' . $dir;
            if (File::isDirectory($dirPath)) {
                $filesOnDisk += count(File::files($dirPath));
            }
        }

        return [
            'total_generated_pages' => $totalGenerated,
            'active_generated_pages' => $activeGenerated,
            'orphaned_database_records' => $orphanedPages,
            'component_files_on_disk' => $filesOnDisk,
            'needs_cleanup' => $orphanedPages > 0 || $filesOnDisk > $totalGenerated,
        ];
    }

    /**
     * Validate page integrity - check if files exist for database records
     */
    public function validatePageIntegrity(): array
    {
        $issues = [];
        $pages = GeneratedPage::all();

        foreach ($pages as $page) {
            $filePath = resource_path('js/Pages/' . $page->file_path);
            
            if (!File::exists($filePath)) {
                $issues[] = [
                    'type' => 'missing_file',
                    'page' => $page->navigation_item_key,
                    'expected_path' => $page->file_path,
                    'message' => "Database record exists but file is missing: {$page->file_path}",
                ];
            }

            // Check if navigation item exists
            $navItem = NavigationItem::where('key', $page->navigation_item_key)->first();
            if (!$navItem) {
                $issues[] = [
                    'type' => 'orphaned_record',
                    'page' => $page->navigation_item_key,
                    'message' => "Generated page record exists but navigation item is missing",
                ];
            }
        }

        return $issues;
    }
} 