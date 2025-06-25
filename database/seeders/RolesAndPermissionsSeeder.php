<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Central Admin Role (Global)
        Role::firstOrCreate(
            ['name' => 'central_admin', 'type' => 'central'],
            [
                'display_name' => 'Central Administrator',
                'description' => 'Full system access - can manage all tenants and users',
                'tenant_id' => null,
                'permissions' => [
                    'manage_tenants',
                    'manage_central_users',
                    'manage_tenant_users',
                    'view_system_analytics',
                    'manage_system_settings',
                    'create_tenants',
                    'delete_tenants',
                    'impersonate_users',
                    'view_all_data',
                ]
            ]
        );

        // Tenant Admin Role Template (will be created per tenant)
        Role::firstOrCreate(
            ['name' => 'tenant_admin', 'type' => 'tenant'],
            [
                'display_name' => 'Tenant Administrator',
                'description' => 'Admin access within tenant - can manage tenant users and settings',
                'tenant_id' => null, // This will be set when creating tenant-specific roles
                'permissions' => [
                    'manage_tenant_users',
                    'invite_users',
                    'manage_tenant_settings',
                    'view_tenant_analytics',
                    'manage_tenant_roles',
                    'view_tenant_data',
                    'export_tenant_data',
                ]
            ]
        );

        // Tenant User Role Template (will be created per tenant)
        Role::firstOrCreate(
            ['name' => 'tenant_user', 'type' => 'tenant'],
            [
                'display_name' => 'Tenant User',
                'description' => 'Standard user access within tenant',
                'tenant_id' => null, // This will be set when creating tenant-specific roles
                'permissions' => [
                    'view_dashboard',
                    'manage_own_profile',
                    'view_tenant_data',
                    'create_content',
                    'edit_own_content',
                ]
            ]
        );

        // Tenant Manager Role Template (optional middle tier)
        Role::firstOrCreate(
            ['name' => 'tenant_manager', 'type' => 'tenant'],
            [
                'display_name' => 'Tenant Manager',
                'description' => 'Management access within tenant - can manage content and some users',
                'tenant_id' => null,
                'permissions' => [
                    'view_dashboard',
                    'manage_own_profile',
                    'view_tenant_data',
                    'create_content',
                    'edit_content',
                    'delete_content',
                    'manage_some_users',
                    'view_reports',
                ]
            ]
        );

        $this->command->info('Default roles and permissions created successfully!');
    }
}
