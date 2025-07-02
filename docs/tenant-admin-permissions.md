# Tenant Admin Permissions Guide

## Overview

This document explains how permissions are displayed and managed for tenant admin roles in the Racker multi-tenant system. Tenant admins have access to a comprehensive set of permissions that allow them to manage their organization effectively while maintaining proper security boundaries.

## Permission Categories

### 1. User Management
Permissions for managing users within the tenant organization.

| Permission Key | Display Name | Description |
|----------------|--------------|-------------|
| `manage_central_users` | Manage Central Users | Manage system administrators |
| `manage_tenant_users` | Manage Tenant Users | Manage users within tenants |
| `invite_users` | Invite Users | Send user invitations |
| `view_user_profiles` | View User Profiles | Access user profile information |
| `reset_user_passwords` | Reset User Passwords | Reset passwords for other users |
| `deactivate_users` | Deactivate Users | Suspend or deactivate user accounts |
| `manage_user_roles` | Manage User Roles | Assign and remove user roles |

### 2. Tenant Operations
Permissions for managing tenant-specific settings and operations.

| Permission Key | Display Name | Description |
|----------------|--------------|-------------|
| `manage_tenant_settings` | Manage Tenant Settings | Configure tenant settings |
| `manage_tenant_roles` | Manage Tenant Roles | Manage roles within tenant |
| `view_tenant_analytics` | View Tenant Analytics | Access tenant analytics |
| `view_tenant_data` | View Tenant Data | Access tenant information |
| `export_tenant_data` | Export Tenant Data | Export tenant data |
| `manage_tenant_billing` | Manage Tenant Billing | Access billing and subscription settings |

### 3. Content Management
Permissions for managing content within the tenant.

| Permission Key | Display Name | Description |
|----------------|--------------|-------------|
| `view_dashboard` | View Dashboard | Access dashboard interface |
| `manage_own_profile` | Manage Own Profile | Edit personal profile |
| `create_content` | Create Content | Create new content |
| `edit_content` | Edit Content | Edit existing content |
| `edit_own_content` | Edit Own Content | Edit only own content |
| `delete_content` | Delete Content | Remove content |
| `publish_content` | Publish Content | Publish and unpublish content |
| `moderate_content` | Moderate Content | Review and moderate user content |
| `view_reports` | View Reports | Access reporting features |
| `manage_categories` | Manage Categories | Create and manage content categories |

### 4. Support Management
Permissions for managing support tickets and customer service.

| Permission Key | Display Name | Description |
|----------------|--------------|-------------|
| `view_support_tickets` | View Support Tickets | Access support ticket system |
| `create_support_tickets` | Create Support Tickets | Create new support tickets |
| `manage_support_tickets` | Manage Support Tickets | Manage support tickets |
| `view_all_support_tickets` | View All Support Tickets | Access all support tickets |
| `assign_support_tickets` | Assign Support Tickets | Assign tickets to team members |
| `escalate_support_tickets` | Escalate Support Tickets | Escalate tickets to higher priority |
| `resolve_support_tickets` | Resolve Support Tickets | Mark tickets as resolved |
| `manage_ticket_categories` | Manage Ticket Categories | Create and manage ticket categories |
| `view_ticket_reports` | View Ticket Reports | Access ticket reporting features |
| `configure_support_tickets` | Configure Support Tickets | Configure support ticket settings |
| `view_support_analytics` | View Support Analytics | Access support analytics |

## Excluded Permissions

The following System Management permissions are **NOT** available to tenant admins and are restricted to central administrators only:

| Permission Key | Display Name | Reason for Exclusion |
|----------------|--------------|---------------------|
| `manage_tenants` | Manage Tenants | System-wide tenant management |
| `manage_system_settings` | Manage System Settings | Global system configuration |
| `view_system_analytics` | View System Analytics | System-wide analytics access |
| `impersonate_users` | Impersonate Users | Cross-tenant user access |
| `view_all_data` | View All Data | Access to all tenant data |
| `export_system_data` | Export System Data | System-wide data export |
| `manage_system_backups` | Manage System Backups | System backup management |

## Implementation Details

### Backend Implementation

The permissions are defined in the `TenantAdminController::getAvailablePermissions()` method:

```php
private function getAvailablePermissions()
{
    return [
        'User Management' => [
            ['key' => 'manage_tenant_users', 'label' => 'Manage Tenant Users', 'description' => 'Manage users within tenants'],
            // ... more permissions
        ],
        'Tenant Operations' => [
            ['key' => 'manage_tenant_settings', 'label' => 'Manage Tenant Settings', 'description' => 'Configure tenant settings'],
            // ... more permissions
        ],
        // ... more categories
    ];
}
```

### Frontend Integration

The permissions are passed to the frontend in the `TenantAdminController::users()` method:

```php
return Inertia::render('TenantAdmin/Users/Index', [
    'users' => $users,
    'availableRoles' => $availableRoles,
    'roles' => $roles,
    'tenantId' => $tenantId,
    'stats' => [
        'tenant_name' => optional($user->tenant)->name ?? 'Unknown Tenant',
        'tenant_id' => $tenantId,
    ],
    'permissions' => $this->getAvailablePermissions(),
]);
```

### Role Management

Tenant admins can create and manage roles with these permissions through the `RolesSection` component, which displays:

1. **Permission Categories**: Organized by functional area
2. **Permission Details**: Each permission shows a key, display name, and description
3. **Role Assignment**: Permissions can be assigned to roles during creation/editing
4. **Visual Indicators**: Clear organization with checkboxes for easy selection

## Security Considerations

### Data Isolation
- Tenant admins can only manage users within their own tenant
- Permissions are scoped to tenant-specific operations
- No access to system-wide or cross-tenant data

### Permission Inheritance
- Tenant-specific roles inherit from template roles
- Template roles provide default permission sets
- Custom roles can be created with specific permission combinations

### Audit Trail
- All role and permission changes are logged
- User role assignments are tracked
- Permission changes require appropriate authorization

## Best Practices

### Role Design
1. **Principle of Least Privilege**: Only grant necessary permissions
2. **Role Hierarchy**: Create roles with increasing levels of access
3. **Documentation**: Document the purpose of each custom role
4. **Regular Review**: Periodically review and update role permissions

### Permission Assignment
1. **Group Related Permissions**: Assign permissions that are typically used together
2. **Avoid Over-Permissioning**: Don't grant permissions "just in case"
3. **Test Permissions**: Verify that assigned permissions work as expected
4. **Monitor Usage**: Track which permissions are actually being used

### User Management
1. **Role-Based Assignment**: Assign users to roles rather than individual permissions
2. **Temporary Access**: Use temporary role assignments for special projects
3. **Regular Audits**: Review user role assignments regularly
4. **Offboarding**: Remove roles when users leave or change positions

## Troubleshooting

### Common Issues

1. **Permissions Not Showing**: Ensure the `permissions` array is passed to the frontend
2. **Role Creation Fails**: Verify that all permission keys exist in the system
3. **Access Denied**: Check that the user has the required permissions for the action
4. **Template Roles Missing**: Ensure template roles are properly seeded

### Debug Steps

1. Check the browser console for permission-related errors
2. Verify the permissions array in the network response
3. Check the Laravel logs for permission-related issues
4. Validate that the user has the correct tenant context

## Future Enhancements

### Planned Features
- **Permission Groups**: Pre-defined permission sets for common roles
- **Conditional Permissions**: Permissions that depend on other factors
- **Permission Analytics**: Track permission usage and effectiveness
- **Advanced Role Templates**: More sophisticated role inheritance

### Customization Options
- **Tenant-Specific Permissions**: Allow tenants to define custom permissions
- **Permission Workflows**: Approval processes for sensitive permissions
- **Time-Limited Permissions**: Temporary permission grants
- **Permission Delegation**: Allow users to temporarily grant their permissions

## Related Documentation

- [Multi-Tenancy Architecture](../architecture/multi-tenancy.md)
- [Role Management System](../features/role-management.md)
- [User Management Guide](../features/user-management.md)
- [Security Best Practices](../security/best-practices.md) 