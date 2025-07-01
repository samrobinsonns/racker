<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\CentralAdminController;
use App\Http\Controllers\Admin\TenantController;
use App\Http\Controllers\Admin\TenantAdminController;
use App\Http\Controllers\SupportTicketsController;
use App\Http\Controllers\SupportTicketRepliesController;
use App\Http\Controllers\SupportTicketAttachmentsController;
use App\Http\Controllers\TenantAdmin\SupportTicketCategoriesController;
use App\Http\Controllers\TenantAdmin\SupportTicketSettingsController;
use App\Http\Controllers\TenantAdmin\SupportTicketAnalyticsController;
use App\Http\Controllers\TenantAdmin\SupportTicketsController as TenantAdminSupportTicketsController;
use App\Enums\Permission;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use Inertia\Inertia;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\ContactCustomFieldController;
use App\Http\Controllers\ContactTagController;
use App\Http\Controllers\ContactNoteController;
use App\Http\Controllers\ContactAddressController;
use App\Http\Controllers\ContactPreferenceController;
use App\Http\Controllers\ContactImportExportController;
use App\Http\Controllers\Api\ContactSearchController;
use App\Http\Controllers\Profile\AvatarController;
use App\Http\Controllers\Profile\BackgroundImageController;
use App\Http\Controllers\TenantAdmin\EmailSettingsController;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;

// Public routes for the central domain
Route::middleware(['web'])->group(function () {
    // Serve Homepage at root URL
    Route::get('/', function () {
        return Inertia::render('Homepage', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
        ]);
    });
});

Route::get('/dashboard', function () {
    $user = auth()->user();
    $stats = [];
    $tenantId = null;
    $layoutType = 'authenticated'; // Default layout
    
    // Determine layout and stats based on user type
    if ($user->is_central_admin) {
        // Central Admin stats and layout
        $controller = app(CentralAdminController::class);
        $stats = $controller->getDashboardStats();
        $layoutType = 'central_admin';
    } elseif ($user->tenant_id) {
        // All Tenant Users (including admins) - user-focused dashboard
        $tenantId = $user->tenant_id;
        $tenant = $user->tenant;
        $layoutType = 'tenant_user';
        $stats = [
            'tenant_id' => $tenantId,
            'tenant_name' => $tenant?->name ?? 'Your Organization',
            'user_activities' => rand(5, 25), // Placeholder for future implementation
            'user_messages' => rand(0, 8),   // Placeholder for future implementation
            'user_reports' => rand(2, 12),    // Placeholder for future implementation
        ];
    }
    
    return Inertia::render('Dashboard', compact('stats', 'tenantId', 'layoutType'));
})->middleware(['auth', 'verified', 'permission:' . Permission::VIEW_DASHBOARD])->name('dashboard');

// Central Admin Routes - now with granular permissions
Route::prefix('central-admin')->name('central-admin.')->middleware(['auth', 'central.admin'])->group(function () {
    // Tenant Management
    Route::get('/tenants', [CentralAdminController::class, 'tenants'])
        ->middleware('permission:' . Permission::MANAGE_TENANTS)
        ->name('tenants.index');
    
    // User Management
    Route::get('/users', [CentralAdminController::class, 'users'])
        ->middleware('permission.any:' . Permission::MANAGE_CENTRAL_USERS . ',' . Permission::MANAGE_TENANT_USERS)
        ->name('users.index');
    Route::get('/users/create', [CentralAdminController::class, 'createUser'])
        ->middleware('permission.any:' . Permission::MANAGE_CENTRAL_USERS . ',' . Permission::MANAGE_TENANT_USERS)
        ->name('users.create');
    Route::post('/users', [CentralAdminController::class, 'storeUser'])
        ->middleware('permission.any:' . Permission::MANAGE_CENTRAL_USERS . ',' . Permission::MANAGE_TENANT_USERS)
        ->name('users.store');
    Route::get('/users/{user}/edit', [CentralAdminController::class, 'editUser'])
        ->middleware('permission.any:' . Permission::MANAGE_CENTRAL_USERS . ',' . Permission::MANAGE_TENANT_USERS)
        ->name('users.edit');
    Route::put('/users/{user}', [CentralAdminController::class, 'updateUser'])
        ->middleware('permission.any:' . Permission::MANAGE_CENTRAL_USERS . ',' . Permission::MANAGE_TENANT_USERS)
        ->name('users.update');
    Route::delete('/users/{user}', [CentralAdminController::class, 'destroyUser'])
        ->middleware('permission.any:' . Permission::MANAGE_CENTRAL_USERS . ',' . Permission::MANAGE_TENANT_USERS)
        ->name('users.destroy');
    
    // Settings
    Route::get('/settings', [CentralAdminController::class, 'settings'])
        ->middleware('permission:' . Permission::MANAGE_SYSTEM_SETTINGS)
        ->name('settings');
    Route::patch('/settings', [CentralAdminController::class, 'updateSettings'])
        ->middleware('permission:' . Permission::MANAGE_SYSTEM_SETTINGS)
        ->name('settings.update');
    
    // Role Management
    Route::post('/roles', [CentralAdminController::class, 'storeRole'])
        ->middleware('permission:' . Permission::MANAGE_USER_ROLES)
        ->name('roles.store');
    Route::patch('/roles/{role}', [CentralAdminController::class, 'updateRole'])
        ->middleware('permission:' . Permission::MANAGE_USER_ROLES)
        ->name('roles.update');
    Route::delete('/roles/{role}', [CentralAdminController::class, 'destroyRole'])
        ->middleware('permission:' . Permission::MANAGE_USER_ROLES)
        ->name('roles.destroy');
    
    // Permission Management
    Route::post('/permissions', [CentralAdminController::class, 'storePermission'])
        ->middleware('permission:' . Permission::MANAGE_SYSTEM_SETTINGS)
        ->name('permissions.store');
    
    // Tenant Management
    Route::resource('tenants', TenantController::class)->except(['show'])
        ->middleware('permission:' . Permission::MANAGE_TENANTS);
    Route::get('/tenants/{tenant}', [TenantController::class, 'show'])
        ->middleware('permission:' . Permission::VIEW_TENANT_DATA)
        ->name('tenants.show');
    
    // Navigation Builder
    Route::prefix('navigation')->name('navigation.')->middleware('permission:' . Permission::MANAGE_SYSTEM_SETTINGS)->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\NavigationController::class, 'index'])->name('index');
        Route::get('/builder', [\App\Http\Controllers\Admin\NavigationController::class, 'builder'])->name('builder');
        Route::post('/configurations', [\App\Http\Controllers\Admin\NavigationController::class, 'store'])->name('store');
        Route::get('/configurations/{configuration}', [\App\Http\Controllers\Admin\NavigationController::class, 'show'])->name('show');
        Route::put('/configurations/{configuration}', [\App\Http\Controllers\Admin\NavigationController::class, 'update'])->name('update');
        Route::delete('/configurations/{configuration}', [\App\Http\Controllers\Admin\NavigationController::class, 'destroy'])->name('destroy');
        Route::post('/configurations/{configuration}/activate', [\App\Http\Controllers\Admin\NavigationController::class, 'activate'])->name('activate');
        Route::post('/configurations/{configuration}/duplicate', [\App\Http\Controllers\Admin\NavigationController::class, 'duplicate'])->name('duplicate');
        Route::post('/preview', [\App\Http\Controllers\Admin\NavigationController::class, 'preview'])->name('preview');
        Route::post('/current', [\App\Http\Controllers\Admin\NavigationController::class, 'getCurrent'])->name('current');
        
        // Navigation Items Management
        Route::get('/items', [\App\Http\Controllers\Admin\NavigationItemsController::class, 'index'])->name('items.index');
        Route::post('/items', [\App\Http\Controllers\Admin\NavigationItemsController::class, 'store'])->name('items.store');
        Route::put('/items/{item}', [\App\Http\Controllers\Admin\NavigationItemsController::class, 'update'])->name('items.update');
        Route::delete('/items/{item}', [\App\Http\Controllers\Admin\NavigationItemsController::class, 'destroy'])->name('items.destroy');
        Route::post('/items/{item}/generate-page', [\App\Http\Controllers\Admin\NavigationItemsController::class, 'generatePage'])->name('items.generate-page');
        Route::get('/permissions', [\App\Http\Controllers\Admin\NavigationItemsController::class, 'permissions'])->name('permissions');
    });
});

// Tenant Admin Routes - now with granular permissions
Route::middleware(['auth', 'verified', 'tenant.admin'])->prefix('tenant-admin')->name('tenant-admin.')->group(function () {
    Route::get('/dashboard', [TenantAdminController::class, 'dashboard'])
        ->middleware('permission:' . Permission::MANAGE_TENANT_USERS)
        ->name('dashboard');
        
    Route::get('/settings', [TenantAdminController::class, 'settings'])
        ->middleware('permission:' . Permission::MANAGE_TENANT_SETTINGS)
        ->name('settings');
    
    // User Management within Tenant
    Route::get('/users', [TenantAdminController::class, 'users'])
        ->middleware('permission:' . Permission::MANAGE_TENANT_USERS)
        ->name('users.index');
    Route::get('/users/create', [TenantAdminController::class, 'createUser'])
        ->middleware('permission:' . Permission::MANAGE_TENANT_USERS)
        ->name('users.create');
    Route::post('/users', [TenantAdminController::class, 'storeUser'])
        ->middleware('permission:' . Permission::MANAGE_TENANT_USERS)
        ->name('users.store');
    Route::put('/users/{user}', [TenantAdminController::class, 'updateUser'])
        ->middleware('permission:' . Permission::MANAGE_TENANT_USERS)
        ->name('users.update');
    Route::delete('/users/{user}', [TenantAdminController::class, 'destroyUser'])
        ->middleware('permission:' . Permission::MANAGE_TENANT_USERS)
        ->name('users.destroy');

    // Email Settings Management
    Route::prefix('email-settings')->name('email-settings.')->middleware('permission:' . Permission::MANAGE_TENANT_SETTINGS)->group(function () {
        Route::get('/', [EmailSettingsController::class, 'index'])->name('index');
        Route::post('/', [EmailSettingsController::class, 'store'])->name('store');
        Route::post('/test', [EmailSettingsController::class, 'test'])->name('test');
    });

    // Support Ticket Management
    Route::prefix('support-tickets')->name('support-tickets.')->group(function () {
        // Main Support Tickets Management
        Route::get('/', [TenantAdminSupportTicketsController::class, 'index'])
            ->middleware('permission:' . Permission::MANAGE_TENANT_USERS)
            ->name('index');
        
        // Categories Management
        Route::get('/categories', [SupportTicketCategoriesController::class, 'index'])
            ->middleware('permission:' . Permission::CONFIGURE_SUPPORT_TICKETS)
            ->name('categories');
        Route::post('/categories', [SupportTicketCategoriesController::class, 'store'])
            ->middleware('permission:' . Permission::CONFIGURE_SUPPORT_TICKETS)
            ->name('categories.store');
        Route::get('/categories/create', [SupportTicketCategoriesController::class, 'create'])
            ->middleware('permission:' . Permission::CONFIGURE_SUPPORT_TICKETS)
            ->name('categories.create');
        Route::get('/categories/{category}/edit', [SupportTicketCategoriesController::class, 'edit'])
            ->middleware('permission:' . Permission::CONFIGURE_SUPPORT_TICKETS)
            ->name('categories.edit');
        Route::put('/categories/{category}', [SupportTicketCategoriesController::class, 'update'])
            ->middleware('permission:' . Permission::CONFIGURE_SUPPORT_TICKETS)
            ->name('categories.update');
        Route::delete('/categories/{category}', [SupportTicketCategoriesController::class, 'destroy'])
            ->middleware('permission:' . Permission::CONFIGURE_SUPPORT_TICKETS)
            ->name('categories.destroy');
        
        // Settings Management
        Route::get('/settings', [SupportTicketSettingsController::class, 'index'])
            ->middleware('permission:' . Permission::CONFIGURE_SUPPORT_TICKETS)
            ->name('settings');
        Route::put('/settings', [SupportTicketSettingsController::class, 'update'])
            ->middleware('permission:' . Permission::CONFIGURE_SUPPORT_TICKETS)
            ->name('settings.update');

        // Analytics
        Route::get('/analytics', [SupportTicketAnalyticsController::class, 'index'])
            ->middleware('permission:' . Permission::CONFIGURE_SUPPORT_TICKETS)
            ->name('analytics');
    });
});

// Tenant User Routes - for regular tenant users
Route::prefix('tenant')->name('tenant.')->middleware(['auth', 'tenant'])->group(function () {
    Route::get('/reports', function () {
        $user = auth()->user();
        $tenant = $user->tenant;
        
        return Inertia::render('Tenant/Reports', [
            'pageTitle' => 'Reports',
            'stats' => [
                'tenant_id' => $user->tenant_id,
                'tenant_name' => $tenant?->name ?? 'Your Organization',
            ],
        ]);
    })->middleware('permission:' . Permission::VIEW_REPORTS)->name('reports');
    
    Route::get('/content', function () {
        $user = auth()->user();
        $tenant = $user->tenant;
        
        return Inertia::render('Tenant/Content', [
            'pageTitle' => 'Content',
            'stats' => [
                'tenant_id' => $user->tenant_id,
                'tenant_name' => $tenant?->name ?? 'Your Organization',
            ],
        ]);
    })->middleware('permission:' . Permission::VIEW_TENANT_DATA)->name('content');
    
    Route::get('/analytics', function () {
        $user = auth()->user();
        $tenant = $user->tenant;
        
        return Inertia::render('Tenant/Analytics', [
            'pageTitle' => 'Analytics',
            'stats' => [
                'tenant_id' => $user->tenant_id,
                'tenant_name' => $tenant?->name ?? 'Your Organization',
            ],
        ]);
    })->middleware('permission:' . Permission::VIEW_TENANT_ANALYTICS)->name('analytics');

    // Contacts Routes
    Route::prefix('contacts')->name('contacts.')->group(function () {
        Route::get('/', [App\Http\Controllers\Tenant\ContactController::class, 'index'])->name('index');
        Route::get('/create', [App\Http\Controllers\Tenant\ContactController::class, 'create'])->name('create');
        Route::post('/', [App\Http\Controllers\Tenant\ContactController::class, 'store'])->name('store');
        Route::get('/search', [App\Http\Controllers\Tenant\ContactController::class, 'search'])->name('search');
        Route::get('/{contact}', [App\Http\Controllers\Tenant\ContactController::class, 'show'])->name('show');
        Route::get('/{contact}/edit', [App\Http\Controllers\Tenant\ContactController::class, 'edit'])->name('edit');
        Route::put('/{contact}', [App\Http\Controllers\Tenant\ContactController::class, 'update'])->name('update');
        Route::delete('/{contact}', [App\Http\Controllers\Tenant\ContactController::class, 'destroy'])->name('destroy');
    });
});

// Support Tickets Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('support-tickets', SupportTicketsController::class)->middleware([
        'index' => 'permission:' . Permission::VIEW_SUPPORT_TICKETS,
        'create' => 'permission:' . Permission::CREATE_SUPPORT_TICKETS,
        'store' => 'permission:' . Permission::CREATE_SUPPORT_TICKETS,
        'show' => 'permission:' . Permission::VIEW_SUPPORT_TICKETS,
        'edit' => 'permission:' . Permission::MANAGE_SUPPORT_TICKETS,
        'update' => 'permission:' . Permission::MANAGE_SUPPORT_TICKETS,
        'destroy' => 'permission:' . Permission::MANAGE_SUPPORT_TICKETS,
    ]);
    
    Route::post('support-tickets/{supportTicket}/assign', [SupportTicketsController::class, 'assign'])
        ->middleware('permission:' . Permission::ASSIGN_SUPPORT_TICKETS)
        ->name('support-tickets.assign');
    
    Route::post('support-tickets/{supportTicket}/status', [SupportTicketsController::class, 'changeStatus'])
        ->middleware('permission:' . Permission::MANAGE_SUPPORT_TICKETS)
        ->name('support-tickets.status');
    
    Route::post('support-tickets/{supportTicket}/escalate', [SupportTicketsController::class, 'escalate'])
        ->middleware('permission:' . Permission::ESCALATE_SUPPORT_TICKETS)
        ->name('support-tickets.escalate');
    
    // Support Ticket Replies
    Route::resource('support-tickets.replies', SupportTicketRepliesController::class)
        ->middleware([
            'store' => 'permission:' . Permission::VIEW_SUPPORT_TICKETS,
            'update' => 'permission:' . Permission::MANAGE_SUPPORT_TICKETS,
            'destroy' => 'permission:' . Permission::MANAGE_SUPPORT_TICKETS,
        ])
        ->shallow();
    
    // Support Ticket Attachments
    Route::resource('support-tickets.attachments', SupportTicketAttachmentsController::class)
        ->middleware([
            'store' => 'permission:' . Permission::VIEW_SUPPORT_TICKETS,
            'destroy' => 'permission:' . Permission::MANAGE_SUPPORT_TICKETS,
        ])
        ->only(['store', 'destroy'])
        ->shallow();
    
    Route::get('attachments/{attachment}/download', [SupportTicketAttachmentsController::class, 'download'])
        ->middleware('permission:' . Permission::VIEW_SUPPORT_TICKETS)
        ->name('attachments.download');
});

// Messaging API Routes
Route::prefix('api/messaging')->middleware(['auth'])->group(function () {
    // Conversations
    Route::get('/conversations', [App\Http\Controllers\ConversationController::class, 'index']);
    Route::post('/conversations', [App\Http\Controllers\ConversationController::class, 'store']);
    Route::get('/conversations/{conversation}', [App\Http\Controllers\ConversationController::class, 'show']);
    Route::delete('/conversations/{conversation}', [App\Http\Controllers\ConversationController::class, 'destroy']);
    
    // Messages
    Route::get('/conversations/{conversation}/messages', [App\Http\Controllers\MessageController::class, 'index']);
    Route::post('/conversations/{conversation}/messages', [App\Http\Controllers\MessageController::class, 'store']);
    
    // Typing Indicators
    Route::post('/conversations/{conversation}/typing', [App\Http\Controllers\TypingController::class, 'typing']);
    Route::post('/conversations/{conversation}/stop-typing', [App\Http\Controllers\TypingController::class, 'stopTyping']);
});

// Users API for messaging
Route::get('/api/users', [\App\Http\Controllers\UsersApiController::class, 'index'])
    ->middleware(['auth', 'permission:' . Permission::VIEW_TENANT_DATA])
    ->name('api.users.index');

// Messages Route - accessible to all authenticated users
Route::get('/messages', function () {
    $user = auth()->user();
    $tenant = $user->tenant;
    
    return Inertia::render('Messages', [
        'tenantId' => $user->tenant_id,
        'tenant' => $tenant,
        'stats' => [
            'tenant_id' => $user->tenant_id,
            'tenant_name' => $tenant?->name ?? 'Your Organization',
        ],
    ]);
})->middleware(['auth', 'verified'])->name('messages');

// Regular authenticated user routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/profile/activities', [ProfileController::class, 'activities'])->name('profile.activities');
    Route::get('/profile/{user}', [ProfileController::class, 'show'])->name('profile.show');
    
    // Avatar routes
    Route::post('/profile/avatar', [AvatarController::class, 'store'])->name('profile.avatar.store');
    Route::delete('/profile/avatar', [AvatarController::class, 'destroy'])->name('profile.avatar.destroy');

    // Background image routes
    Route::post('/profile/background', [BackgroundImageController::class, 'store'])->name('profile.background.store');
    Route::delete('/profile/background', [BackgroundImageController::class, 'destroy'])->name('profile.background.destroy');
});

require __DIR__.'/auth.php';

// Broadcasting Auth Routes
Broadcast::routes(['middleware' => ['auth']]);

// Include dynamic routes generated by PageTemplateService
if (file_exists(__DIR__ . '/dynamic.php')) {
    require __DIR__ . '/dynamic.php';
}

// Contact Management Routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Main contact routes
    Route::resource('contacts', ContactController::class);
    Route::post('/contacts/import', [ContactImportExportController::class, 'import'])
        ->name('contact.import');
    Route::get('/contacts/export', [ContactImportExportController::class, 'export'])
        ->name('contact.export');
    Route::get('/contacts/import/template', [ContactImportExportController::class, 'template'])
        ->name('contact.import.template');

    // Custom fields routes
    Route::resource('contact-custom-fields', ContactCustomFieldController::class)->except(['create', 'edit', 'show']);
    Route::post('contact-custom-fields/reorder', [ContactCustomFieldController::class, 'reorder'])->name('contact-custom-fields.reorder');

    // Tags routes
    Route::resource('contact-tags', ContactTagController::class)->except(['create', 'edit', 'show']);
    Route::get('contact-tags/search', [ContactTagController::class, 'search'])->name('contact-tags.search');
    Route::get('contact-tags/popular', [ContactTagController::class, 'popular'])->name('contact-tags.popular');

    // Contact Notes
    Route::post('/contacts/{contact}/notes', [ContactNoteController::class, 'store'])->name('contact.notes.store');
    Route::patch('/contacts/notes/{note}', [ContactNoteController::class, 'update'])->name('contact.notes.update');
    Route::delete('/contacts/notes/{note}', [ContactNoteController::class, 'destroy'])->name('contact.notes.destroy');

    // Contact Addresses
    Route::post('/contacts/{contact}/addresses', [ContactAddressController::class, 'store'])->name('contact.addresses.store');
    Route::patch('/contacts/addresses/{address}', [ContactAddressController::class, 'update'])->name('contact.addresses.update');
    Route::delete('/contacts/addresses/{address}', [ContactAddressController::class, 'destroy'])->name('contact.addresses.destroy');

    // Contact Communication Preferences
    Route::patch('/contacts/{contact}/preferences', [ContactPreferenceController::class, 'update'])
        ->name('contact.preferences.update');
    Route::get('/contacts/{contact}/preferences/history', [ContactPreferenceController::class, 'history'])
        ->name('contact.preferences.history');
    Route::post('/contacts/{contact}/preferences/opt-out', [ContactPreferenceController::class, 'optOut'])
        ->name('contact.preferences.opt-out');
});
