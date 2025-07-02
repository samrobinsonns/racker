<?php

namespace App\Http\Controllers\TenantAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    public function index()
    {
        $tenant = tenant();
        
        // Debug: Check what tenant() returns
        Log::info('Tenant debug:', [
            'tenant' => $tenant ? $tenant->toArray() : null,
            'tenant_id' => $tenant ? $tenant->id : null,
            'tenant_name' => $tenant ? $tenant->name : null,
        ]);
        
        // Get all roles first
        $allRoles = Role::with('tenant')->withCount('users')->get();
        
        // Debug: Check all roles
        Log::info('All roles loaded:', [
            'total_roles' => $allRoles->count(),
            'roles' => $allRoles->map(function($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'type' => $role->type,
                    'tenant_id' => $role->tenant_id,
                    'display_name' => $role->display_name,
                ];
            })->toArray()
        ]);
        
        // Filter roles for this tenant
        $roles = $allRoles->filter(function($role) use ($tenant) {
            // Include tenant-specific roles for this tenant
            if ($role->tenant_id === $tenant->id) {
                Log::info("Including tenant-specific role: {$role->name}");
                return true;
            }
            // Include template roles (type = 'tenant' and tenant_id = null)
            if ($role->type === 'tenant' && $role->tenant_id === null) {
                Log::info("Including template role: {$role->name}");
                return true;
            }
            Log::info("Excluding role: {$role->name} (type: {$role->type}, tenant_id: {$role->tenant_id})");
            return false;
        })->values();

        // Debug log to check roles
        Log::info('Tenant roles loaded:', [
            'tenant_id' => $tenant->id,
            'roles_count' => $roles->count(),
            'roles' => $roles->toArray()
        ]);

        return Inertia::render('TenantAdmin/Users/Index', [
            'users' => User::with('roles.permissions')
                ->where('tenant_id', $tenant->id)
                ->paginate(10),
            'availableRoles' => $roles,
            'roles' => $roles,
            'stats' => [
                'total_users' => User::where('tenant_id', $tenant->id)->count(),
                'active_users' => User::where('tenant_id', $tenant->id)
                    ->whereNotNull('email_verified_at')
                    ->count(),
                'total_roles' => $roles->count(),
                'tenant_id' => $tenant->id,
                'tenant_name' => $tenant->name ?? 'Unknown Tenant',
            ],
            'tenantId' => $tenant->id,
            'permissions' => $this->getAvailablePermissions(),
        ]);
    }

    private function getAvailablePermissions()
    {
        return [
            'User Management' => [
                ['key' => 'manage_tenant_users', 'label' => 'Manage Tenant Users', 'description' => 'Manage users within tenants'],
                ['key' => 'invite_users', 'label' => 'Invite Users', 'description' => 'Send user invitations'],
                ['key' => 'view_user_profiles', 'label' => 'View User Profiles', 'description' => 'Access user profile information'],
                ['key' => 'reset_user_passwords', 'label' => 'Reset User Passwords', 'description' => 'Reset passwords for other users'],
                ['key' => 'deactivate_users', 'label' => 'Deactivate Users', 'description' => 'Suspend or deactivate user accounts'],
                ['key' => 'manage_user_roles', 'label' => 'Manage User Roles', 'description' => 'Assign and remove user roles'],
            ],
            'Tenant Operations' => [
                ['key' => 'manage_tenant_settings', 'label' => 'Manage Tenant Settings', 'description' => 'Configure tenant settings'],
                ['key' => 'manage_tenant_roles', 'label' => 'Manage Tenant Roles', 'description' => 'Manage roles within tenant'],
                ['key' => 'view_tenant_analytics', 'label' => 'View Tenant Analytics', 'description' => 'Access tenant analytics'],
                ['key' => 'view_tenant_data', 'label' => 'View Tenant Data', 'description' => 'Access tenant information'],
                ['key' => 'export_tenant_data', 'label' => 'Export Tenant Data', 'description' => 'Export tenant data'],
                ['key' => 'manage_tenant_billing', 'label' => 'Manage Tenant Billing', 'description' => 'Access billing and subscription settings'],
            ],
            'Content Management' => [
                ['key' => 'view_dashboard', 'label' => 'View Dashboard', 'description' => 'Access dashboard interface'],
                ['key' => 'manage_own_profile', 'label' => 'Manage Own Profile', 'description' => 'Edit personal profile'],
                ['key' => 'create_content', 'label' => 'Create Content', 'description' => 'Create new content'],
                ['key' => 'edit_content', 'label' => 'Edit Content', 'description' => 'Edit existing content'],
                ['key' => 'edit_own_content', 'label' => 'Edit Own Content', 'description' => 'Edit only own content'],
                ['key' => 'delete_content', 'label' => 'Delete Content', 'description' => 'Remove content'],
                ['key' => 'publish_content', 'label' => 'Publish Content', 'description' => 'Publish and unpublish content'],
                ['key' => 'moderate_content', 'label' => 'Moderate Content', 'description' => 'Review and moderate user content'],
                ['key' => 'view_reports', 'label' => 'View Reports', 'description' => 'Access reporting features'],
                ['key' => 'manage_categories', 'label' => 'Manage Categories', 'description' => 'Create and manage content categories'],
            ],
        ];
    }
} 