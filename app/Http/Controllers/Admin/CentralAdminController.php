<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CentralAdminController extends Controller
{
    public function dashboard()
    {
        $stats = [
            'total_tenants' => Tenant::count(),
            'total_users' => User::count(),
            'central_admins' => User::centralAdmins()->count(),
            'tenant_users' => User::tenantUsers()->count(),
            'recent_tenants' => Tenant::latest()->limit(5)->with('users')->get(),
            'recent_users' => User::latest()->limit(5)->with('tenant')->get(),
        ];

        return Inertia::render('CentralAdmin/Dashboard', [
            'stats' => $stats,
        ]);
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

        return Inertia::render('CentralAdmin/Users/Index', [
            'users' => $users,
            'stats' => $stats,
            'filters' => $request->only(['search', 'user_type', 'tenant_id', 'status']),
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

        return Inertia::render('CentralAdmin/Settings', [
            'settings' => $settings,
            'roles' => Role::withCount('users')->get(),
            'stats' => $stats,
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
            $role = Role::find($request->role_id);
            $user->assignRole($role, $request->tenant_id);
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

        // Update role if provided
        if ($request->role_id) {
            $user->roles()->detach(); // Remove existing roles
            $role = Role::find($request->role_id);
            $user->assignRole($role, $request->tenant_id);
        }

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
}
