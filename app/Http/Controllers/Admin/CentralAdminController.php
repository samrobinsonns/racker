<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Role;
use App\Enums\Permission;
use App\Services\PermissionService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CentralAdminController extends Controller
{
    public function dashboard()
    {
        $stats = $this->getDashboardStats();

        return Inertia::render('CentralAdmin/Dashboard', [
            'stats' => $stats,
        ]);
    }

    public function getDashboardStats()
    {
        return [
            'total_tenants' => Tenant::count(),
            'total_users' => User::count(),
            'central_admins' => User::centralAdmins()->count(),
            'tenant_users' => User::tenantUsers()->count(),
            'recent_tenants' => Tenant::latest()->limit(5)->with('users')->get(),
            'recent_users' => User::latest()->limit(5)->with('tenant')->get(),
        ];
    }

    public function tenants()
    {
        $tenants = Tenant::with(['users', 'domains'])
            ->withCount('users')
            ->paginate(15);

        return Inertia::render('CentralAdmin/Tenants/Index', [
            'tenants' => $tenants,
        ]);
    }

    public function users(Request $request)
    {
        $query = User::with(['tenant', 'roles']);

        // Search functionality
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('email', 'like', "%{$searchTerm}%");
            });
        }

        // Filter by user type
        if ($request->filled('user_type')) {
            if ($request->user_type === 'central_admin') {
                $query->where('is_central_admin', true);
            } elseif ($request->user_type === 'tenant_user') {
                $query->where('is_central_admin', false);
            }
        }

        // Filter by tenant
        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->whereNotNull('email_verified_at');
            } elseif ($request->status === 'inactive') {
                $query->whereNull('email_verified_at');
            }
        }

        $users = $query->latest()->paginate(15)->withQueryString();

        $stats = [
            'total_users' => User::count(),
            'central_admins' => User::centralAdmins()->count(),
            'tenant_users' => User::tenantUsers()->count(),
            'active_users' => User::whereNotNull('email_verified_at')->count(),
            'tenants' => Tenant::all(),
        ];

        // Get organized roles for better UX
        $allRoles = Role::with('tenant')->get();
        
        return Inertia::render('CentralAdmin/Users/Index', [
            'users' => $users,
            'stats' => $stats,
            'filters' => $request->only(['search', 'user_type', 'tenant_id', 'status']),
            'roles' => $allRoles,
        ]);
    }

    public function settings()
    {
        $settings = [
            'app_name' => config('app.name'),
            'app_url' => config('app.url'),
            'admin_email' => 'admin@racker.com',
            'tenant_creation_enabled' => true,
            'user_registration_enabled' => true,
            'email_verification_required' => true,
            'max_tenants_per_admin' => 0,
            'default_tenant_storage_limit' => 1024,
            'maintenance_mode' => false,
        ];

        $stats = [
            'total_tenants' => Tenant::count(),
            'total_users' => User::count(),
        ];

        // Transform permissions to match frontend expectations
        $groupedPermissions = Permission::getGroupedPermissions();
        $formattedPermissions = [];
        
        foreach ($groupedPermissions as $category => $permissions) {
            $formattedPermissions[$category] = [];
            foreach ($permissions as $key => $data) {
                $formattedPermissions[$category][] = [
                    'key' => $key,
                    'label' => $data['label'],
                    'description' => $data['description']
                ];
            }
        }

        return Inertia::render('CentralAdmin/Settings', [
            'settings' => $settings,
            'roles' => Role::with('tenant')->withCount('users')->get(),
            'stats' => $stats,
            'permissions' => $formattedPermissions,
            'tenants' => Tenant::get(['id', 'data']),
        ]);
    }

    public function updateSettings(Request $request)
    {
        $request->validate([
            'app_name' => 'required|string|max:255',
            'app_url' => 'required|url',
            'admin_email' => 'required|email',
            'tenant_creation_enabled' => 'boolean',
            'user_registration_enabled' => 'boolean',
            'email_verification_required' => 'boolean',
            'max_tenants_per_admin' => 'integer|min:0',
            'default_tenant_storage_limit' => 'integer|min:1',
            'maintenance_mode' => 'boolean',
        ]);

        // Here you would typically save to a settings table or config files
        // For now, we'll just redirect back with success message
        
        return redirect()->back()->with('success', 'Settings updated successfully.');
    }

    public function createUser()
    {
        $tenants = Tenant::all();
        $roles = Role::all();

        return Inertia::render('CentralAdmin/Users/Create', [
            'tenants' => $tenants,
            'roles' => $roles,
        ]);
    }

    public function storeUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'tenant_id' => 'nullable|exists:tenants,id',
            'is_central_admin' => 'boolean',
            'role_id' => 'nullable|exists:roles,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'tenant_id' => $request->tenant_id,
            'is_central_admin' => $request->boolean('is_central_admin'),
            'email_verified_at' => now(), // Auto-verify admin created users
        ]);

        if ($request->role_id) {
            $user->assignRole($request->role_id, $request->tenant_id);
        }

        return redirect()->route('central-admin.users.index')
            ->with('success', 'User created successfully.');
    }

    public function editUser(User $user)
    {
        $tenants = Tenant::all();
        $roles = Role::all();

        return Inertia::render('CentralAdmin/Users/Edit', [
            'user' => $user->load(['tenant', 'roles']),
            'tenants' => $tenants,
            'roles' => $roles,
        ]);
    }

    public function updateUser(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'tenant_id' => 'nullable|exists:tenants,id',
            'is_central_admin' => 'boolean',
            'role_id' => 'nullable|exists:roles,id',
        ]);

        // Additional validation for role assignment
        if ($request->role_id) {
            $role = Role::find($request->role_id);
            
            // Validate role assignment logic
            if ($role) {
                if ($role->type === 'central' && $request->tenant_id) {
                    return redirect()->back()
                        ->withErrors(['role_id' => 'Central admin roles cannot be assigned to tenant users.'])
                        ->withInput();
                }
                
                if ($role->type === 'tenant' && $role->tenant_id && $role->tenant_id !== $request->tenant_id) {
                    return redirect()->back()
                        ->withErrors(['role_id' => 'This role belongs to a different tenant.'])
                        ->withInput();
                }
            }
        }

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'tenant_id' => $request->tenant_id,
            'is_central_admin' => $request->boolean('is_central_admin'),
        ];

        if ($request->filled('password')) {
            $updateData['password'] = bcrypt($request->password);
        }

        $user->update($updateData);

        // Clear existing roles
        $user->roles()->detach();
        
        // Assign new role if provided
        if ($request->role_id) {
            $role = Role::find($request->role_id);
            
            if ($role) {
                if ($role->type === 'central') {
                    // Central roles are assigned with null tenant_id
                    $user->assignRole($request->role_id, null);
                } elseif ($role->type === 'tenant') {
                    if (!$role->tenant_id) {
                        // This is a template role, create tenant-specific instance if needed
                        if ($request->tenant_id) {
                            $tenantRole = Role::firstOrCreate([
                                'name' => $role->name,
                                'tenant_id' => $request->tenant_id,
                                'type' => 'tenant'
                            ], [
                                'display_name' => $role->display_name,
                                'description' => $role->description,
                                'permissions' => $role->permissions,
                            ]);
                            $user->assignRole($tenantRole->id, $request->tenant_id);
                        }
                    } else {
                        // This is already a tenant-specific role
                        $user->assignRole($request->role_id, $role->tenant_id);
                    }
                }
            }
        }

        // Clear permission cache for this user
        $permissionService = app(PermissionService::class);
        $permissionService->clearUserPermissionCache($user, $user->tenant_id);

        return redirect()->route('central-admin.users.index')
            ->with('success', 'User updated successfully.');
    }

    public function destroyUser(User $user)
    {
        if ($user->is_central_admin && User::centralAdmins()->count() <= 1) {
            return redirect()->back()
                ->with('error', 'Cannot delete the last central admin.');
        }

        $user->delete();

        return redirect()->route('central-admin.users.index')
            ->with('success', 'User deleted successfully.');
    }

    // Role Management Methods
    public function storeRole(Request $request)
    {
        $tenantId = $request->type === 'central' ? null : $request->tenant_id;
        
        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                \Illuminate\Validation\Rule::unique('roles')->where(function ($query) use ($tenantId) {
                    return $query->where('tenant_id', $tenantId);
                })
            ],
            'display_name' => 'required|string|max:255',
            'description' => 'required|string|max:500',
            'type' => 'required|in:central,tenant',
            'tenant_id' => 'nullable|exists:tenants,id',
            'permissions' => 'array',
            'permissions.*' => 'string',
        ]);

        // Validate tenant assignment
        if ($request->type === 'central' && $request->tenant_id) {
            return redirect()->back()
                ->withErrors(['tenant_id' => 'Central roles cannot be assigned to specific tenants.'])
                ->withInput();
        }

        $role = Role::create([
            'name' => $request->name,
            'display_name' => $request->display_name,
            'description' => $request->description,
            'type' => $request->type,
            'tenant_id' => $tenantId,
            'permissions' => $request->permissions ?? [],
        ]);

        return redirect()->route('central-admin.settings')
            ->with('success', 'Role created successfully.');
    }

    public function updateRole(Request $request, Role $role)
    {
        $tenantId = $request->type === 'central' ? null : $request->tenant_id;
        
        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                \Illuminate\Validation\Rule::unique('roles')->ignore($role->id)->where(function ($query) use ($tenantId) {
                    return $query->where('tenant_id', $tenantId);
                })
            ],
            'display_name' => 'required|string|max:255',
            'description' => 'required|string|max:500',
            'type' => 'required|in:central,tenant',
            'tenant_id' => 'nullable|exists:tenants,id',
            'permissions' => 'array',
            'permissions.*' => 'string',
        ]);

        // Validate tenant assignment
        if ($request->type === 'central' && $request->tenant_id) {
            return redirect()->back()
                ->withErrors(['tenant_id' => 'Central roles cannot be assigned to specific tenants.'])
                ->withInput();
        }

        $role->update([
            'name' => $request->name,
            'display_name' => $request->display_name,
            'description' => $request->description,
            'type' => $request->type,
            'tenant_id' => $tenantId,
            'permissions' => $request->permissions ?? [],
        ]);

        // Clear permission cache for all users with this role
        $permissionService = app(\App\Services\PermissionService::class);
        foreach ($role->users as $user) {
            $permissionService->clearUserPermissionCache($user, $user->tenant_id);
        }

        return redirect()->route('central-admin.settings')
            ->with('success', 'Role updated successfully.');
    }

    public function destroyRole(Role $role)
    {
        // Prevent deletion of core system roles
        if (in_array($role->name, ['central_admin', 'tenant_admin'])) {
            return redirect()->back()
                ->with('error', 'Cannot delete core system roles.');
        }

        // Check if role is assigned to any users
        if ($role->users()->count() > 0) {
            return redirect()->back()
                ->with('error', 'Cannot delete role that is assigned to users. Please reassign users first.');
        }

        $role->delete();

        return redirect()->route('central-admin.settings')
            ->with('success', 'Role deleted successfully.');
    }

    // Permission Management Methods
    public function storePermission(Request $request)
    {
        $request->validate([
            'key' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9_]+$/', // Only lowercase, numbers, and underscores
                'unique:custom_permissions,key'
            ],
            'label' => 'required|string|max:255',
            'description' => 'required|string|max:500',
            'category' => 'required|string|max:255',
        ]);

        // Check if permission key conflicts with existing enum permissions
        $existingPermissions = \App\Enums\Permission::getAllPermissions();
        if (in_array($request->key, $existingPermissions)) {
            return redirect()->back()
                ->withErrors(['key' => 'This permission key conflicts with an existing system permission.'])
                ->withInput();
        }

        \App\Models\CustomPermission::create([
            'key' => $request->key,
            'label' => $request->label,
            'description' => $request->description,
            'category' => $request->category,
            'created_by_user_id' => auth()->id(),
        ]);

        return redirect()->route('central-admin.settings')
            ->with('success', 'Custom permission created successfully.');
    }
}
