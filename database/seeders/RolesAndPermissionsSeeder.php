<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Enums\Permission;
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
                    Permission::MANAGE_TENANTS,
                    Permission::MANAGE_SYSTEM_SETTINGS,
                    Permission::VIEW_SYSTEM_ANALYTICS,
                    Permission::IMPERSONATE_USERS,
                    Permission::VIEW_ALL_DATA,
                    Permission::EXPORT_SYSTEM_DATA,
                    Permission::MANAGE_SYSTEM_BACKUPS,
                    Permission::MANAGE_CENTRAL_USERS,
                    Permission::MANAGE_TENANT_USERS,
                    Permission::INVITE_USERS,
                    Permission::VIEW_USER_PROFILES,
                    Permission::RESET_USER_PASSWORDS,
                    Permission::DEACTIVATE_USERS,
                    Permission::MANAGE_USER_ROLES,
                    Permission::CREATE_TENANTS,
                    Permission::DELETE_TENANTS,
                    Permission::MANAGE_TENANT_SETTINGS,
                    Permission::MANAGE_TENANT_ROLES,
                    Permission::VIEW_TENANT_ANALYTICS,
                    Permission::VIEW_TENANT_DATA,
                    Permission::EXPORT_TENANT_DATA,
                    Permission::MANAGE_TENANT_BILLING,
                    Permission::VIEW_DASHBOARD,
                    Permission::MANAGE_OWN_PROFILE,
                    Permission::VIEW_SUPPORT_TICKETS,
                    Permission::CREATE_SUPPORT_TICKETS,
                    Permission::MANAGE_SUPPORT_TICKETS,
                    Permission::VIEW_ALL_SUPPORT_TICKETS,
                    Permission::ASSIGN_SUPPORT_TICKETS,
                    Permission::ESCALATE_SUPPORT_TICKETS,
                    Permission::RESOLVE_SUPPORT_TICKETS,
                    Permission::DELETE_SUPPORT_TICKETS,
                    Permission::MANAGE_TICKET_CATEGORIES,
                    Permission::MANAGE_TICKET_WORKFLOWS,
                    Permission::MANAGE_TICKET_SLA,
                    Permission::VIEW_TICKET_REPORTS,
                    Permission::CONFIGURE_SUPPORT_TICKETS,
                    Permission::VIEW_SUPPORT_ANALYTICS,
                    Permission::MANAGE_MICROSOFT365_INTEGRATION,
                    Permission::MANAGE_CONTACTS,
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
                    Permission::MANAGE_TENANT_USERS,
                    Permission::INVITE_USERS,
                    Permission::VIEW_USER_PROFILES,
                    Permission::RESET_USER_PASSWORDS,
                    Permission::DEACTIVATE_USERS,
                    Permission::MANAGE_USER_ROLES,
                    Permission::MANAGE_TENANT_SETTINGS,
                    Permission::MANAGE_TENANT_ROLES,
                    Permission::VIEW_TENANT_ANALYTICS,
                    Permission::VIEW_TENANT_DATA,
                    Permission::EXPORT_TENANT_DATA,
                    Permission::VIEW_DASHBOARD,
                    Permission::MANAGE_OWN_PROFILE,
                    Permission::VIEW_SUPPORT_TICKETS,
                    Permission::CREATE_SUPPORT_TICKETS,
                    Permission::MANAGE_SUPPORT_TICKETS,
                    Permission::VIEW_ALL_SUPPORT_TICKETS,
                    Permission::ASSIGN_SUPPORT_TICKETS,
                    Permission::ESCALATE_SUPPORT_TICKETS,
                    Permission::RESOLVE_SUPPORT_TICKETS,
                    Permission::DELETE_SUPPORT_TICKETS,
                    Permission::MANAGE_TICKET_CATEGORIES,
                    Permission::MANAGE_TICKET_WORKFLOWS,
                    Permission::MANAGE_TICKET_SLA,
                    Permission::VIEW_TICKET_REPORTS,
                    Permission::CONFIGURE_SUPPORT_TICKETS,
                    Permission::VIEW_SUPPORT_ANALYTICS,
                    Permission::MANAGE_MICROSOFT365_INTEGRATION,
                    Permission::MANAGE_CONTACTS,
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
                    Permission::VIEW_DASHBOARD,
                    Permission::MANAGE_OWN_PROFILE,
                    Permission::VIEW_TENANT_DATA,
                    Permission::CREATE_CONTENT,
                    Permission::EDIT_OWN_CONTENT,
                    Permission::VIEW_REPORTS,
                    Permission::VIEW_SUPPORT_TICKETS,
                    Permission::CREATE_SUPPORT_TICKETS,
                ]
            ]
        );

        $this->command->info('Default roles and permissions created successfully!');
    }
}
