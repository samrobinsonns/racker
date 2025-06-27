<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Support Ticket System Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains configuration options for the support ticket system
    | including Microsoft 365 email integration settings.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Microsoft 365 Integration
    |--------------------------------------------------------------------------
    |
    | Configuration for Microsoft 365 email integration. Each tenant can have
    | their own Microsoft 365 connection for email processing.
    |
    */
    'microsoft365' => [
        'enabled' => env('SUPPORT_MICROSOFT365_ENABLED', false),
        'client_id' => env('SUPPORT_MICROSOFT365_CLIENT_ID'),
        'client_secret' => env('SUPPORT_MICROSOFT365_CLIENT_SECRET'),
        'tenant_id' => env('SUPPORT_MICROSOFT365_TENANT_ID'),
        'redirect_uri' => env('SUPPORT_MICROSOFT365_REDIRECT_URI', '/support/microsoft365/callback'),
        'scopes' => [
            'https://graph.microsoft.com/Mail.Read',
            'https://graph.microsoft.com/Mail.Send',
            'https://graph.microsoft.com/Mail.ReadWrite',
            'https://graph.microsoft.com/User.Read',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Email Processing
    |--------------------------------------------------------------------------
    |
    | Configuration for automatic email processing and ticket creation.
    |
    */
    'email_processing' => [
        'auto_create_tickets' => env('SUPPORT_AUTO_CREATE_TICKETS', true),
        'check_interval_minutes' => env('SUPPORT_EMAIL_CHECK_INTERVAL', 5),
        'max_emails_per_check' => env('SUPPORT_MAX_EMAILS_PER_CHECK', 50),
        'attachment_max_size' => env('SUPPORT_ATTACHMENT_MAX_SIZE', 10485760), // 10MB
        'allowed_attachment_types' => [
            'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 
            'xls', 'xlsx', 'txt', 'zip', 'rar'
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Ticket Configuration
    |--------------------------------------------------------------------------
    |
    | Default settings for tickets, priorities, and statuses.
    |
    */
    'tickets' => [
        'number_prefix' => env('SUPPORT_TICKET_PREFIX', 'TICK'),
        'auto_assignment' => env('SUPPORT_AUTO_ASSIGNMENT', true),
        'auto_close_days' => env('SUPPORT_AUTO_CLOSE_DAYS', 7),
        'default_priority' => 'medium',
        'default_status' => 'open',
    ],

    /*
    |--------------------------------------------------------------------------
    | SLA Configuration
    |--------------------------------------------------------------------------
    |
    | Default SLA settings for different priority levels.
    |
    */
    'sla' => [
        'enabled' => env('SUPPORT_SLA_ENABLED', true),
        'business_hours_only' => env('SUPPORT_SLA_BUSINESS_HOURS_ONLY', true),
        'business_hours' => [
            'start' => '09:00',
            'end' => '17:00',
            'timezone' => 'UTC',
        ],
        'default_response_times' => [
            'critical' => 1, // hours
            'high' => 4,
            'medium' => 24,
            'low' => 72,
        ],
        'default_resolution_times' => [
            'critical' => 4, // hours
            'high' => 24,
            'medium' => 72,
            'low' => 168, // 1 week
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Workflow Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for automated workflows and escalations.
    |
    */
    'workflows' => [
        'enabled' => env('SUPPORT_WORKFLOWS_ENABLED', true),
        'auto_escalation' => env('SUPPORT_AUTO_ESCALATION', true),
        'escalation_threshold_hours' => env('SUPPORT_ESCALATION_THRESHOLD', 24),
    ],

    /*
    |--------------------------------------------------------------------------
    | Notification Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for email notifications and alerts.
    |
    */
    'notifications' => [
        'enabled' => env('SUPPORT_NOTIFICATIONS_ENABLED', true),
        'customer_notifications' => [
            'ticket_created' => true,
            'ticket_updated' => true,
            'ticket_resolved' => true,
            'ticket_closed' => false,
        ],
        'agent_notifications' => [
            'ticket_assigned' => true,
            'ticket_escalated' => true,
            'sla_breach_warning' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Dashboard Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for dashboard widgets and statistics.
    |
    */
    'dashboard' => [
        'default_widgets' => [
            'ticket_stats',
            'recent_tickets',
            'sla_compliance',
            'agent_performance',
            'category_breakdown',
        ],
        'refresh_interval_seconds' => 300, // 5 minutes
    ],
]; 