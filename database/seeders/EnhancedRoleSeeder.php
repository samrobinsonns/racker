<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Models\Tenant;
use App\Enums\Permission;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EnhancedRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Setting up enhanced roles and permissions...');

        // First, ensure all roles have the proper permissions from the Permission enum
        $this->updateRolePermissions();

        // Assign roles to existing users
        $this->assignRolesToExistingUsers();

        // Create sample tenant and users if they don't exist
        $this->createSampleTenantUsers();

        $this->command->info('Enhanced roles and permissions setup completed!');
    }

    /**
     * Update existing roles with proper permissions
     */
    protected function updateRolePermissions()
    {
        $this->command->info('Updating role permissions...');

        // Update Central Admin role
        $centralAdminRole = Role::where('name', 'central_admin')->first();
        if ($centralAdminRole) {
            $centralAdminRole->update([
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
            ]);
            $this->command->info('Updated Central Admin role permissions');
        }

        // Update Tenant Admin role
        $tenantAdminRole = Role::where('name', 'tenant_admin')->first();
        if ($tenantAdminRole) {
            $tenantAdminRole->update([
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
            ]);
            $this->command->info('Updated Tenant Admin role permissions');
        }

        // Update Tenant User role
        $tenantUserRole = Role::where('name', 'tenant_user')->first();
        if ($tenantUserRole) {
            $tenantUserRole->update([
                'permissions' => [
                    Permission::VIEW_DASHBOARD,
                    Permission::MANAGE_OWN_PROFILE,
                    Permission::VIEW_TENANT_DATA,
                    Permission::CREATE_CONTENT,
                    Permission::EDIT_OWN_CONTENT,
                    Permission::VIEW_REPORTS,
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
                ]
            ]);
            $this->command->info('Updated Tenant User role permissions');
        }
    }

    /**
     * Assign roles to existing users
     */
    protected function assignRolesToExistingUsers()
    {
        $this->command->info('Assigning roles to existing users...');

        // Find all central admins and make sure they have the central admin role
        $centralAdmins = User::where('is_central_admin', true)->get();
        $centralAdminRole = Role::where('name', 'central_admin')->first();

        foreach ($centralAdmins as $admin) {
            if ($centralAdminRole && !$admin->roles->contains($centralAdminRole)) {
                $admin->assignRole($centralAdminRole->id);
                $this->command->info("Assigned central admin role to: {$admin->email}");
            }
        }

        // Find tenant users without roles and assign tenant_user role
        $tenantUsers = User::where('is_central_admin', false)
                          ->whereNotNull('tenant_id')
                          ->whereDoesntHave('roles')
                          ->get();

        $tenantUserRole = Role::where('name', 'tenant_user')->first();

        foreach ($tenantUsers as $user) {
            if ($tenantUserRole) {
                $user->assignRole($tenantUserRole->id, $user->tenant_id);
                $this->command->info("Assigned tenant user role to: {$user->email}");
            }
        }
    }

    /**
     * Create sample tenant and users
     */
    protected function createSampleTenantUsers()
    {
        // Check if we have any tenants
        if (Tenant::count() === 0) {
            $this->command->info('Creating sample tenant...');
            
            $tenant = Tenant::create([
                'id' => 'demo-tenant',
                'name' => 'Demo Company',
            ]);

            // Create tenant admin user
            $tenantAdmin = User::create([
                'name' => 'Tenant Admin',
                'email' => 'tenant-admin@demo.com',
                'password' => Hash::make('password'),
                'tenant_id' => $tenant->id,
                'is_central_admin' => false,
                'email_verified_at' => now(),
            ]);

            // Assign tenant admin role
            $tenantAdminRole = Role::where('name', 'tenant_admin')->first();
            if ($tenantAdminRole) {
                $tenantAdmin->assignRole($tenantAdminRole->id, $tenant->id);
                $this->command->info("Created tenant admin: {$tenantAdmin->email}");
            }

            // Create regular tenant user
            $tenantUser = User::create([
                'name' => 'Regular User',
                'email' => 'user@demo.com',
                'password' => Hash::make('password'),
                'tenant_id' => $tenant->id,
                'is_central_admin' => false,
                'email_verified_at' => now(),
            ]);

            // Assign tenant user role
            $tenantUserRole = Role::where('name', 'tenant_user')->first();
            if ($tenantUserRole) {
                $tenantUser->assignRole($tenantUserRole->id, $tenant->id);
                $this->command->info("Created tenant user: {$tenantUser->email}");
            }

            $this->command->info('Sample tenant and users created successfully!');
        }

        // Ensure all tenant users have at least the tenant_user role
        $unassignedTenantUsers = User::where('is_central_admin', false)
                                   ->whereNotNull('tenant_id')
                                   ->whereDoesntHave('roles')
                                   ->get();

        $tenantUserRole = Role::where('name', 'tenant_user')->first();
        foreach ($unassignedTenantUsers as $user) {
            if ($tenantUserRole) {
                $user->assignRole($tenantUserRole->id, $user->tenant_id);
                $this->command->info("Assigned tenant_user role to: {$user->email}");
            }
        }
    }
}
