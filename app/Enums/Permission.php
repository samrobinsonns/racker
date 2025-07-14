<?php

namespace App\Enums;

class Permission
{
    // System Management
    const MANAGE_TENANTS = 'manage_tenants';
    const MANAGE_SYSTEM_SETTINGS = 'manage_system_settings';
    const VIEW_SYSTEM_ANALYTICS = 'view_system_analytics';
    const IMPERSONATE_USERS = 'impersonate_users';
    const VIEW_ALL_DATA = 'view_all_data';
    const EXPORT_SYSTEM_DATA = 'export_system_data';
    const MANAGE_SYSTEM_BACKUPS = 'manage_system_backups';

    // User Management
    const MANAGE_CENTRAL_USERS = 'manage_central_users';
    const MANAGE_TENANT_USERS = 'manage_tenant_users';
    const INVITE_USERS = 'invite_users';
    const VIEW_USER_PROFILES = 'view_user_profiles';
    const RESET_USER_PASSWORDS = 'reset_user_passwords';
    const DEACTIVATE_USERS = 'deactivate_users';
    const MANAGE_USER_ROLES = 'manage_user_roles';

    // Tenant Operations
    const CREATE_TENANTS = 'create_tenants';
    const DELETE_TENANTS = 'delete_tenants';
    const MANAGE_TENANT_SETTINGS = 'manage_tenant_settings';
    const MANAGE_TENANT_ROLES = 'manage_tenant_roles';
    const VIEW_TENANT_ANALYTICS = 'view_tenant_analytics';
    const VIEW_TENANT_DATA = 'view_tenant_data';
    const EXPORT_TENANT_DATA = 'export_tenant_data';
    const MANAGE_TENANT_BILLING = 'manage_tenant_billing';

    // Content Management
    const VIEW_DASHBOARD = 'view_dashboard';
    const MANAGE_OWN_PROFILE = 'manage_own_profile';
    const CREATE_CONTENT = 'create_content';
    const EDIT_CONTENT = 'edit_content';
    const EDIT_OWN_CONTENT = 'edit_own_content';
    const DELETE_CONTENT = 'delete_content';
    const PUBLISH_CONTENT = 'publish_content';
    const MODERATE_CONTENT = 'moderate_content';
    const VIEW_REPORTS = 'view_reports';
    const MANAGE_CATEGORIES = 'manage_categories';
    const MANAGE_CONTACTS = 'manage_contacts';

    // Support Ticket Management
    const VIEW_SUPPORT_TICKETS = 'view_support_tickets';
    const CREATE_SUPPORT_TICKETS = 'create_support_tickets';
    const MANAGE_SUPPORT_TICKETS = 'manage_support_tickets';
    const VIEW_ALL_SUPPORT_TICKETS = 'view_all_support_tickets';
    const ASSIGN_SUPPORT_TICKETS = 'assign_support_tickets';
    const ESCALATE_SUPPORT_TICKETS = 'escalate_support_tickets';
    const RESOLVE_SUPPORT_TICKETS = 'resolve_support_tickets';
    const DELETE_SUPPORT_TICKETS = 'delete_support_tickets';
    const MANAGE_TICKET_CATEGORIES = 'manage_ticket_categories';
    const MANAGE_TICKET_WORKFLOWS = 'manage_ticket_workflows';
    const MANAGE_TICKET_SLA = 'manage_ticket_sla';
    const VIEW_TICKET_REPORTS = 'view_ticket_reports';
    const CONFIGURE_SUPPORT_TICKETS = 'configure_support_tickets';
    const VIEW_SUPPORT_ANALYTICS = 'view_support_analytics';
    const MANAGE_MICROSOFT365_INTEGRATION = 'manage_microsoft365_integration';

    // Email Management
    const MANAGE_EMAIL_PROVIDERS = 'manage_email_providers';
    const MANAGE_EMAIL_TEMPLATES = 'manage_email_templates';
    const VIEW_EMAIL_ANALYTICS = 'view_email_analytics';
    const SEND_EMAIL_CAMPAIGNS = 'send_email_campaigns';

    /**
     * Get all permissions organized by category (including custom permissions)
     */
    public static function getGroupedPermissions(): array
    {
        $basePermissions = [
            'System Management' => [
                self::MANAGE_TENANTS => [
                    'label' => 'Manage Tenants',
                    'description' => 'Create, edit, and delete tenants'
                ],
                self::MANAGE_SYSTEM_SETTINGS => [
                    'label' => 'Manage System Settings',
                    'description' => 'Access system configuration'
                ],
                self::VIEW_SYSTEM_ANALYTICS => [
                    'label' => 'View System Analytics',
                    'description' => 'Access system-wide analytics'
                ],
                self::IMPERSONATE_USERS => [
                    'label' => 'Impersonate Users',
                    'description' => 'Login as other users'
                ],
                self::VIEW_ALL_DATA => [
                    'label' => 'View All Data',
                    'description' => 'Access all system data'
                ],
                self::EXPORT_SYSTEM_DATA => [
                    'label' => 'Export System Data',
                    'description' => 'Export system-wide data'
                ],
                self::MANAGE_SYSTEM_BACKUPS => [
                    'label' => 'Manage System Backups',
                    'description' => 'Create and restore system backups'
                ],
            ],
            'User Management' => [
                self::MANAGE_CENTRAL_USERS => [
                    'label' => 'Manage Central Users',
                    'description' => 'Manage system administrators'
                ],
                self::MANAGE_TENANT_USERS => [
                    'label' => 'Manage Tenant Users',
                    'description' => 'Manage users within tenants'
                ],
                self::INVITE_USERS => [
                    'label' => 'Invite Users',
                    'description' => 'Send user invitations'
                ],
                self::VIEW_USER_PROFILES => [
                    'label' => 'View User Profiles',
                    'description' => 'Access user profile information'
                ],
                self::RESET_USER_PASSWORDS => [
                    'label' => 'Reset User Passwords',
                    'description' => 'Reset passwords for other users'
                ],
                self::DEACTIVATE_USERS => [
                    'label' => 'Deactivate Users',
                    'description' => 'Suspend or deactivate user accounts'
                ],
                self::MANAGE_USER_ROLES => [
                    'label' => 'Manage User Roles',
                    'description' => 'Assign and remove user roles'
                ],
            ],
            'Tenant Operations' => [
                self::CREATE_TENANTS => [
                    'label' => 'Create Tenants',
                    'description' => 'Create new tenant organizations'
                ],
                self::DELETE_TENANTS => [
                    'label' => 'Delete Tenants',
                    'description' => 'Remove tenant organizations'
                ],
                self::MANAGE_TENANT_SETTINGS => [
                    'label' => 'Manage Tenant Settings',
                    'description' => 'Configure tenant settings'
                ],
                self::MANAGE_TENANT_ROLES => [
                    'label' => 'Manage Tenant Roles',
                    'description' => 'Manage roles within tenant'
                ],
                self::VIEW_TENANT_ANALYTICS => [
                    'label' => 'View Tenant Analytics',
                    'description' => 'Access tenant analytics'
                ],
                self::VIEW_TENANT_DATA => [
                    'label' => 'View Tenant Data',
                    'description' => 'Access tenant information'
                ],
                self::EXPORT_TENANT_DATA => [
                    'label' => 'Export Tenant Data',
                    'description' => 'Export tenant data'
                ],
                self::MANAGE_TENANT_BILLING => [
                    'label' => 'Manage Tenant Billing',
                    'description' => 'Access billing and subscription settings'
                ],
            ],
            'Content Management' => [
                self::VIEW_DASHBOARD => [
                    'label' => 'View Dashboard',
                    'description' => 'Access dashboard interface'
                ],
                self::MANAGE_OWN_PROFILE => [
                    'label' => 'Manage Own Profile',
                    'description' => 'Edit personal profile'
                ],
                self::CREATE_CONTENT => [
                    'label' => 'Create Content',
                    'description' => 'Create new content'
                ],
                self::EDIT_CONTENT => [
                    'label' => 'Edit Content',
                    'description' => 'Edit existing content'
                ],
                self::EDIT_OWN_CONTENT => [
                    'label' => 'Edit Own Content',
                    'description' => 'Edit only own content'
                ],
                self::DELETE_CONTENT => [
                    'label' => 'Delete Content',
                    'description' => 'Remove content'
                ],
                self::PUBLISH_CONTENT => [
                    'label' => 'Publish Content',
                    'description' => 'Publish and unpublish content'
                ],
                self::MODERATE_CONTENT => [
                    'label' => 'Moderate Content',
                    'description' => 'Review and moderate user content'
                ],
                self::VIEW_REPORTS => [
                    'label' => 'View Reports',
                    'description' => 'Access reporting features'
                ],
                self::MANAGE_CATEGORIES => [
                    'label' => 'Manage Categories',
                    'description' => 'Create and manage content categories'
                ],
                self::MANAGE_CONTACTS => [
                    'label' => 'Manage Contacts',
                    'description' => 'Create, edit, and manage contact information'
                ],
            ],
            'Support Ticket Management' => [
                self::VIEW_SUPPORT_TICKETS => [
                    'label' => 'View Support Tickets',
                    'description' => 'View support tickets within tenant'
                ],
                self::CREATE_SUPPORT_TICKETS => [
                    'label' => 'Create Support Tickets',
                    'description' => 'Create new support tickets'
                ],
                self::MANAGE_SUPPORT_TICKETS => [
                    'label' => 'Manage Support Tickets',
                    'description' => 'Full ticket management capabilities'
                ],
                self::VIEW_ALL_SUPPORT_TICKETS => [
                    'label' => 'View All Support Tickets',
                    'description' => 'View all tickets across tenant regardless of assignment'
                ],
                self::ASSIGN_SUPPORT_TICKETS => [
                    'label' => 'Assign Support Tickets',
                    'description' => 'Assign tickets to team members'
                ],
                self::ESCALATE_SUPPORT_TICKETS => [
                    'label' => 'Escalate Support Tickets',
                    'description' => 'Escalate tickets to higher priority or management'
                ],
                self::RESOLVE_SUPPORT_TICKETS => [
                    'label' => 'Resolve Support Tickets',
                    'description' => 'Mark tickets as resolved or closed'
                ],
                self::DELETE_SUPPORT_TICKETS => [
                    'label' => 'Delete Support Tickets',
                    'description' => 'Delete support tickets'
                ],
                self::MANAGE_TICKET_CATEGORIES => [
                    'label' => 'Manage Ticket Categories',
                    'description' => 'Create and manage ticket categories'
                ],
                self::MANAGE_TICKET_WORKFLOWS => [
                    'label' => 'Manage Ticket Workflows',
                    'description' => 'Configure automated workflows and escalations'
                ],
                self::MANAGE_TICKET_SLA => [
                    'label' => 'Manage Ticket SLA',
                    'description' => 'Configure SLA policies and response times'
                ],
                self::VIEW_TICKET_REPORTS => [
                    'label' => 'View Ticket Reports',
                    'description' => 'Access ticket analytics and reporting'
                ],
                self::CONFIGURE_SUPPORT_TICKETS => [
                    'label' => 'Configure Support Tickets',
                    'description' => 'Configure support ticket system settings'
                ],
                self::VIEW_SUPPORT_ANALYTICS => [
                    'label' => 'View Support Analytics',
                    'description' => 'Access detailed support ticket analytics and metrics'
                ],
                self::MANAGE_MICROSOFT365_INTEGRATION => [
                    'label' => 'Manage Microsoft 365 Integration',
                    'description' => 'Configure Microsoft 365 email integration'
                ],
            ],
            'Email Management' => [
                self::MANAGE_EMAIL_PROVIDERS => [
                    'label' => 'Manage Email Providers',
                    'description' => 'Manage email provider integrations'
                ],
                self::MANAGE_EMAIL_TEMPLATES => [
                    'label' => 'Manage Email Templates',
                    'description' => 'Manage email template designs'
                ],
                self::VIEW_EMAIL_ANALYTICS => [
                    'label' => 'View Email Analytics',
                    'description' => 'Access email analytics and reporting'
                ],
                self::SEND_EMAIL_CAMPAIGNS => [
                    'label' => 'Send Email Campaigns',
                    'description' => 'Send email campaigns to users'
                ],
            ],
        ];

        // Merge with custom permissions from database
        if (class_exists(\App\Models\CustomPermission::class)) {
            $customPermissions = \App\Models\CustomPermission::getGroupedPermissions();
            foreach ($customPermissions as $category => $permissions) {
                if (!isset($basePermissions[$category])) {
                    $basePermissions[$category] = [];
                }
                foreach ($permissions as $permission) {
                    $basePermissions[$category][$permission['key']] = [
                        'label' => $permission['label'],
                        'description' => $permission['description']
                    ];
                }
            }
        }

        return $basePermissions;
    }

    /**
     * Get all permission keys
     */
    public static function getAllPermissions(): array
    {
        $grouped = self::getGroupedPermissions();
        $permissions = [];
        
        foreach ($grouped as $category => $perms) {
            $permissions = array_merge($permissions, array_keys($perms));
        }
        
        return $permissions;
    }

    /**
     * Get permission dependencies (permissions that require other permissions)
     */
    public static function getPermissionDependencies(): array
    {
        return [
            self::EDIT_CONTENT => [self::VIEW_DASHBOARD],
            self::DELETE_CONTENT => [self::EDIT_CONTENT],
            self::PUBLISH_CONTENT => [self::EDIT_CONTENT],
            self::MODERATE_CONTENT => [self::VIEW_REPORTS],
            self::MANAGE_TENANT_USERS => [self::VIEW_USER_PROFILES],
            self::RESET_USER_PASSWORDS => [self::MANAGE_TENANT_USERS],
            self::DEACTIVATE_USERS => [self::MANAGE_TENANT_USERS],
            self::EXPORT_TENANT_DATA => [self::VIEW_TENANT_DATA],
            self::DELETE_TENANTS => [self::MANAGE_TENANTS],
        ];
    }
} 