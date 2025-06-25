<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\NavigationConfiguration;
use App\Models\Tenant;
use App\Models\Role;
use App\Models\User;
use App\Services\NavigationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NavigationController extends Controller
{
    protected NavigationService $navigationService;

    public function __construct(NavigationService $navigationService)
    {
        $this->navigationService = $navigationService;
    }

    /**
     * Display the navigation builder index
     */
    public function index()
    {
        $tenants = Tenant::with(['users' => function ($query) {
            $query->select('id', 'name', 'email', 'tenant_id');
        }])->get();

        return Inertia::render('CentralAdmin/Navigation/Index', [
            'tenants' => $tenants,
        ]);
    }

    /**
     * Show the navigation builder for a specific tenant
     */
    public function builder(Request $request)
    {
        $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
        ]);

        $tenant = Tenant::with(['users', 'roles'])->findOrFail($request->tenant_id);
        
        // Get existing configurations for this tenant
        $configurations = $this->navigationService->getTenantConfigurations($request->tenant_id);
        
        // Get available navigation items
        $availableItems = $this->navigationService->getAvailableItems();

        return Inertia::render('CentralAdmin/Navigation/Builder', [
            'tenant' => $tenant,
            'configurations' => $configurations,
            'availableItems' => $availableItems,
            'users' => $tenant->users,
            'roles' => $tenant->roles,
        ]);
    }

    /**
     * Get configuration details
     */
    public function show(NavigationConfiguration $configuration)
    {
        $configuration->load(['tenant', 'user', 'role', 'creator', 'updater']);
        
        return response()->json([
            'configuration' => $configuration,
        ]);
    }

    /**
     * Store a new navigation configuration
     */
    public function store(Request $request)
    {
        $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'name' => 'required|string|max:255',
            'configuration' => 'required|array',
            'configuration.items' => 'required|array',
            'user_id' => 'nullable|exists:users,id',
            'role_id' => 'nullable|exists:roles,id',
            'activate' => 'boolean',
        ]);

        try {
            $configuration = $this->navigationService->saveConfiguration(
                $request->tenant_id,
                $request->configuration,
                $request->name,
                auth()->user(),
                $request->user_id,
                $request->role_id
            );

            if ($request->boolean('activate')) {
                $this->navigationService->activateConfiguration($configuration);
            }

            return response()->json([
                'success' => true,
                'message' => 'Navigation configuration saved successfully!',
                'configuration' => $configuration->fresh(['tenant', 'user', 'role']),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save navigation configuration: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Update an existing navigation configuration
     */
    public function update(Request $request, NavigationConfiguration $configuration)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'configuration' => 'required|array',
            'configuration.items' => 'required|array',
            'activate' => 'boolean',
        ]);

        try {
            $configuration->update([
                'name' => $request->name,
                'configuration' => $request->configuration,
                'updated_by' => auth()->id(),
            ]);

            if ($request->boolean('activate')) {
                $this->navigationService->activateConfiguration($configuration);
            }

            // Clear navigation cache
            $this->navigationService->activateConfiguration($configuration);

            return response()->json([
                'success' => true,
                'message' => 'Navigation configuration updated successfully!',
                'configuration' => $configuration->fresh(['tenant', 'user', 'role']),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update navigation configuration: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Activate a navigation configuration
     */
    public function activate(NavigationConfiguration $configuration)
    {
        try {
            $this->navigationService->activateConfiguration($configuration);

            return response()->json([
                'success' => true,
                'message' => 'Navigation configuration activated successfully!',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to activate configuration: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Delete a navigation configuration
     */
    public function destroy(NavigationConfiguration $configuration)
    {
        try {
            $this->navigationService->deleteConfiguration($configuration);

            return response()->json([
                'success' => true,
                'message' => 'Navigation configuration deleted successfully!',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete configuration: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Preview a navigation configuration
     */
    public function preview(Request $request)
    {
        $request->validate([
            'configuration' => 'required|array',
            'user_id' => 'required|exists:users,id',
        ]);

        $user = \App\Models\User::findOrFail($request->user_id);
        
        // Simulate processing the configuration
        $processedConfig = $this->navigationService->processConfiguration(
            $request->configuration, 
            $user
        );

        return response()->json([
            'preview' => $processedConfig,
        ]);
    }

    /**
     * Duplicate a navigation configuration
     */
    public function duplicate(Request $request, NavigationConfiguration $configuration)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'user_id' => 'nullable|exists:users,id',
            'role_id' => 'nullable|exists:roles,id',
        ]);

        try {
            $newConfiguration = $this->navigationService->saveConfiguration(
                $configuration->tenant_id,
                $configuration->configuration,
                $request->name,
                auth()->user(),
                $request->user_id,
                $request->role_id
            );

            return response()->json([
                'success' => true,
                'message' => 'Navigation configuration duplicated successfully!',
                'configuration' => $newConfiguration->fresh(['tenant', 'user', 'role']),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to duplicate configuration: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get current navigation for a specific target (user, role, or default)
     */
    public function getCurrent(Request $request)
    {
        $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'type' => 'required|in:default,role,user',
            'target_id' => 'nullable|integer',
        ]);

        try {
            $tenantId = $request->tenant_id;
            $type = $request->type;
            $targetId = $request->target_id;

            // Get a sample user for testing
            $sampleUser = null;
            $debugInfo = ['type' => $type, 'target_id' => $targetId, 'tenant_id' => $tenantId];
            
            if ($type === 'user' && $targetId) {
                $sampleUser = User::where('users.id', $targetId)
                    ->where('users.tenant_id', $tenantId)
                    ->first();
                
                if (!$sampleUser) {
                    return response()->json([
                        'success' => false,
                        'message' => "User with ID {$targetId} not found in tenant {$tenantId}",
                        'debug' => $debugInfo
                    ], 400);
                }
            } elseif ($type === 'role' && $targetId) {
                // Get any user with this role for testing
                $role = Role::where('id', $targetId)
                    ->where('tenant_id', $tenantId)
                    ->first();
                
                if (!$role) {
                    return response()->json([
                        'success' => false,
                        'message' => "Role with ID {$targetId} not found in tenant {$tenantId}",
                        'debug' => $debugInfo
                    ], 400);
                }
                
                $sampleUser = User::where('users.tenant_id', $tenantId)
                    ->whereHas('roles', function ($query) use ($targetId, $tenantId) {
                        $query->where('roles.id', $targetId)
                              ->where('user_roles.tenant_id', $tenantId);
                    })
                    ->first();
                
                if (!$sampleUser) {
                    return response()->json([
                        'success' => false,
                        'message' => "No users found with role '{$role->name}' in tenant {$tenantId}",
                        'debug' => $debugInfo
                    ], 400);
                }
            } else {
                // For default, get any user from the tenant
                $sampleUser = User::where('users.tenant_id', $tenantId)->first();
                
                if (!$sampleUser) {
                    return response()->json([
                        'success' => false,
                        'message' => "No users found in tenant {$tenantId}",
                        'debug' => $debugInfo
                    ], 400);
                }
            }

            // Get the current navigation for this user
            $currentNavigation = $this->navigationService->getNavigationForUser($sampleUser);

            return response()->json([
                'success' => true,
                'navigation' => $currentNavigation,
                'message' => "Current navigation retrieved successfully for {$type}" . 
                           ($targetId ? " (ID: {$targetId})" : ''),
                'debug' => [
                    'sample_user' => [
                        'id' => $sampleUser->id,
                        'name' => $sampleUser->name,
                        'tenant_id' => $sampleUser->tenant_id
                    ],
                    'navigation_items_count' => count($currentNavigation['items'] ?? [])
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Navigation getCurrent error: ' . $e->getMessage(), [
                'request' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to get current navigation: ' . $e->getMessage(),
                'debug' => $debugInfo ?? []
            ], 500);
        }
    }
} 