<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\NavigationItem;
use App\Services\PageTemplateService;
use App\Enums\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class NavigationItemsController extends Controller
{
    protected PageTemplateService $pageTemplateService;

    public function __construct(PageTemplateService $pageTemplateService)
    {
        $this->pageTemplateService = $pageTemplateService;
    }

    /**
     * Display a listing of navigation items
     */
    public function index()
    {
        $items = NavigationItem::active()
            ->ordered()
            ->get()
            ->groupBy('category');

        return response()->json([
            'success' => true,
            'items' => $items,
            'permissions' => Permission::getGroupedPermissions(),
        ]);
    }

    /**
     * Store a newly created navigation item
     */
    public function store(Request $request)
    {
        $request->validate([
            'label' => 'required|string|max:255',
            'icon' => 'required|string|max:255',
            'permission_required' => 'nullable|string|max:255',
            'category' => 'required|in:core,admin,content,custom',
            'description' => 'nullable|string|max:500',
            'generate_page' => 'boolean',
        ]);

        try {
            // Generate unique key from label
            $key = Str::snake(Str::lower($request->label));
            $key = preg_replace('/[^a-z0-9_]/', '_', $key);
            
            // Ensure uniqueness
            $originalKey = $key;
            $counter = 1;
            while (NavigationItem::where('key', $key)->exists()) {
                $key = $originalKey . '_' . $counter;
                $counter++;
            }

            // Generate route name
            $routeName = 'tenant.' . $key;

            // Create navigation item
            $item = NavigationItem::create([
                'key' => $key,
                'label' => $request->label,
                'icon' => $request->icon,
                'route_name' => $routeName,
                'permission_required' => $request->permission_required,
                'category' => $request->category,
                'description' => $request->description,
                'sort_order' => NavigationItem::where('category', $request->category)->max('sort_order') + 1,
                'is_active' => true,
            ]);

            // Generate page file if requested
            if ($request->boolean('generate_page')) {
                $componentName = Str::studly($key);
                $pageDirectory = Str::studly(str_replace('_', ' ', $key));
                
                $this->pageTemplateService->generatePage([
                    'key' => $key,
                    'componentName' => $componentName,
                    'pageDirectory' => $pageDirectory,
                    'title' => $request->label,
                    'description' => $request->description ?? "Manage {$request->label}",
                    'icon' => $request->icon,
                    'routeName' => $routeName,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Navigation item created successfully!',
                'item' => $item,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create navigation item: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Update the specified navigation item
     */
    public function update(Request $request, NavigationItem $item)
    {
        $request->validate([
            'label' => 'required|string|max:255',
            'icon' => 'required|string|max:255',
            'permission_required' => 'nullable|string|max:255',
            'category' => 'required|in:core,admin,content,custom',
            'description' => 'nullable|string|max:500',
        ]);

        try {
            $item->update([
                'label' => $request->label,
                'icon' => $request->icon,
                'permission_required' => $request->permission_required,
                'category' => $request->category,
                'description' => $request->description,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Navigation item updated successfully!',
                'item' => $item->fresh(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update navigation item: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Remove the specified navigation item
     */
    public function destroy(NavigationItem $item)
    {
        try {
            // Don't allow deletion of core navigation items
            if ($item->category === 'core') {
                return response()->json([
                    'success' => false,
                    'message' => 'Core navigation items cannot be deleted.',
                ], 422);
            }

            // Check if this is a custom generated page that needs cleanup
            $generatedPage = \App\Models\GeneratedPage::where('navigation_item_key', $item->key)->first();
            
            if ($generatedPage) {
                // Clean up generated files and routes
                $this->cleanupGeneratedPage($generatedPage, $item);
            }

            $item->delete();

            return response()->json([
                'success' => true,
                'message' => 'Navigation item and associated files deleted successfully!',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete navigation item: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Clean up all files and routes associated with a generated page
     */
    protected function cleanupGeneratedPage(\App\Models\GeneratedPage $generatedPage, NavigationItem $item): void
    {
        try {
            // 1. Delete the React component file
            $componentPath = resource_path('js/Pages/' . $generatedPage->file_path);
            if (file_exists($componentPath)) {
                unlink($componentPath);
                
                // Check if directory is empty and remove it
                $directory = dirname($componentPath);
                if (is_dir($directory) && count(scandir($directory)) === 2) { // Only . and .. remain
                    rmdir($directory);
                }
            }

            // 2. Remove route from dynamic.php
            $this->removeRouteFromDynamicFile($item->route_name, $item->label);

            // 3. Delete the GeneratedPage record
            $generatedPage->delete();

        } catch (\Exception $e) {
            // Log error but don't fail the deletion
            \Log::warning('Failed to cleanup some generated page files', [
                'navigation_item' => $item->key,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Remove a specific route from the dynamic.php file
     */
    protected function removeRouteFromDynamicFile(string $routeName, string $title): void
    {
        $dynamicRoutesFile = base_path('routes/dynamic.php');
        
        if (!file_exists($dynamicRoutesFile)) {
            return;
        }

        $content = file_get_contents($dynamicRoutesFile);
        
        // Find and remove the specific route block
        // Pattern matches from comment to the route definition
        $pattern = '/\/\/ Auto-generated route for: ' . preg_quote($title, '/') . '.*?->name\(\'' . preg_quote($routeName, '/') . '\'\);/s';
        
        $newContent = preg_replace($pattern, '', $content);
        
        // Clean up any extra blank lines
        $newContent = preg_replace('/\n\s*\n\s*\n/', "\n\n", $newContent);
        
        file_put_contents($dynamicRoutesFile, $newContent);
    }

    /**
     * Generate a page for an existing navigation item
     */
    public function generatePage(NavigationItem $item)
    {
        try {
            $componentName = Str::studly($item->key);
            $pageDirectory = Str::studly(str_replace('_', ' ', $item->key));
            
            $this->pageTemplateService->generatePage([
                'key' => $item->key,
                'componentName' => $componentName,
                'pageDirectory' => $pageDirectory,
                'title' => $item->label,
                'description' => $item->description ?? "Manage {$item->label}",
                'icon' => $item->icon,
                'routeName' => $item->route_name,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Page generated successfully!',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate page: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get available permissions for frontend
     */
    public function permissions(Request $request)
    {
        $tenantId = $request->get('tenant_id');
        
        // Get all permissions
        $allPermissions = Permission::getGroupedPermissions();
        
        if ($tenantId) {
            // Filter permissions to only show tenant-relevant ones
            $tenantRelevantPermissions = $this->filterTenantPermissions($allPermissions);
            
            return response()->json([
                'success' => true,
                'permissions' => $tenantRelevantPermissions,
                'tenant_id' => $tenantId,
            ]);
        }
        
        // Return all permissions if no tenant context
        return response()->json([
            'success' => true,
            'permissions' => $allPermissions,
        ]);
    }
    
    /**
     * Filter permissions to only show those relevant to tenants
     */
    private function filterTenantPermissions(array $allPermissions): array
    {
        $tenantRelevantPermissions = [];
        
        foreach ($allPermissions as $category => $permissions) {
            $filteredPermissions = [];
            
            foreach ($permissions as $key => $permission) {
                // Exclude system-level permissions that shouldn't be available to tenant users
                if (!in_array($key, [
                    Permission::MANAGE_TENANTS,
                    Permission::MANAGE_SYSTEM_SETTINGS,
                    Permission::VIEW_SYSTEM_ANALYTICS,
                    Permission::IMPERSONATE_USERS,
                    Permission::VIEW_ALL_DATA,
                    Permission::EXPORT_SYSTEM_DATA,
                    Permission::MANAGE_SYSTEM_BACKUPS,
                    Permission::MANAGE_CENTRAL_USERS,
                    Permission::CREATE_TENANTS,
                    Permission::DELETE_TENANTS,
                ])) {
                    $filteredPermissions[$key] = $permission;
                }
            }
            
            // Only include categories that have remaining permissions
            if (!empty($filteredPermissions)) {
                $tenantRelevantPermissions[$category] = $filteredPermissions;
            }
        }
        
        return $tenantRelevantPermissions;
    }
} 