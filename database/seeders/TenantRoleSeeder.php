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
            'manage_contacts',
            'view_support_tickets',
            'create_support_tickets',
            'manage_support_tickets',
            'view_all_support_tickets',
            'assign_support_tickets',
            'escalate_support_tickets',
            'resolve_support_tickets',
            'delete_support_tickets',
            'manage_ticket_categories',
            'manage_ticket_workflows',
            'manage_ticket_sla',
            'view_ticket_reports',
            'configure_support_tickets',
            'view_support_analytics',
            'manage_microsoft365_integration',
        ];

        // Define permissions for tenant user
        $tenantUserPermissions = [
            'view_dashboard',
            'manage_own_profile',
            'view_user_profiles',
            'create_content',
            'edit_own_content',
            'view_reports',
            'view_support_tickets',
            'create_support_tickets',
        ];

        // Sync permissions for tenant admin role
        $tenantAdminRole->syncPermissions($tenantAdminPermissions);

        // Sync permissions for tenant user role
        $tenantUserRole->syncPermissions($tenantUserPermissions);

        $this->command->info('Default tenant roles and permissions created successfully.');
    }
} 