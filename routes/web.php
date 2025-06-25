<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\CentralAdminController;
use App\Http\Controllers\Admin\TenantController;
use App\Http\Controllers\Admin\TenantAdminController;
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
    
    // Redirect based on user type
    if ($user->is_central_admin) {
        return redirect()->route('central-admin.dashboard');
    } elseif ($user->hasRole('tenant_admin')) {
        return redirect()->route('tenant-admin.dashboard');
    }
    
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Central Admin Routes
Route::prefix('central-admin')->name('central-admin.')->middleware(['auth', 'central.admin'])->group(function () {
    Route::get('/dashboard', [CentralAdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/tenants', [CentralAdminController::class, 'tenants'])->name('tenants.index');
    Route::get('/users', [CentralAdminController::class, 'users'])->name('users.index');
    Route::get('/users/create', [CentralAdminController::class, 'createUser'])->name('users.create');
    Route::post('/users', [CentralAdminController::class, 'storeUser'])->name('users.store');
    Route::get('/users/{user}/edit', [CentralAdminController::class, 'editUser'])->name('users.edit');
    Route::put('/users/{user}', [CentralAdminController::class, 'updateUser'])->name('users.update');
    Route::delete('/users/{user}', [CentralAdminController::class, 'destroyUser'])->name('users.destroy');
    Route::get('/settings', [CentralAdminController::class, 'settings'])->name('settings');
    Route::patch('/settings', [CentralAdminController::class, 'updateSettings'])->name('settings.update');
    
    // Tenant Management
    Route::resource('tenants', TenantController::class)->except(['show']);
    Route::get('/tenants/{tenant}', [TenantController::class, 'show'])->name('tenants.show');
});

// Tenant Admin Routes
Route::prefix('tenant-admin')->name('tenant-admin.')->middleware(['auth', 'tenant.admin'])->group(function () {
    Route::get('/dashboard', [TenantAdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/settings', [TenantAdminController::class, 'settings'])->name('settings');
    
    // User Management within Tenant
    Route::get('/users', [TenantAdminController::class, 'users'])->name('users.index');
    Route::get('/users/create', [TenantAdminController::class, 'createUser'])->name('users.create');
    Route::post('/users', [TenantAdminController::class, 'storeUser'])->name('users.store');
    Route::get('/users/{user}/edit', [TenantAdminController::class, 'editUser'])->name('users.edit');
    Route::put('/users/{user}', [TenantAdminController::class, 'updateUser'])->name('users.update');
    Route::delete('/users/{user}', [TenantAdminController::class, 'destroyUser'])->name('users.destroy');
});

// Regular authenticated user routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
