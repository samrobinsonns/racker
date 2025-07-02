<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class TenantRoleSeeder extends Seeder
{
    public function run()
    {
        // Create default tenant admin role template
        $tenantAdminRole = Role::firstOrCreate(
            ['name' => 'tenant_admin', 'type' => 'tenant', 'tenant_id' => null],
            [
                'display_name' => 'Tenant Administrator',
                'description' => 'Full administrative access to tenant resources',
            ]
        );

        // Create default tenant user role template
        $tenantUserRole = Role::firstOrCreate(
            ['name' => 'tenant_user', 'type' => 'tenant', 'tenant_id' => null],
            [
                'display_name' => 'Tenant User',
                'description' => 'Standard user access to tenant resources',
            ]
        );

        // Define permissions for tenant admin
        $tenantAdminPermissions = [
            'manage_tenant_users',
            'invite_users',
            'view_user_profiles',
            'reset_user_passwords',
            'deactivate_users',
            'manage_user_roles',
            'manage_tenant_settings',
            'manage_tenant_roles',
            'view_tenant_analytics',
            'view_tenant_data',
            'export_tenant_data',
            'manage_tenant_billing',
            'view_dashboard',
            'manage_own_profile',
            'create_content',
            'edit_content',
            'delete_content',
            'publish_content',
            'moderate_content',
            'view_reports',
            'manage_categories',
        ];

        // Define permissions for tenant user
        $tenantUserPermissions = [
            'view_dashboard',
            'manage_own_profile',
            'view_user_profiles',
            'create_content',
            'edit_own_content',
            'view_reports',
        ];

        // Sync permissions for tenant admin role
        $tenantAdminRole->syncPermissions($tenantAdminPermissions);

        // Sync permissions for tenant user role
        $tenantUserRole->syncPermissions($tenantUserPermissions);

        $this->command->info('Default tenant roles and permissions created successfully.');
    }
} 