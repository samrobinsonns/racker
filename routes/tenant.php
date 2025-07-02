<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;
use App\Http\Controllers\Tenant\TenantNavigationController;
use App\Enums\Permission;
use App\Http\Controllers\TenantAdmin\RoleController;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| Here you can register the tenant routes for your application.
| These routes are loaded by the TenantRouteServiceProvider.
|
| Feel free to customize them however you want. Good luck!
|
*/

Route::middleware([
    'web',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {
    Route::get('/', function () {
        return Inertia::render('Tenant/Welcome', [
            'tenant' => [
                'id' => tenant('id'),
                'name' => tenant()->name ?? 'Your Organization'
            ]
        ]);
    });

    // Tenant Navigation Builder Routes
    Route::middleware(['auth', 'permission:' . Permission::MANAGE_TENANT_SETTINGS])->group(function () {
        Route::get('/navigation/builder', [TenantNavigationController::class, 'builder'])
            ->name('navigation.builder');
        Route::post('/navigation', [TenantNavigationController::class, 'store'])
            ->name('navigation.store');
        Route::delete('/navigation/{configuration}', [TenantNavigationController::class, 'destroy'])
            ->name('navigation.destroy');
    });

    // Role Management Routes
    Route::prefix('tenant-admin')->name('tenant-admin.')->middleware(['auth', 'verified'])->group(function () {
        Route::post('/roles', [RoleController::class, 'store'])->name('roles.store');
        Route::patch('/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
        Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
    });
});
