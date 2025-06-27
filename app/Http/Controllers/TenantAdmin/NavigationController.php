<?php

namespace App\Http\Controllers\TenantAdmin;

use App\Http\Controllers\Controller;
use App\Models\NavigationConfiguration;
use App\Models\Role;
use App\Models\User;
use App\Services\NavigationService;
use App\Services\PermissionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NavigationController extends Controller
{
    protected NavigationService $navigationService;
    protected PermissionService $permissionService;

    public function __construct(NavigationService $navigationService, PermissionService $permissionService)
    {
        $this->navigationService = $navigationService;
        $this->permissionService = $permissionService;
    }

    /**
     * Display the navigation builder index
     */
    public function index()
    {
        $user = auth()->user();
        $tenant = $user->tenant;

        if (!$tenant) {
            abort(403, 'You must be associated with a tenant to access this feature.');
        }

        return Inertia::render('TenantAdmin/Navigation/Index', [
            'tenant' => $tenant,
        ]);
    }

    /**
     * Show the navigation builder for the tenant
     */
    public function builder()
    {
        $user = auth()->user();
        $tenant = $user->tenant;

        if (!$tenant) {
            abort(403, 'You must be associated with a tenant to access this feature.');
        }

        // Get tenant roles only
        $roles = Role::forTenant($tenant->id)->get();
        
        // Get existing configurations for this tenant
        $configurations = $this->navigationService->getTenantConfigurations($tenant->id);
        
        // Get available navigation items filtered by user's permissions
        $availableItems = $this->getAvailableItemsForTenant($user);

        // Get tenant users for the interface
        $tenantUsers = User::where('tenant_id', $tenant->id)->get(['id', 'name', 'email']);

        return Inertia::render('TenantAdmin/Navigation/Builder', [
            'tenant' => $tenant,
            'configurations' => $configurations,
            'availableItems' => $availableItems,
            'users' => $tenantUsers,
            'roles' => $roles,
            'userPermissions' => $this->permissionService->getUserPermissions($user, $tenant->id),
        ]);
    }

    /**
     * Store a navigation configuration for the tenant
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        $tenant = $user->tenant;

        if (!$tenant) {
            abort(403, 'You must be associated with a tenant to access this feature.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'configuration' => 'required|array',
            'configuration.items' => 'required|array',
            'configuration.layout' => 'required|string|in:sidebar,top',
            'configuration.theme' => 'required|string',
            'role_id' => 'nullable|exists:roles,id',
            'activate' => 'boolean',
        ]);

        try {
            // Validate that role belongs to this tenant
            if ($request->role_id) {
                $role = Role::find($request->role_id);
                if (!$role || $role->tenant_id !== $tenant->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid role selection for this tenant.',
                    ], 422);
                }
            }

            // Validate navigation items permissions
            $validationResult = $this->validateNavigationConfiguration($request->configuration, $user);
            if (!$validationResult['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid navigation configuration: ' . $validationResult['message'],
                ], 422);
            }

            // Save the configuration
            $config = $this->navigationService->saveConfiguration(
                $tenant->id,
                $request->name,
                $request->configuration,
                $user,
                null, // user_id - for tenant admin, this is typically role-based
                $request->role_id
            );

            // Activate if requested
            if ($request->boolean('activate')) {
                $this->navigationService->activateConfiguration($config);
                $message = 'Navigation configuration saved and activated successfully!';
            } else {
                $message = 'Navigation configuration saved as draft successfully!';
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'configuration' => $config,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save configuration: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get current navigation for a role within the tenant
     */
    public function getCurrent(Request $request)
    {
        $user = auth()->user();
        $tenant = $user->tenant;

        if (!$tenant) {
            abort(403, 'You must be associated with a tenant to access this feature.');
        }

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

                // Get navigation for role
                $navigation = $this->navigationService->getNavigationForRole($role, $tenant->id);
            } else {
                // Validate user belongs to tenant
                $targetUser = User::find($request->target_id);
                if (!$targetUser || $targetUser->tenant_id !== $tenant->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid user for this tenant.',
                    ], 422);
                }

                // Get navigation for user
                $navigation = $this->navigationService->getNavigationForUser($targetUser);
            }

            return response()->json([
                'success' => true,
                'navigation' => $navigation,
                'message' => 'Current navigation loaded successfully',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load current navigation: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Delete a navigation configuration (tenant-scoped)
     */
    public function destroy(NavigationConfiguration $configuration)
    {
        $user = auth()->user();
        $tenant = $user->tenant;

        // Ensure configuration belongs to this tenant
        if ($configuration->tenant_id !== $tenant->id) {
            abort(403, 'You can only delete configurations for your own tenant.');
        }

        try {
            $configuration->delete();

            return response()->json([
                'success' => true,
                'message' => 'Navigation configuration deleted successfully',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete configuration: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get available navigation items filtered by tenant permissions
     */
    protected function getAvailableItemsForTenant(User $user): array
    {
        // Get user's permissions
        $userPermissions = $this->permissionService->getUserPermissions($user, $user->tenant_id);

        // Get tenant-specific available navigation items (excludes central admin routes)
        $allItems = $this->navigationService->getTenantAvailableItems(true); // Include discovered routes

        // Filter items based on permissions
        $filteredItems = [];
        foreach ($allItems as $category) {
            $filteredCategoryItems = [];

            foreach ($category['items'] as $item) {
                // Skip items that require permissions the user doesn't have
                if (isset($item['permission_required']) && $item['permission_required']) {
                    if (!in_array($item['permission_required'], $userPermissions)) {
                        continue;
                    }
                }

                $filteredCategoryItems[] = $item;
            }

            // Only include categories that have items
            if (!empty($filteredCategoryItems)) {
                $filteredItems[] = [
                    'category' => $category['category'],
                    'label' => $category['label'],
                    'items' => $filteredCategoryItems,
                ];
            }
        }

        return $filteredItems;
    }

    /**
     * Validate navigation configuration items against user permissions
     */
    protected function validateNavigationConfiguration(array $configuration, User $user): array
    {
        $userPermissions = $this->permissionService->getUserPermissions($user, $user->tenant_id);
        $invalidItems = [];

        // Recursive function to check items and their children
        $checkItems = function ($items) use ($userPermissions, &$invalidItems, &$checkItems) {
            foreach ($items as $item) {
                // Check if item requires a permission the user doesn't have
                if (isset($item['permission']) && $item['permission']) {
                    if (!in_array($item['permission'], $userPermissions)) {
                        $invalidItems[] = $item['label'] ?? 'Unknown item';
                    }
                }

                // Check children if they exist
                if (isset($item['children']) && is_array($item['children'])) {
                    $checkItems($item['children']);
                }
            }
        };

        $checkItems($configuration['items'] ?? []);

        if (!empty($invalidItems)) {
            return [
                'valid' => false,
                'message' => 'You do not have permission to include these items: ' . implode(', ', $invalidItems),
            ];
        }

        return ['valid' => true];
    }

    /**
     * Preview navigation configuration
     */
    public function preview(Request $request)
    {
        $user = auth()->user();
        $tenant = $user->tenant;

        if (!$tenant) {
            abort(403, 'You must be associated with a tenant to access this feature.');
        }

        $request->validate([
            'configuration' => 'required|array',
        ]);

        try {
            // Validate configuration
            $validationResult = $this->validateNavigationConfiguration($request->configuration, $user);
            if (!$validationResult['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => $validationResult['message'],
                ], 422);
            }

            // Process configuration for preview
            $processedConfig = $this->navigationService->processConfiguration($request->configuration, $user);

            return response()->json([
                'success' => true,
                'preview' => $processedConfig,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate preview: ' . $e->getMessage(),
            ], 422);
        }
    }
} 