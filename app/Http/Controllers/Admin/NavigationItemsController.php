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

            $item->delete();

            return response()->json([
                'success' => true,
                'message' => 'Navigation item deleted successfully!',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete navigation item: ' . $e->getMessage(),
            ], 422);
        }
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
    public function permissions()
    {
        return response()->json([
            'success' => true,
            'permissions' => Permission::getGroupedPermissions(),
        ]);
    }
} 