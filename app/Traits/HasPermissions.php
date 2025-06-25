<?php

namespace App\Traits;

use App\Services\PermissionService;
use App\Enums\Permission;

trait HasPermissions
{
    /**
     * Check if user has specific permission
     */
    public function hasPermission(string $permission, ?string $tenantId = null): bool
    {
        return app(PermissionService::class)->userHasPermission($this, $permission, $tenantId);
    }

    /**
     * Check if user has any of the specified permissions
     */
    public function hasAnyPermission(array $permissions, ?string $tenantId = null): bool
    {
        return app(PermissionService::class)->userHasAnyPermission($this, $permissions, $tenantId);
    }

    /**
     * Check if user has all specified permissions
     */
    public function hasAllPermissions(array $permissions, ?string $tenantId = null): bool
    {
        return app(PermissionService::class)->userHasAllPermissions($this, $permissions, $tenantId);
    }

    /**
     * Get all permissions for user
     */
    public function getAllPermissions(?string $tenantId = null): array
    {
        return app(PermissionService::class)->getUserPermissions($this, $tenantId);
    }

    /**
     * Check resource-specific permission
     */
    public function canAccessResource(string $resourceType, string $action, $resourceId = null): bool
    {
        return app(PermissionService::class)->userCanAccessResource($this, $resourceType, $action, $resourceId);
    }

    /**
     * Clear permission cache for this user
     */
    public function clearPermissionCache(?string $tenantId = null): void
    {
        app(PermissionService::class)->clearUserPermissionCache($this, $tenantId);
    }

    /**
     * Check if user can manage tenants
     */
    public function canManageTenants(): bool
    {
        return $this->hasPermission(Permission::MANAGE_TENANTS);
    }

    /**
     * Check if user can manage users in tenant
     */
    public function canManageUsers(?string $tenantId = null): bool
    {
        return $this->hasAnyPermission([
            Permission::MANAGE_CENTRAL_USERS,
            Permission::MANAGE_TENANT_USERS
        ], $tenantId);
    }

    /**
     * Check if user can view analytics
     */
    public function canViewAnalytics(?string $tenantId = null): bool
    {
        return $this->hasAnyPermission([
            Permission::VIEW_SYSTEM_ANALYTICS,
            Permission::VIEW_TENANT_ANALYTICS
        ], $tenantId);
    }

    /**
     * Check if user can access admin areas
     */
    public function canAccessAdmin(): bool
    {
        return $this->is_central_admin || $this->hasRole('tenant_admin');
    }

    /**
     * Check if user can access tenant admin
     */
    public function canAccessTenantAdmin(?string $tenantId = null): bool
    {
        if ($this->is_central_admin) {
            return true;
        }

        $tenantId = $tenantId ?? $this->tenant_id;
        return $this->hasRole('tenant_admin', $tenantId);
    }

    /**
     * Get user's admin level (for layout determination)
     */
    public function getAdminLevel(): string
    {
        if ($this->is_central_admin) {
            return 'central';
        }

        if ($this->hasRole('tenant_admin')) {
            return 'tenant_admin';
        }

        if ($this->tenant_id) {
            return 'tenant_user';
        }

        return 'regular';
    }

    /**
     * Determine which layout to use
     */
    public function getLayoutType(): string
    {
        $adminLevel = $this->getAdminLevel();

        switch ($adminLevel) {
            case 'central':
                return 'central_admin';
            case 'tenant_admin':
                return 'tenant_admin';
            case 'tenant_user':
                return 'tenant_user'; // All tenant users should get tenant layout with appropriate navigation
            default:
                return 'authenticated';
        }
    }

    /**
     * Get navigation items based on permissions and navigation configurations
     */
    public function getNavigationItems(): array
    {
        // For central admin, use hardcoded navigation (they don't need custom navigation)
        if ($this->is_central_admin) {
            return $this->getCentralAdminNavigation();
        }

        // For tenant users, try to get custom navigation configuration
        if ($this->tenant_id) {
            try {
                $navigationService = app(\App\Services\NavigationService::class);
                $customNavigation = $navigationService->getNavigationForUser($this);
                
                if (!empty($customNavigation['items'])) {
                    return $this->transformNavigationItems($customNavigation['items']);
                }
            } catch (\Exception $e) {
                // Log error but fall back to default navigation
                \Log::warning('Failed to get custom navigation for user ' . $this->id . ': ' . $e->getMessage());
            }
        }

        // Fallback to default navigation
        return $this->getDefaultNavigation();
    }

    /**
     * Get central admin navigation (hardcoded)
     */
    protected function getCentralAdminNavigation(): array
    {
        return [
            [
                'name' => 'Dashboard',
                'route' => 'dashboard',
                'permission' => Permission::VIEW_DASHBOARD,
                'icon' => 'HomeIcon'
            ],
            [
                'name' => 'Tenants',
                'route' => 'central-admin.tenants.index',
                'permission' => Permission::MANAGE_TENANTS,
                'icon' => 'BuildingOfficeIcon'
            ],
            [
                'name' => 'Users',
                'route' => 'central-admin.users.index',
                'permission' => Permission::MANAGE_CENTRAL_USERS,
                'icon' => 'UsersIcon'
            ],
            [
                'name' => 'Navigation Builder',
                'route' => 'central-admin.navigation.index',
                'permission' => Permission::MANAGE_SYSTEM_SETTINGS,
                'icon' => 'RectangleStackIcon'
            ],
            [
                'name' => 'Settings',
                'route' => 'central-admin.settings',
                'permission' => Permission::MANAGE_SYSTEM_SETTINGS,
                'icon' => 'CogIcon'
            ],
        ];
    }

    /**
     * Get default navigation for tenant users (fallback)
     */
    protected function getDefaultNavigation(): array
    {
        $items = [
            [
                'name' => 'Dashboard',
                'route' => 'dashboard',
                'permission' => Permission::VIEW_DASHBOARD,
                'icon' => 'HomeIcon'
            ],
        ];

        // Tenant admin items
        if ($this->canAccessTenantAdmin()) {
            $items = array_merge($items, [
                [
                    'name' => 'Manage Users',
                    'route' => 'tenant-admin.users.index',
                    'permission' => Permission::MANAGE_TENANT_USERS,
                    'icon' => 'UsersIcon'
                ],
                [
                    'name' => 'Tenant Settings',
                    'route' => 'tenant-admin.settings',
                    'permission' => Permission::MANAGE_TENANT_SETTINGS,
                    'icon' => 'CogIcon'
                ],
            ]);
        }

        // Items for all tenant users (based on permissions)
        $tenantItems = [
            [
                'name' => 'Reports',
                'route' => 'tenant.reports',
                'permission' => Permission::VIEW_REPORTS,
                'icon' => 'ChartBarIcon'
            ],
            [
                'name' => 'Content',
                'route' => 'tenant.content',
                'permission' => Permission::VIEW_TENANT_DATA,
                'icon' => 'DocumentTextIcon'
            ],
            [
                'name' => 'Analytics',
                'route' => 'tenant.analytics',
                'permission' => Permission::VIEW_TENANT_ANALYTICS,
                'icon' => 'ChartPieIcon'
            ],
            [
                'name' => 'Profile',
                'route' => 'profile.edit',
                'permission' => Permission::MANAGE_OWN_PROFILE,
                'icon' => 'UserIcon'
            ],
        ];

        $items = array_merge($items, $tenantItems);

        // Filter items based on actual permissions
        return array_filter($items, function ($item) {
            return !isset($item['permission']) || $this->hasPermission($item['permission']);
        });
    }

    /**
     * Transform navigation service items to layout format
     */
    protected function transformNavigationItems(array $items): array
    {
        $transformed = [];

        foreach ($items as $item) {
            // Skip hidden items
            if (isset($item['visible']) && $item['visible'] === false) {
                continue;
            }

            // Skip if user doesn't have permission
            if (isset($item['permission']) && !$this->hasPermission($item['permission'])) {
                continue;
            }

            $navItem = [
                'name' => $item['label'] ?? $item['name'] ?? 'Unknown',
                'route' => $item['route'] ?? '#',
                'icon' => $item['icon'] ?? 'QuestionMarkCircleIcon',
                'type' => $item['type'] ?? 'link',
            ];

            if (isset($item['permission'])) {
                $navItem['permission'] = $item['permission'];
            }

            // Process children for dropdown items
            if (isset($item['children']) && is_array($item['children']) && !empty($item['children'])) {
                $navItem['children'] = $this->transformNavigationItems($item['children']);
            } else {
                $navItem['children'] = [];
            }

            $transformed[] = $navItem;
        }

        return $transformed;
    }
} 