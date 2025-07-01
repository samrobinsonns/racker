<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class TenantAdminController extends Controller
{
    public function dashboard()
    {
        $user = auth()->user();
        $tenantId = $user->is_central_admin ? request()->get('tenant_id', null) : $user->tenant_id;

        if (!$tenantId) {
            abort(400, 'No tenant context available.');
        }

        $stats = $this->getDashboardStats($tenantId);
        $availableRoles = Role::forTenant($tenantId)->get();

        return Inertia::render('TenantAdmin/Dashboard', [
            'stats' => $stats,
            'availableRoles' => $availableRoles,
        ]);
    }

    public function getDashboardStats($tenantId = null)
    {
        $user = auth()->user();
        $tenantId = $tenantId ?? ($user->is_central_admin ? request('tenant_id') : $user->tenant_id);

        if (!$tenantId) {
            return [
                'tenant_name' => 'Unknown Tenant',
                'total_users' => 0,
                'active_users' => 0,
                'user_growth' => [
                    'this_month' => 0,
                    'growth_percentage' => 0,
                    'trend' => 'neutral'
                ],
                'role_distribution' => [],
                'recent_activity' => []
            ];
        }

        return [
            'total_users' => User::tenantUsers($tenantId)->count(),
            'active_users' => User::tenantUsers($tenantId)->whereNotNull('email_verified_at')->count(),
            'recent_users' => User::tenantUsers($tenantId)->latest()->limit(5)->with('roles')->get(),
            'tenant_name' => optional($user->tenant)->name ?? 'Unknown Tenant',
            'recent_activity' => $this->getRecentActivity($tenantId),
            'user_growth' => $this->getUserGrowthStats($tenantId),
            'role_distribution' => $this->getRoleDistribution($tenantId),
            'tenant_id' => $tenantId,
        ];
    }

    /**
     * Get recent activity for the dashboard
     */
    private function getRecentActivity($tenantId)
    {
        $activities = [];

        // Recent user registrations
        $recentUsers = User::tenantUsers($tenantId)
            ->whereDate('created_at', '>=', now()->subDays(7))
            ->latest()
            ->limit(10)
            ->get();

        foreach ($recentUsers as $user) {
            $activities[] = [
                'type' => 'user_created',
                'description' => "New user {$user->name} joined",
                'user' => $user->name,
                'date' => $user->created_at,
                'icon' => 'user-plus',
                'color' => 'green',
            ];
        }

        // Recent email verifications
        $recentVerifications = User::tenantUsers($tenantId)
            ->whereNotNull('email_verified_at')
            ->whereDate('email_verified_at', '>=', now()->subDays(7))
            ->latest('email_verified_at')
            ->limit(5)
            ->get();

        foreach ($recentVerifications as $user) {
            $activities[] = [
                'type' => 'email_verified',
                'description' => "{$user->name} verified their email",
                'user' => $user->name,
                'date' => $user->email_verified_at,
                'icon' => 'check-circle',
                'color' => 'blue',
            ];
        }

        // Sort by date and limit
        $activities = collect($activities)
            ->sortByDesc('date')
            ->take(15)
            ->values()
            ->all();

        return $activities;
    }

    /**
     * Get user growth statistics
     */
    private function getUserGrowthStats($tenantId)
    {
        $thisMonth = User::tenantUsers($tenantId)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $lastMonth = User::tenantUsers($tenantId)
            ->whereMonth('created_at', now()->subMonth()->month)
            ->whereYear('created_at', now()->subMonth()->year)
            ->count();

        $growth = $lastMonth > 0 ? (($thisMonth - $lastMonth) / $lastMonth) * 100 : 0;

        return [
            'this_month' => $thisMonth,
            'last_month' => $lastMonth,
            'growth_percentage' => round($growth, 1),
            'trend' => $growth > 0 ? 'up' : ($growth < 0 ? 'down' : 'stable'),
        ];
    }

    /**
     * Get role distribution for the tenant
     */
    private function getRoleDistribution($tenantId)
    {
        $roles = Role::forTenant($tenantId)->withCount(['users' => function ($query) use ($tenantId) {
            $query->where('user_roles.tenant_id', $tenantId);
        }])->get();
        
        return $roles->map(function ($role) {
            return [
                'name' => $role->display_name,
                'count' => $role->users_count,
                'color' => $this->getRoleColor($role->name),
            ];
        });
    }

    /**
     * Get color for role badges
     */
    private function getRoleColor($roleName)
    {
        $colors = [
            'tenant_admin' => 'emerald',
            'tenant_manager' => 'blue',
            'tenant_user' => 'gray',
        ];

        return $colors[$roleName] ?? 'purple';
    }

    public function users()
    {
        $user = auth()->user();
        $tenantId = $user->is_central_admin ? request('tenant_id') : $user->tenant_id;

        if (!$tenantId) {
            abort(400, 'No tenant context available.');
        }

        $users = User::tenantUsers($tenantId)
            ->with(['roles' => function($query) use ($tenantId) {
                $query->where('user_roles.tenant_id', $tenantId);
            }])
            ->select(['id', 'name', 'email', 'email_verified_at', 'created_at', 'avatar_url'])
            ->latest()
            ->paginate(15);

        $availableRoles = Role::forTenant($tenantId)->get();

        return Inertia::render('TenantAdmin/Users/Index', [
            'users' => $users,
            'availableRoles' => $availableRoles,
            'tenantId' => $tenantId,
            'stats' => [
                'tenant_name' => optional($user->tenant)->name ?? 'Unknown Tenant',
                'tenant_id' => $tenantId,
            ],
        ]);
    }

    public function createUser()
    {
        $user = auth()->user();
        $tenantId = $user->is_central_admin ? request('tenant_id') : $user->tenant_id;

        if (!$tenantId) {
            abort(400, 'No tenant context available.');
        }

        $availableRoles = Role::forTenant($tenantId)->get();

        return Inertia::render('TenantAdmin/Users/Create', [
            'availableRoles' => $availableRoles,
            'tenantId' => $tenantId,
            'stats' => [
                'tenant_name' => optional($user->tenant)->name ?? 'Unknown Tenant',
                'tenant_id' => $tenantId,
            ],
        ]);
    }

    public function storeUser(Request $request)
    {
        $user = auth()->user();
        $tenantId = $user->is_central_admin ? $request->tenant_id : $user->tenant_id;

        if (!$tenantId) {
            abort(400, 'No tenant context available.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'role_id' => 'required|exists:roles,id',
        ]);

        // Verify the role belongs to this tenant
        $role = Role::where('id', $request->role_id)
            ->where('tenant_id', $tenantId)
            ->first();

        if (!$role) {
            abort(403, 'Invalid role for this tenant.');
        }

        $newUser = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make('password'), // Should send email to set password
            'tenant_id' => $tenantId,
            'is_central_admin' => false,
        ]);

        $newUser->assignRole($role->id, $tenantId);

        return redirect()->route('tenant-admin.users.index', ['tenant_id' => $tenantId])
            ->with('success', 'User created successfully!');
    }

    public function updateUser(Request $request, User $user)
    {
        $currentUser = auth()->user();
        $tenantId = $currentUser->is_central_admin ? $request->tenant_id : $currentUser->tenant_id;

        // Ensure user belongs to the current tenant context
        if ($user->tenant_id !== $tenantId) {
            abort(403, 'User does not belong to this tenant.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'role_id' => 'required|exists:roles,id',
        ]);

        // Verify the role belongs to this tenant
        $role = Role::where('id', $request->role_id)
            ->where('tenant_id', $tenantId)
            ->first();

        if (!$role) {
            abort(403, 'Invalid role for this tenant.');
        }

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        // Update role assignment
        $user->roles()->wherePivot('tenant_id', $tenantId)->detach();
        $user->assignRole($role->id, $tenantId);

        return redirect()->route('tenant-admin.users.index', ['tenant_id' => $tenantId])
            ->with('success', 'User updated successfully!');
    }

    public function destroyUser(User $user)
    {
        $currentUser = auth()->user();
        $tenantId = $currentUser->is_central_admin ? request('tenant_id') : $currentUser->tenant_id;

        // Ensure user belongs to the current tenant context
        if ($user->tenant_id !== $tenantId) {
            abort(403, 'User does not belong to this tenant.');
        }

        // Prevent deleting yourself
        if ($user->id === $currentUser->id) {
            abort(403, 'You cannot delete your own account.');
        }

        $user->delete();

        return redirect()->route('tenant-admin.users.index', ['tenant_id' => $tenantId])
            ->with('success', 'User deleted successfully!');
    }

    public function settings()
    {
        $user = auth()->user();
        $tenantId = $user->is_central_admin ? request('tenant_id') : $user->tenant_id;

        if (!$tenantId) {
            abort(400, 'No tenant context available.');
        }

        $tenant = \App\Models\Tenant::find($tenantId);
        $roles = Role::forTenant($tenantId)->get();

        return Inertia::render('TenantAdmin/Settings', [
            'tenant' => $tenant,
            'roles' => $roles,
            'tenantId' => $tenantId,
            'stats' => [
                'tenant_name' => optional($tenant)->name ?? 'Unknown Tenant',
                'tenant_id' => $tenantId,
            ],
        ]);
    }
}
