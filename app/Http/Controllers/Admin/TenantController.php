<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TenantController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $tenants = Tenant::with(['users', 'domains'])
            ->withCount('users')
            ->latest()
            ->paginate(15);

        return Inertia::render('CentralAdmin/Tenants/Index', [
            'tenants' => $tenants,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('CentralAdmin/Tenants/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'domain' => 'required|string|max:255|unique:domains,domain',
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
        ]);

        // Create tenant
        $tenant = Tenant::create([
            'id' => Str::uuid(),
        ]);
        
        // Set tenant properties directly (stored in JSON data field automatically)
        $tenant->name = $request->name;
        $tenant->plan = 'basic';
        $tenant->status = 'active';
        $tenant->save();

        // Create domain for tenant
        $tenant->domains()->create([
            'domain' => $request->domain,
        ]);

        // Create tenant-specific roles based on templates
        $this->createTenantRoles($tenant);

        // Create tenant admin user
        $this->createTenantAdmin($tenant, $request->admin_name, $request->admin_email);

        return redirect()->route('central-admin.tenants.index')
            ->with('success', 'Tenant created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Tenant $tenant)
    {
        $tenant->load(['users.roles', 'domains']);

        return Inertia::render('CentralAdmin/Tenants/Show', [
            'tenant' => $tenant,
            'users' => $tenant->users()->with('roles')->paginate(10),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Tenant $tenant)
    {
        $tenant->load('domains');

        return Inertia::render('CentralAdmin/Tenants/Edit', [
            'tenant' => $tenant,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Tenant $tenant)
    {
        // Validate both nested data structure and direct data structure
        $validatedData = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'status' => 'sometimes|required|in:active,inactive,suspended',
            'plan' => 'sometimes|required|string|max:255',
            'data.name' => 'sometimes|required|string|max:255',
            'data.status' => 'sometimes|required|in:active,inactive,suspended',
            'data.plan' => 'sometimes|required|string|max:255',
        ]);

        // Handle both direct data and nested data structures
        if ($request->has('data')) {
            // If using nested data structure (from modal)
            if (isset($request->data['name'])) $tenant->name = $request->data['name'];
            if (isset($request->data['status'])) $tenant->status = $request->data['status'];
            if (isset($request->data['plan'])) $tenant->plan = $request->data['plan'];
        } else {
            // If using direct structure (from dedicated edit page)
            if ($request->has('name')) $tenant->name = $request->name;
            if ($request->has('status')) $tenant->status = $request->status;
            if ($request->has('plan')) $tenant->plan = $request->plan;
        }

        $tenant->save();

        return redirect()->route('central-admin.tenants.index')
            ->with('success', 'Tenant updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Tenant $tenant)
    {
        // Delete tenant users, roles, and domains (cascade will handle this)
        $tenant->delete();

        return redirect()->route('central-admin.tenants.index')
            ->with('success', 'Tenant deleted successfully!');
    }

    /**
     * Create tenant-specific roles based on templates
     */
    private function createTenantRoles(Tenant $tenant)
    {
        $roleTemplates = Role::whereNull('tenant_id')->where('type', 'tenant')->get();

        foreach ($roleTemplates as $template) {
            Role::create([
                'name' => $template->name,
                'display_name' => $template->display_name,
                'description' => $template->description,
                'type' => 'tenant',
                'tenant_id' => $tenant->id,
                'permissions' => $template->permissions,
            ]);
        }
    }

    /**
     * Create tenant admin user
     */
    private function createTenantAdmin(Tenant $tenant, $name, $email)
    {
        $user = \App\Models\User::create([
            'name' => $name,
            'email' => $email,
            'password' => \Illuminate\Support\Facades\Hash::make('password'), // Should be changed
            'email_verified_at' => now(),
            'tenant_id' => $tenant->id,
            'is_central_admin' => false,
        ]);

        // Assign tenant admin role
        $adminRole = Role::where('name', 'tenant_admin')
            ->where('tenant_id', $tenant->id)
            ->first();

        if ($adminRole) {
            $user->assignRole($adminRole->id, $tenant->id);
        }

        return $user;
    }
}
