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

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
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
    Route::get('/users/{user}/edit', [TenantAdminController::class, 'editUser'])
        ->middleware('permission:' . Permission::MANAGE_TENANT_USERS)
        ->name('users.edit');
    Route::put('/users/{user}', [TenantAdminController::class, 'updateUser'])
        ->middleware('permission:' . Permission::MANAGE_TENANT_USERS)
        ->name('users.update');
    Route::delete('/users/{user}', [TenantAdminController::class, 'destroyUser'])
        ->middleware('permission:' . Permission::MANAGE_TENANT_USERS)
        ->name('users.destroy');

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
Route::prefix('tenant')->name('tenant.')->middleware(['auth'])->group(function () {
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
    return Inertia::render('Messages');
})->middleware(['auth', 'verified'])->name('messages');

// Regular authenticated user routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])
        ->middleware('permission:' . Permission::MANAGE_OWN_PROFILE)
        ->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])
        ->middleware('permission:' . Permission::MANAGE_OWN_PROFILE)
        ->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])
        ->middleware('permission:' . Permission::MANAGE_OWN_PROFILE)
        ->name('profile.destroy');
});

require __DIR__.'/auth.php';

// Broadcasting Auth Routes
Broadcast::routes(['middleware' => ['auth']]);

// Include dynamic routes generated by PageTemplateService
if (file_exists(__DIR__ . '/dynamic.php')) {
    require __DIR__ . '/dynamic.php';
}
