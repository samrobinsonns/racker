<?php

namespace App\Services;

use App\Models\User;
use App\Models\Role;
use App\Enums\Permission;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PermissionService
{
    protected const CACHE_TTL = 3600; // 1 hour
    protected const CACHE_PREFIX = 'user_permissions:';

    /**
     * Check if user has specific permission
     */
    public function userHasPermission(User $user, string $permission, ?string $tenantId = null): bool
    {
        // Central admins have all permissions
        if ($user->is_central_admin) {
            return true;
        }

        $tenantId = $tenantId ?? $user->tenant_id;
        $cacheKey = $this->getCacheKey($user->id, $tenantId);
        
        $userPermissions = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user, $tenantId) {
            return $this->getUserPermissions($user, $tenantId);
        });

        return in_array($permission, $userPermissions);
    }

    /**
     * Check if user has any of the specified permissions
     */
    public function userHasAnyPermission(User $user, array $permissions, ?string $tenantId = null): bool
    {
        foreach ($permissions as $permission) {
            if ($this->userHasPermission($user, $permission, $tenantId)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if user has all specified permissions
     */
    public function userHasAllPermissions(User $user, array $permissions, ?string $tenantId = null): bool
    {
        foreach ($permissions as $permission) {
            if (!$this->userHasPermission($user, $permission, $tenantId)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get all permissions for a user
     */
    public function getUserPermissions(User $user, ?string $tenantId = null): array
    {
        if ($user->is_central_admin) {
            return Permission::getAllPermissions();
        }

        $tenantId = $tenantId ?? $user->tenant_id;
        $roles = $user->rolesForTenant($tenantId)->get();
        
        $permissions = [];
        foreach ($roles as $role) {
            $rolePermissions = $role->permissions ?? [];
            $permissions = array_merge($permissions, $rolePermissions);
        }

        // Add permission dependencies
        $permissions = $this->expandPermissions($permissions);

        return array_unique($permissions);
    }

    /**
     * Expand permissions to include dependencies
     */
    protected function expandPermissions(array $permissions): array
    {
        $dependencies = Permission::getPermissionDependencies();
        $expandedPermissions = $permissions;

        foreach ($permissions as $permission) {
            if (isset($dependencies[$permission])) {
                $expandedPermissions = array_merge($expandedPermissions, $dependencies[$permission]);
            }
        }

        return array_unique($expandedPermissions);
    }

    /**
     * Clear user permission cache
     */
    public function clearUserPermissionCache(User $user, ?string $tenantId = null): void
    {
        $tenantId = $tenantId ?? $user->tenant_id;
        $cacheKey = $this->getCacheKey($user->id, $tenantId);
        Cache::forget($cacheKey);
    }

    /**
     * Clear all permission cache for a tenant
     */
    public function clearTenantPermissionCache(string $tenantId): void
    {
        // This is a simplified approach - in production you might want to use cache tags
        $users = User::where('tenant_id', $tenantId)->pluck('id');
        foreach ($users as $userId) {
            Cache::forget($this->getCacheKey($userId, $tenantId));
        }
    }

    /**
     * Validate permission assignments against dependencies
     */
    public function validatePermissionAssignment(array $permissions): array
    {
        $dependencies = Permission::getPermissionDependencies();
        $missing = [];

        foreach ($permissions as $permission) {
            if (isset($dependencies[$permission])) {
                foreach ($dependencies[$permission] as $requiredPermission) {
                    if (!in_array($requiredPermission, $permissions)) {
                        $missing[] = $requiredPermission;
                    }
                }
            }
        }

        return array_unique($missing);
    }

    /**
     * Get permission cache key
     */
    protected function getCacheKey(int $userId, ?string $tenantId): string
    {
        return self::CACHE_PREFIX . $userId . ':' . ($tenantId ?? 'global');
    }

    /**
     * Check resource-specific permission
     */
    public function userCanAccessResource(User $user, string $resourceType, string $action, $resourceId = null): bool
    {
        $permission = $resourceType . '_' . $action;
        
        // Check basic permission first
        if (!$this->userHasPermission($user, $permission)) {
            return false;
        }

        // Add resource-specific checks here if needed
        // For example, check if user owns the resource for 'edit_own_content'
        if ($permission === Permission::EDIT_OWN_CONTENT && $resourceId) {
            return $this->userOwnsResource($user, $resourceType, $resourceId);
        }

        return true;
    }

    /**
     * Check if user owns a specific resource
     */
    protected function userOwnsResource(User $user, string $resourceType, $resourceId): bool
    {
        // Implement resource ownership logic based on resource type
        // This is a placeholder - implement based on your models
        return true;
    }

    /**
     * Log permission check for auditing
     */
    public function logPermissionCheck(User $user, string $permission, bool $granted, ?string $tenantId = null): void
    {
        Log::info('Permission check', [
            'user_id' => $user->id,
            'permission' => $permission,
            'granted' => $granted,
            'tenant_id' => $tenantId,
            'timestamp' => now()
        ]);
    }

    /**
     * Get permission usage statistics
     */
    public function getPermissionStats(?string $tenantId = null): array
    {
        // This could be implemented to track permission usage
        // For now, return basic stats
        return [
            'total_permissions' => count(Permission::getAllPermissions()),
            'active_users' => User::when($tenantId, function ($query) use ($tenantId) {
                return $query->where('tenant_id', $tenantId);
            })->count(),
        ];
    }
} 