<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Route Discovery
    |--------------------------------------------------------------------------
    |
    | When enabled, the Navigation Builder will automatically discover
    | available routes and make them available as navigation items.
    | This is useful for development and dynamic environments.
    |
    */
    'enable_route_discovery' => env('NAVIGATION_ENABLE_ROUTE_DISCOVERY', false),

    /*
    |--------------------------------------------------------------------------
    | Cache Settings
    |--------------------------------------------------------------------------
    |
    | Navigation configurations are cached for performance. You can
    | adjust the cache TTL here (in seconds).
    |
    */
    'cache_ttl' => env('NAVIGATION_CACHE_TTL', 3600), // 1 hour

    /*
    |--------------------------------------------------------------------------
    | Auto-Discovery Filters
    |--------------------------------------------------------------------------
    |
    | Configure which routes should be excluded from auto-discovery.
    | Patterns support Laravel's Str::is() wildcard matching.
    |
    */
    'discovery_exclude_patterns' => [
        'auth.*',
        'password.*',
        'verification.*',
        'sanctum.*',
        'horizon.*',
        'telescope.*',
        'debugbar.*',
        '_debugbar.*',
        'ignition.*',
        '*.store',
        '*.update',
        '*.destroy',
        '*.api.*',
        '*.ajax.*',
        '*.callback',
        '*.webhook',
    ],

    /*
    |--------------------------------------------------------------------------
    | Icon Mapping
    |--------------------------------------------------------------------------
    |
    | Map route keywords to Heroicon names for automatic icon suggestions.
    |
    */
    'icon_mapping' => [
        'dashboard' => 'HomeIcon',
        'home' => 'HomeIcon',
        'user' => 'UserIcon',
        'users' => 'UsersIcon',
        'profile' => 'UserCircleIcon',
        'account' => 'UserCircleIcon',
        'analytic' => 'ChartPieIcon',
        'report' => 'ChartBarIcon',
        'metric' => 'ChartLineIcon',
        'stat' => 'ChartBarIcon',
        'content' => 'DocumentTextIcon',
        'document' => 'DocumentIcon',
        'file' => 'DocumentIcon',
        'page' => 'DocumentTextIcon',
        'setting' => 'Cog6ToothIcon',
        'config' => 'Cog6ToothIcon',
        'preference' => 'AdjustmentsHorizontalIcon',
        'inventory' => 'CubeIcon',
        'product' => 'ShoppingBagIcon',
        'item' => 'CubeIcon',
        'resource' => 'CubeIcon',
        'sale' => 'CurrencyDollarIcon',
        'order' => 'ShoppingCartIcon',
        'payment' => 'CreditCardIcon',
        'invoice' => 'DocumentTextIcon',
        'message' => 'ChatBubbleLeftIcon',
        'notification' => 'BellIcon',
        'email' => 'EnvelopeIcon',
        'tenant' => 'BuildingOffice2Icon',
        'admin' => 'ShieldCheckIcon',
        'system' => 'CpuChipIcon',
        'log' => 'DocumentTextIcon',
    ],

    /*
    |--------------------------------------------------------------------------
    | Permission Mapping
    |--------------------------------------------------------------------------
    |
    | Map route keywords to permission constants for automatic permission
    | suggestions during route discovery.
    |
    */
    'permission_mapping' => [
        'admin' => 'MANAGE_TENANT_USERS',
        'manage' => 'MANAGE_TENANT_USERS',
        'users' => 'MANAGE_TENANT_USERS',
        'settings' => 'MANAGE_TENANT_SETTINGS',
        'analytics' => 'VIEW_TENANT_ANALYTICS',
        'reports' => 'VIEW_TENANT_ANALYTICS',
        'content' => 'VIEW_TENANT_DATA',
        'dashboard' => 'VIEW_DASHBOARD',
    ],
]; 