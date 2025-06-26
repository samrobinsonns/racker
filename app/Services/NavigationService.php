<?php

namespace App\Services;

use App\Models\NavigationConfiguration;
use App\Models\NavigationItem;
use App\Models\User;
use App\Models\Role;
use App\Services\RouteDiscoveryService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class NavigationService
{
    /**
     * Get the active navigation configuration for a user
     */
    public function getNavigationForUser(User $user): array
    {
        $cacheKey = "navigation.user.{$user->id}.tenant.{$user->tenant_id}";
        
        return Cache::remember($cacheKey, 3600, function () use ($user) {
            // Priority: User-specific > Role-specific > Default tenant
            
            // 1. Check for user-specific configuration
            $config = NavigationConfiguration::forTenant($user->tenant_id)
                ->forUser($user->id)
                ->active()
                ->first();
                
            if ($config) {
                return $this->processConfiguration($config->configuration, $user);
            }
            
            // 2. Check for role-specific configurations
            $userRoles = $user->rolesForTenant($user->tenant_id)->pluck('id');
            if ($userRoles->isNotEmpty()) {
                $config = NavigationConfiguration::forTenant($user->tenant_id)
                    ->whereIn('role_id', $userRoles)
                    ->active()
                    ->orderBy('updated_at', 'desc')
                    ->first();
                    
                if ($config) {
                    return $this->processConfiguration($config->configuration, $user);
                }
            }
            
            // 3. Check for default tenant configuration
            $config = NavigationConfiguration::forTenant($user->tenant_id)
                ->default()
                ->active()
                ->first();
                
            if ($config) {
                return $this->processConfiguration($config->configuration, $user);
            }
            
            // 4. Fallback to default navigation
            return $this->getDefaultNavigation($user);
        });
    }

    /**
     * Process configuration and filter by user permissions
     */
    public function processConfiguration(array $configuration, User $user): array
    {
        // Get user permissions (simplified for now)
        $userPermissions = $this->getUserPermissions($user);
        
        $items = $configuration['items'] ?? [];
        $filteredItems = $this->filterItemsByPermissions($items, $userPermissions);
        
        return [
            'version' => $configuration['version'] ?? '1.0',
            'layout' => $configuration['layout'] ?? 'sidebar',
            'theme' => $configuration['theme'] ?? 'emerald',
            'items' => $filteredItems,
        ];
    }

    /**
     * Get user permissions as array
     */
    protected function getUserPermissions(User $user): array
    {
        // For now, return all available permissions if central admin
        if ($user->is_central_admin) {
            return array_values((new \ReflectionClass(\App\Enums\Permission::class))->getConstants());
        }

        // Get tenant-specific permissions
        $permissions = [];
        $roles = $user->rolesForTenant($user->tenant_id)->get();
        
        foreach ($roles as $role) {
            $permissions = array_merge($permissions, $role->permissions ?? []);
        }
        
        return array_unique($permissions);
    }

    /**
     * Filter navigation items by user permissions
     */
    protected function filterItemsByPermissions(array $items, array $permissions): array
    {
        $filtered = [];
        
        foreach ($items as $item) {
            // Skip if permission required and user doesn't have it
            if (isset($item['permission']) && !in_array($item['permission'], $permissions)) {
                continue;
            }
            
            // Process children if they exist
            if (isset($item['children'])) {
                $item['children'] = $this->filterItemsByPermissions($item['children'], $permissions);
                
                // Skip parent if no children remain and it's a section
                if (empty($item['children']) && ($item['type'] ?? 'link') === 'section') {
                    continue;
                }
            }
            
            $filtered[] = $item;
        }
        
        return $filtered;
    }

    /**
     * Get default navigation for a user (fallback)
     */
    protected function getDefaultNavigation(User $user): array
    {
        $userPermissions = $this->getUserPermissions($user);
        
        // Get available navigation items
        $availableItems = NavigationItem::active()
            ->forPermissions($userPermissions)
            ->ordered()
            ->get();
        
        $navigation = [
            'version' => '1.0',
            'layout' => 'sidebar',
            'theme' => 'emerald',
            'items' => [],
        ];
        
        foreach ($availableItems as $item) {
            $navigation['items'][] = [
                'id' => $item->key,
                'type' => 'link',
                'label' => $item->label,
                'icon' => $item->icon,
                'route' => $item->route_name,
                'permission' => $item->permission_required,
                'order' => $item->sort_order,
                'visible' => true,
            ];
        }
        
        return $navigation;
    }

    /**
     * Create or update navigation configuration
     */
    public function saveConfiguration(
        string $tenantId,
        array $configuration,
        string $name,
        User $createdBy,
        ?int $userId = null,
        ?int $roleId = null
    ): NavigationConfiguration {
        
        DB::beginTransaction();
        
        try {
            // Validate configuration
            if (!$this->validateConfiguration($configuration)) {
                throw new \InvalidArgumentException('Invalid navigation configuration structure');
            }
            
            // Check for existing configuration with same name and scope
            $existingConfig = NavigationConfiguration::where('tenant_id', $tenantId)
                ->where('name', $name)
                ->where(function ($query) use ($userId, $roleId) {
                    if ($userId) {
                        $query->where('user_id', $userId);
                    } elseif ($roleId) {
                        $query->where('role_id', $roleId);
                    } else {
                        $query->whereNull('user_id')->whereNull('role_id');
                    }
                })
                ->first();
            
            if ($existingConfig) {
                // Update existing configuration
                $existingConfig->update([
                    'configuration' => $configuration,
                    'updated_by' => $createdBy->id,
                ]);
                $config = $existingConfig;
            } else {
                // Create new configuration
                $config = NavigationConfiguration::create([
                    'tenant_id' => $tenantId,
                    'user_id' => $userId,
                    'role_id' => $roleId,
                    'name' => $name,
                    'configuration' => $configuration,
                    'created_by' => $createdBy->id,
                    'updated_by' => $createdBy->id,
                    'is_active' => false, // Will be activated separately
                ]);
            }
            
            DB::commit();
            
            // Clear related caches
            $this->clearNavigationCache($tenantId, $userId, $roleId);
            
            return $config;
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Activate a navigation configuration
     */
    public function activateConfiguration(NavigationConfiguration $config): void
    {
        $config->activate();
        
        // Clear caches for affected users
        $this->clearNavigationCache($config->tenant_id, $config->user_id, $config->role_id);
    }

    /**
     * Get all available navigation items
     */
    public function getAvailableItems(bool $includeDiscovered = false): array
    {
        if ($includeDiscovered) {
            // Use RouteDiscoveryService to merge seeded + discovered items
            $routeDiscovery = app(RouteDiscoveryService::class);
            return $routeDiscovery->getMergedAvailableItems();
        }
        
        // Return only seeded items (default behavior)
        return NavigationItem::active()
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
    }

    /**
     * Get configurations for a tenant
     */
    public function getTenantConfigurations(string $tenantId): array
    {
        return NavigationConfiguration::forTenant($tenantId)
            ->with(['user', 'role', 'creator', 'updater'])
            ->orderBy('is_active', 'desc')
            ->orderBy('updated_at', 'desc')
            ->get()
            ->groupBy('type')
            ->toArray();
    }

    /**
     * Validate configuration structure
     */
    protected function validateConfiguration(array $configuration): bool
    {
        if (!isset($configuration['items']) || !is_array($configuration['items'])) {
            return false;
        }
        
        foreach ($configuration['items'] as $item) {
            if (!isset($item['id'], $item['type'], $item['label'])) {
                return false;
            }
            
            // Validate children if they exist
            if (isset($item['children']) && !$this->validateConfiguration(['items' => $item['children']])) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Clear navigation cache
     */
    protected function clearNavigationCache(string $tenantId, ?int $userId = null, ?int $roleId = null): void
    {
        if ($userId) {
            // Clear specific user cache
            Cache::forget("navigation.user.{$userId}.tenant.{$tenantId}");
        } elseif ($roleId) {
            // Clear cache for all users with this role
            $role = Role::find($roleId);
            if ($role) {
                $users = $role->users()
                    ->where('users.tenant_id', $tenantId)
                    ->wherePivot('user_roles.tenant_id', $tenantId)
                    ->get();
                foreach ($users as $user) {
                    Cache::forget("navigation.user.{$user->id}.tenant.{$tenantId}");
                }
            }
        } else {
            // Clear cache for all users in tenant
            $users = User::where('users.tenant_id', $tenantId)->get();
            foreach ($users as $user) {
                Cache::forget("navigation.user.{$user->id}.tenant.{$tenantId}");
            }
        }
    }

    /**
     * Delete a navigation configuration
     */
    public function deleteConfiguration(NavigationConfiguration $config): void
    {
        $tenantId = $config->tenant_id;
        $userId = $config->user_id;
        $roleId = $config->role_id;
        
        $config->delete();
        
        // Clear related caches
        $this->clearNavigationCache($tenantId, $userId, $roleId);
    }
} 