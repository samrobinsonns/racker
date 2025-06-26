<?php

namespace App\Console\Commands;

use App\Services\RouteDiscoveryService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class NavigationDiscoveryCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'navigation:discovery 
                          {action=list : Action to perform (list, enable, disable, test)}
                          {--save : Save discovered routes to seeder file}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Manage navigation route discovery';

    /**
     * Execute the console command.
     */
    public function handle(RouteDiscoveryService $discoveryService): int
    {
        $action = $this->argument('action');

        return match ($action) {
            'list' => $this->listDiscoveredRoutes($discoveryService),
            'enable' => $this->enableDiscovery(),
            'disable' => $this->disableDiscovery(),
            'test' => $this->testDiscovery($discoveryService),
            default => $this->error("Unknown action: {$action}. Use list, enable, disable, or test.")
        };
    }

    /**
     * List all discovered routes
     */
    protected function listDiscoveredRoutes(RouteDiscoveryService $discoveryService): int
    {
        $this->info('🔍 Discovering available routes...');
        
        $discovered = $discoveryService->discoverRoutes();
        
        if (empty($discovered)) {
            $this->warn('No new routes discovered.');
            return self::SUCCESS;
        }

        $this->info("Found {$this->countTotalItems($discovered)} discoverable routes:");
        $this->newLine();

        foreach ($discovered as $category) {
            $this->line("<comment>{$category['label']}</comment>");
            
            foreach ($category['items'] as $item) {
                $this->line("  • {$item['label']} <info>({$item['route_name']})</info>");
                $this->line("    Icon: {$item['icon']}, Permission: " . ($item['permission_required'] ?? 'None'));
            }
            
            $this->newLine();
        }

        if ($this->option('save')) {
            $this->saveToSeeder($discovered);
        }

        return self::SUCCESS;
    }

    /**
     * Enable route discovery
     */
    protected function enableDiscovery(): int
    {
        $this->updateEnvFile('NAVIGATION_ENABLE_ROUTE_DISCOVERY', 'true');
        $this->info('✅ Route discovery enabled!');
        $this->line('Discovered routes will now appear in the Navigation Builder.');
        
        return self::SUCCESS;
    }

    /**
     * Disable route discovery
     */
    protected function disableDiscovery(): int
    {
        $this->updateEnvFile('NAVIGATION_ENABLE_ROUTE_DISCOVERY', 'false');
        $this->info('❌ Route discovery disabled.');
        $this->line('Only seeded navigation items will appear in the Navigation Builder.');
        
        return self::SUCCESS;
    }

    /**
     * Test discovery and show statistics
     */
    protected function testDiscovery(RouteDiscoveryService $discoveryService): int
    {
        $this->info('🧪 Testing route discovery...');
        
        $discovered = $discoveryService->discoverRoutes();
        $merged = $discoveryService->getMergedAvailableItems();
        
        $totalDiscovered = $this->countTotalItems($discovered);
        $totalMerged = $this->countTotalItems($merged);
        $seededCount = $totalMerged - $totalDiscovered;
        
        $this->newLine();
        $this->line("<comment>Discovery Statistics:</comment>");
        $this->line("• Seeded Items: <info>{$seededCount}</info>");
        $this->line("• Discovered Items: <info>{$totalDiscovered}</info>");
        $this->line("• Total Available: <info>{$totalMerged}</info>");
        
        if ($totalDiscovered > 0) {
            $this->newLine();
            $this->line("<comment>New Routes Found:</comment>");
            
            foreach ($discovered as $category) {
                if (!empty($category['items'])) {
                    $this->line("• {$category['label']}: " . count($category['items']) . " items");
                }
            }
        }
        
        $isEnabled = config('navigation.enable_route_discovery', false);
        $this->newLine();
        $this->line("Route Discovery Status: " . ($isEnabled ? "<info>Enabled</info>" : "<comment>Disabled</comment>"));
        
        return self::SUCCESS;
    }

    /**
     * Count total items across all categories
     */
    protected function countTotalItems(array $categories): int
    {
        return collect($categories)->sum(fn($category) => count($category['items'] ?? []));
    }

    /**
     * Update environment file
     */
    protected function updateEnvFile(string $key, string $value): void
    {
        $envFile = base_path('.env');
        
        if (!File::exists($envFile)) {
            File::put($envFile, '');
        }
        
        $envContent = File::get($envFile);
        
        // Check if key already exists
        if (preg_match("/^{$key}=.*$/m", $envContent)) {
            // Update existing key
            $envContent = preg_replace("/^{$key}=.*$/m", "{$key}={$value}", $envContent);
        } else {
            // Add new key
            $envContent .= "\n{$key}={$value}\n";
        }
        
        File::put($envFile, $envContent);
    }

    /**
     * Save discovered routes to a seeder file (optional feature)
     */
    protected function saveToSeeder(array $discovered): void
    {
        $this->info('💾 Saving discovered routes to seeder...');
        
        $seederContent = $this->generateSeederContent($discovered);
        $seederPath = database_path('seeders/DiscoveredNavigationItemsSeeder.php');
        
        File::put($seederPath, $seederContent);
        
        $this->info("✅ Saved to: {$seederPath}");
        $this->line('You can run: php artisan db:seed --class=DiscoveredNavigationItemsSeeder');
    }

    /**
     * Generate seeder file content
     */
    protected function generateSeederContent(array $discovered): string
    {
        $items = collect($discovered)
            ->flatMap(fn($category) => $category['items'])
            ->map(function ($item) {
                return [
                    'key' => $item['key'],
                    'label' => $item['label'],
                    'icon' => $item['icon'],
                    'route_name' => $item['route_name'],
                    'permission_required' => $item['permission_required'],
                    'category' => $item['category'],
                    'description' => $item['description'],
                    'sort_order' => 100, // High sort order for discovered items
                ];
            })
            ->toArray();

        $itemsCode = var_export($items, true);

        return <<<PHP
<?php

namespace Database\Seeders;

use App\Models\NavigationItem;
use Illuminate\Database\Seeder;

class DiscoveredNavigationItemsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \$items = {$itemsCode};

        foreach (\$items as \$item) {
            NavigationItem::firstOrCreate(
                ['key' => \$item['key']],
                \$item
            );
        }

        \$this->command->info('Discovered navigation items seeded successfully!');
    }
}
PHP;
    }
} 