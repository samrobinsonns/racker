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
     * Get navigation items based on permissions
     */
    public function getNavigationItems(): array
    {
        $items = [
            [
                'name' => 'Dashboard',
                'route' => 'dashboard',
                'permission' => Permission::VIEW_DASHBOARD,
                'icon' => 'HomeIcon'
            ],
        ];

        // Add profile management
        if ($this->can(Permission::MANAGE_OWN_PROFILE)) {
            $items[] = [
                'name' => 'Profile',
                'route' => 'profile.edit',
                'permission' => Permission::MANAGE_OWN_PROFILE,
                'icon' => 'UserIcon'
            ];
        }

        // Central admin items
        if ($this->is_central_admin) {
            $items = array_merge($items, [
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
                    'name' => 'Settings',
                    'route' => 'central-admin.settings',
                    'permission' => Permission::MANAGE_SYSTEM_SETTINGS,
                    'icon' => 'CogIcon'
                ],
            ]);
        }

        // Tenant-specific items (for any tenant user)
        if ($this->tenant_id) {
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
            ];

            $items = array_merge($items, $tenantItems);
        }

                 // Filter items based on actual permissions
        return array_filter($items, function ($item) {
            return !isset($item['permission']) || $this->hasPermission($item['permission']);
        });
    }
} 