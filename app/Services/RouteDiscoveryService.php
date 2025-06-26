<?php

namespace App\Services;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use App\Models\NavigationItem;
use App\Enums\Permission;

class RouteDiscoveryService
{
    /**
     * Discover all available routes that could be navigation items
     */
    public function discoverRoutes(): array
    {
        $routes = Route::getRoutes();
        $discoveredItems = [];
        
        foreach ($routes as $route) {
            $routeName = $route->getName();
            
            // Skip routes without names or that shouldn't be in navigation
            if (!$routeName || $this->shouldSkipRoute($routeName)) {
                continue;
            }
            
            // Check if this route is already in the navigation items library
            if (NavigationItem::where('route_name', $routeName)->exists()) {
                continue;
            }
            
            $item = $this->analyzeRoute($route);
            if ($item) {
                $discoveredItems[] = $item;
            }
        }
        
        return $this->groupByCategory($discoveredItems);
    }
    
    /**
     * Determine if a route should be skipped
     */
    protected function shouldSkipRoute(string $routeName): bool
    {
        $skipPatterns = config('navigation.discovery_exclude_patterns', [
            'auth.*',           // Authentication routes
            'password.*',       // Password reset routes
            'verification.*',   // Email verification routes
            'sanctum.*',        // API routes
            'horizon.*',        // Laravel Horizon
            'telescope.*',      // Laravel Telescope
            'debugbar.*',       // Debug bar
            '_debugbar.*',      // Debug bar
            'ignition.*',       // Ignition error pages
            '*.store',          // Form submission endpoints
            '*.update',         // Form submission endpoints
            '*.destroy',        // Delete endpoints
            '*.api.*',          // API endpoints
            '*.ajax.*',         // AJAX endpoints
            '*.callback',       // Callback endpoints
            '*.webhook',        // Webhook endpoints
        ]);
        
        foreach ($skipPatterns as $pattern) {
            if (Str::is($pattern, $routeName)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Analyze a route and create a navigation item structure
     */
    protected function analyzeRoute(\Illuminate\Routing\Route $route): ?array
    {
        $routeName = $route->getName();
        $uri = $route->uri();
        $methods = $route->methods();
        
        // Only include GET routes for navigation
        if (!in_array('GET', $methods)) {
            return null;
        }
        
        // Extract meaningful parts from route name
        $parts = explode('.', $routeName);
        $lastPart = end($parts);
        
        // Skip if it's likely a form/action endpoint
        if (in_array($lastPart, ['create', 'edit', 'show', 'store', 'update', 'destroy'])) {
            return null;
        }
        
        return [
            'key' => $this->generateKey($routeName),
            'label' => $this->generateLabel($routeName),
            'icon' => $this->suggestIcon($routeName),
            'route_name' => $routeName,
            'permission_required' => $this->suggestPermission($routeName),
            'category' => $this->categorizeRoute($routeName),
            'uri' => $uri,
            'description' => $this->generateDescription($routeName),
            'is_discovered' => true,
            'middleware' => $this->getRouteMiddleware($route),
        ];
    }
    
    /**
     * Generate a unique key from route name
     */
    protected function generateKey(string $routeName): string
    {
        return Str::slug(str_replace('.', '_', $routeName), '_');
    }
    
    /**
     * Generate a human-readable label from route name
     */
    protected function generateLabel(string $routeName): string
    {
        $parts = explode('.', $routeName);
        
        // Remove common prefixes
        $parts = array_filter($parts, function($part) {
            return !in_array($part, ['tenant', 'admin', 'central']);
        });
        
        // Convert to title case
        $label = implode(' ', array_map(function($part) {
            return Str::title(str_replace(['-', '_'], ' ', $part));
        }, $parts));
        
        return $label ?: 'Unknown Page';
    }
    
    /**
     * Suggest an appropriate icon for the route
     */
    protected function suggestIcon(string $routeName): string
    {
        $iconMap = config('navigation.icon_mapping', [
            // Dashboard related
            'dashboard' => 'HomeIcon',
            'home' => 'HomeIcon',
            
            // User management
            'user' => 'UserIcon',
            'users' => 'UsersIcon',
            'profile' => 'UserCircleIcon',
            'account' => 'UserCircleIcon',
            
            // Analytics & Reports
            'analytic' => 'ChartPieIcon',
            'report' => 'ChartBarIcon',
            'metric' => 'ChartLineIcon',
            'stat' => 'ChartBarIcon',
            
            // Content & Documents
            'content' => 'DocumentTextIcon',
            'document' => 'DocumentIcon',
            'file' => 'DocumentIcon',
            'page' => 'DocumentTextIcon',
            
            // Settings & Configuration
            'setting' => 'Cog6ToothIcon',
            'config' => 'Cog6ToothIcon',
            'preference' => 'AdjustmentsHorizontalIcon',
            
            // Inventory & Resources
            'inventory' => 'CubeIcon',
            'product' => 'ShoppingBagIcon',
            'item' => 'CubeIcon',
            'resource' => 'CubeIcon',
            
            // Sales & Commerce
            'sale' => 'CurrencyDollarIcon',
            'order' => 'ShoppingCartIcon',
            'payment' => 'CreditCardIcon',
            'invoice' => 'DocumentTextIcon',
            
            // Communication
            'message' => 'ChatBubbleLeftIcon',
            'notification' => 'BellIcon',
            'email' => 'EnvelopeIcon',
            
            // System & Admin
            'tenant' => 'BuildingOffice2Icon',
            'admin' => 'ShieldCheckIcon',
            'system' => 'CpuChipIcon',
            'log' => 'DocumentTextIcon',
        ]);
        
        $routeLower = strtolower($routeName);
        
        foreach ($iconMap as $keyword => $icon) {
            if (Str::contains($routeLower, $keyword)) {
                return $icon;
            }
        }
        
        return 'QuestionMarkCircleIcon'; // Default icon
    }
    
    /**
     * Suggest appropriate permission for the route
     */
    protected function suggestPermission(string $routeName): ?string
    {
        // Admin routes
        if (Str::contains($routeName, 'admin') || Str::contains($routeName, 'manage')) {
            if (Str::contains($routeName, 'user')) {
                return Permission::MANAGE_TENANT_USERS;
            }
            if (Str::contains($routeName, 'setting')) {
                return Permission::MANAGE_TENANT_SETTINGS;
            }
            return Permission::MANAGE_TENANT_USERS; // Default admin permission
        }
        
        // Analytics/Reports
        if (Str::contains($routeName, ['analytic', 'report', 'metric'])) {
            return Permission::VIEW_TENANT_ANALYTICS;
        }
        
        // Content management
        if (Str::contains($routeName, ['content', 'document', 'page'])) {
            return Permission::VIEW_TENANT_DATA;
        }
        
        // Dashboard access
        if (Str::contains($routeName, 'dashboard')) {
            return Permission::VIEW_DASHBOARD;
        }
        
        // Default to basic view permission
        return Permission::VIEW_TENANT_DATA;
    }
    
    /**
     * Categorize route based on its name and purpose
     */
    protected function categorizeRoute(string $routeName): string
    {
        // Admin category
        if (Str::contains($routeName, ['admin', 'manage', 'setting', 'config'])) {
            return NavigationItem::CATEGORY_ADMIN;
        }
        
        // Content category
        if (Str::contains($routeName, ['content', 'document', 'page', 'analytic', 'report'])) {
            return NavigationItem::CATEGORY_CONTENT;
        }
        
        // Core category
        if (Str::contains($routeName, ['dashboard', 'home', 'profile'])) {
            return NavigationItem::CATEGORY_CORE;
        }
        
        return NavigationItem::CATEGORY_CUSTOM;
    }
    
    /**
     * Generate description for the route
     */
    protected function generateDescription(string $routeName): string
    {
        $label = $this->generateLabel($routeName);
        return "Access {$label} functionality";
    }
    
    /**
     * Get middleware applied to the route
     */
    protected function getRouteMiddleware(\Illuminate\Routing\Route $route): array
    {
        return $route->gatherMiddleware();
    }
    
    /**
     * Group discovered items by category
     */
    protected function groupByCategory(array $items): array
    {
        $grouped = [];
        
        foreach ($items as $item) {
            $category = $item['category'];
            
            if (!isset($grouped[$category])) {
                $grouped[$category] = [
                    'category' => $category,
                    'label' => NavigationItem::getCategories()[$category] ?? ucfirst($category),
                    'items' => [],
                ];
            }
            
            $grouped[$category]['items'][] = $item;
        }
        
        // Sort items within each category
        foreach ($grouped as &$categoryData) {
            usort($categoryData['items'], function($a, $b) {
                return strcmp($a['label'], $b['label']);
            });
        }
        
        return array_values($grouped);
    }
    
    /**
     * Get discovered routes merged with existing seeded items
     */
    public function getMergedAvailableItems(): array
    {
        // Get existing seeded items
        $seededItems = NavigationItem::active()
            ->ordered()
            ->get()
            ->groupBy('category')
            ->map(function ($items, $category) {
                return [
                    'category' => $category,
                    'label' => NavigationItem::getCategories()[$category] ?? ucfirst($category),
                    'items' => $items->toArray(),
                ];
            })
            ->values()
            ->toArray();
        
        // Get discovered items
        $discoveredItems = $this->discoverRoutes();
        
        // Merge the arrays, with seeded items taking precedence
        $merged = collect($seededItems)->toArray();
        
        foreach ($discoveredItems as $discoveredCategory) {
            $existingCategoryIndex = null;
            
            // Find existing category index
            foreach ($merged as $index => $category) {
                if ($category['category'] === $discoveredCategory['category']) {
                    $existingCategoryIndex = $index;
                    break;
                }
            }
            
            if ($existingCategoryIndex !== null) {
                // Add discovered items to existing category
                $merged[$existingCategoryIndex]['items'] = array_merge(
                    $merged[$existingCategoryIndex]['items'],
                    $discoveredCategory['items']
                );
            } else {
                // Add new category
                $merged[] = $discoveredCategory;
            }
        }
        
        return $merged;
    }
} 