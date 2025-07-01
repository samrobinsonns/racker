<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\NavigationConfiguration;
use App\Models\NavigationItem;
use App\Enums\Permission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TenantNavigationController extends Controller
{
    public function builder(Request $request)
    {
        $tenant = $request->user()->tenant;
        
        // Get configurations for current tenant only
        $configurations = NavigationConfiguration::where('tenant_id', $tenant->id)
            ->with(['role'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Get available items, filtering out central admin items
        $availableItems = NavigationItem::active()
            ->whereNotIn('category', [NavigationItem::CATEGORY_CENTRAL_ADMIN])
            ->orderBy('sort_order')
            ->get()
            ->groupBy('category')
            ->map(function ($items, $category) {
                return [
                    'category' => $category,
                    'label' => $this->getCategoryLabel($category),
                    'items' => $items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'key' => $item->key,
                            'label' => $item->label,
                            'icon' => $item->icon,
                            'route_name' => $item->route_name,
                            'permission_required' => $item->permission_required,
                            'description' => $item->description,
                        ];
                    }),
                ];
            })
            ->values();

        return Inertia::render('Tenant/Navigation/Builder', [
            'tenant' => $tenant,
            'configurations' => $configurations,
            'availableItems' => $availableItems,
            'isTenantVersion' => true,
        ]);
    }

    private function getCategoryLabel($category)
    {
        return match ($category) {
            NavigationItem::CATEGORY_CORE => 'Core Features',
            NavigationItem::CATEGORY_ADMIN => 'Administrative',
            NavigationItem::CATEGORY_CONTENT => 'Content Management',
            NavigationItem::CATEGORY_CUSTOM => 'Custom Items',
            default => 'Other',
        };
    }

    public function store(Request $request)
    {
        $tenant = $request->user()->tenant;
        
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'configuration' => ['required', 'array'],
        ]);

        // Create or update configuration
        $configuration = NavigationConfiguration::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'name' => $request->name,
            ],
            [
                'configuration' => $request->configuration,
                'is_active' => $request->activate ?? false,
            ]
        );

        if ($request->activate) {
            // Deactivate other configurations for this tenant
            NavigationConfiguration::where('tenant_id', $tenant->id)
                ->where('id', '!=', $configuration->id)
                ->update(['is_active' => false]);
        }

        return response()->json([
            'success' => true,
            'message' => $request->activate 
                ? 'Navigation configuration saved and activated successfully!'
                : 'Navigation configuration saved successfully!',
            'configuration' => $configuration
        ]);
    }

    public function destroy(NavigationConfiguration $configuration, Request $request)
    {
        $tenant = $request->user()->tenant;
        
        // Ensure the configuration belongs to the current tenant
        if ($configuration->tenant_id !== $tenant->id) {
            abort(403, 'Unauthorized action.');
        }

        $configuration->delete();

        return response()->json([
            'success' => true,
            'message' => 'Navigation configuration deleted successfully!'
        ]);
    }
} 