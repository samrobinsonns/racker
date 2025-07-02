<?php

namespace App\Http\Controllers\TenantAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Role;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) {
                    // Check if name exists in the same tenant
                    $exists = Role::where('name', $value)
                        ->where('tenant_id', tenant()->id)
                        ->exists();
                    
                    if ($exists) {
                        $fail('The name has already been taken within this tenant.');
                    }
                }
            ],
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'permissions' => 'required|array',
            'permissions.*' => 'string',
        ]);

        // Ensure the role name is properly formatted
        $validated['name'] = Str::slug($validated['name'], '_');
        
        // Create role with current tenant
        $role = Role::create([
            'name' => $validated['name'],
            'display_name' => $validated['display_name'],
            'description' => $validated['description'],
            'type' => 'tenant',
            'tenant_id' => tenant()->id,
        ]);

        // Sync permissions
        $role->syncPermissions($validated['permissions']);

        return back()->with('success', 'Role created successfully.');
    }

    public function update(Request $request, Role $role)
    {
        // Ensure the role belongs to the current tenant
        if ($role->tenant_id !== tenant()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) use ($role) {
                    // Check if name exists in the same tenant, excluding current role
                    $exists = Role::where('name', $value)
                        ->where('tenant_id', tenant()->id)
                        ->where('id', '!=', $role->id)
                        ->exists();
                    
                    if ($exists) {
                        $fail('The name has already been taken within this tenant.');
                    }
                }
            ],
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'permissions' => 'required|array',
            'permissions.*' => 'string',
        ]);

        // Ensure the role name is properly formatted
        $validated['name'] = Str::slug($validated['name'], '_');

        // Update role
        $role->update([
            'name' => $validated['name'],
            'display_name' => $validated['display_name'],
            'description' => $validated['description'],
        ]);

        // Sync permissions
        $role->syncPermissions($validated['permissions']);

        return back()->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role)
    {
        // Ensure the role belongs to the current tenant
        if ($role->tenant_id !== tenant()->id) {
            abort(403);
        }

        // Prevent deletion of tenant_admin role
        if ($role->name === 'tenant_admin') {
            return back()->with('error', 'Cannot delete the tenant admin role.');
        }

        // Delete role
        $role->delete();

        return back()->with('success', 'Role deleted successfully.');
    }
} 