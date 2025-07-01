<?php

namespace App\Http\Controllers\TenantAdmin;

use App\Http\Controllers\Controller;
use App\Models\NavigationConfiguration;
use App\Models\NavigationItem;
use App\Models\Role;
use App\Services\PermissionService;
use App\Enums\Permission;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;

class TenantNavigationController extends Controller
{
    protected PermissionService $permissionService;

    public function __construct(PermissionService $permissionService)
    {
        $this->permissionService = $permissionService;
    }

    public function builder(Request $request)
    {
        $user = $request->user();
        $tenant = $user->tenant;
        
        // Get configurations for current tenant only
        $configurations = NavigationConfiguration::where('tenant_id', $tenant->id)
            ->with(['role'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Get available items for tenant admin (including administrative items)
        $availableItems = NavigationItem::active()
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

        // Get tenant roles
        $roles = Role::forTenant($tenant->id)->get();

        // Get user permissions
        $userPermissions = $this->permissionService->getUserPermissions($user, $tenant->id);

        return Inertia::render('TenantAdmin/Navigation/Builder', [
            'tenant' => $tenant,
            'configurations' => $configurations,
            'availableItems' => $availableItems,
            'roles' => $roles,
            'userPermissions' => $userPermissions,
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
            'role_id' => ['nullable', 'exists:roles,id'],
            'activate' => ['boolean'],
        ]);

        // Validate role belongs to tenant if provided
        if ($request->role_id) {
            $role = Role::find($request->role_id);
            if (!$role || $role->tenant_id !== $tenant->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid role for this tenant.',
                ], 422);
            }
        }

        try {
            // Use NavigationService to save configuration
            $navigationService = app(\App\Services\NavigationService::class);
            $configuration = $navigationService->saveConfiguration(
                $tenant->id,
                $request->configuration,
                $request->name,
                $request->user(),
                null, // user_id - for tenant admin, this is typically role-based
                $request->role_id
            );

            // Activate if requested
            if ($request->activate) {
                $navigationService->activateConfiguration($configuration);
                $message = 'Navigation configuration saved and activated successfully!';
                
                // Debug: Check if configuration is now active
                $configuration->refresh();
                \Log::info('Configuration after activation', [
                    'id' => $configuration->id,
                    'is_active' => $configuration->is_active,
                    'role_id' => $configuration->role_id,
                    'tenant_id' => $configuration->tenant_id
                ]);
            } else {
                $message = 'Navigation configuration saved successfully!';
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'configuration' => $configuration
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to save navigation configuration', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to save configuration: ' . $e->getMessage(),
            ], 422);
        }
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

    /**
     * Get current navigation for a role within the tenant
     */
    public function getCurrent(Request $request)
    {
        $tenant = $request->user()->tenant;
        
        $request->validate([
            'type' => 'required|in:role,user',
            'target_id' => 'required|integer',
        ]);

        try {
            if ($request->type === 'role') {
                // Validate role belongs to tenant
                $role = Role::find($request->target_id);
                if (!$role || $role->tenant_id !== $tenant->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid role for this tenant.',
                    ], 422);
                }

                // Get any user with this role to use NavigationService
                $sampleUser = User::join('user_roles', 'users.id', '=', 'user_roles.user_id')
                    ->where('users.tenant_id', $tenant->id)
                    ->where('user_roles.role_id', $request->target_id)
                    ->where('user_roles.tenant_id', $tenant->id)
                    ->select('users.*')
                    ->first();

                if (!$sampleUser) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No users found with this role.',
                    ], 404);
                }

                // Use NavigationService to get current navigation
                $navigationService = app(\App\Services\NavigationService::class);
                $currentNavigation = $navigationService->getNavigationForUser($sampleUser);

                // Debug: Log the navigation data
                \Log::info('Current navigation for role', [
                    'role_id' => $request->target_id,
                    'sample_user_id' => $sampleUser->id,
                    'navigation_items_count' => count($currentNavigation['items'] ?? []),
                    'navigation_data' => $currentNavigation
                ]);

                return response()->json([
                    'success' => true,
                    'navigation' => $currentNavigation,
                    'message' => 'Current navigation loaded successfully',
                ]);
            } else {
                // Validate user belongs to tenant
                $targetUser = User::find($request->target_id);
                if (!$targetUser || $targetUser->tenant_id !== $tenant->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid user for this tenant.',
                    ], 422);
                }

                // Use NavigationService to get current navigation
                $navigationService = app(\App\Services\NavigationService::class);
                $currentNavigation = $navigationService->getNavigationForUser($targetUser);

                return response()->json([
                    'success' => true,
                    'navigation' => $currentNavigation,
                    'message' => 'Current navigation loaded successfully',
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load current navigation: ' . $e->getMessage(),
            ], 422);
        }
    }
} 