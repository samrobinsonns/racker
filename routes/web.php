<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\CentralAdminController;
use App\Http\Controllers\Admin\TenantController;
use App\Http\Controllers\Admin\TenantAdminController;
use App\Enums\Permission;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
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
    } elseif ($user->hasRole('tenant_admin')) {
        // Tenant Admin stats and layout
        $controller = app(TenantAdminController::class);
        $stats = $controller->getDashboardStats();
        $tenantId = $stats['tenant_id'] ?? $user->tenant_id;
        $layoutType = 'tenant_admin';
    } elseif ($user->tenant_id) {
        // Tenant User - use tenant layout with appropriate navigation
        $tenantId = $user->tenant_id;
        $tenant = $user->tenant;
        $layoutType = 'tenant_user';
        $stats = [
            'tenant_id' => $tenantId,
            'tenant_name' => $tenant?->name ?? 'Your Organization',
            'user_activities' => 0, // Placeholder for future implementation
            'user_messages' => 0,   // Placeholder for future implementation
            'user_reports' => 0,    // Placeholder for future implementation
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
Route::prefix('tenant-admin')->name('tenant-admin.')->middleware(['auth', 'tenant.admin'])->group(function () {
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
});

// Tenant User Routes - for regular tenant users
Route::prefix('tenant')->name('tenant.')->middleware(['auth'])->group(function () {
    Route::get('/reports', function () {
        return Inertia::render('Tenant/Reports', [
            'pageTitle' => 'Reports'
        ]);
    })->middleware('permission:' . Permission::VIEW_REPORTS)->name('reports');
    
    Route::get('/content', function () {
        return Inertia::render('Tenant/Content', [
            'pageTitle' => 'Content'
        ]);
    })->middleware('permission:' . Permission::VIEW_TENANT_DATA)->name('content');
    
    Route::get('/analytics', function () {
        return Inertia::render('Tenant/Analytics', [
            'pageTitle' => 'Analytics'
        ]);
    })->middleware('permission:' . Permission::VIEW_TENANT_ANALYTICS)->name('analytics');
});

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

// Include dynamic routes generated by PageTemplateService
if (file_exists(__DIR__ . '/dynamic.php')) {
    require __DIR__ . '/dynamic.php';
}
