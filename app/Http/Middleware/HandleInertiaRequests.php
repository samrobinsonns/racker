<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Services\PermissionService;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $tenant = $user?->tenant;
        
        if ($user) {
            $user->load('roles');
            // Add user permissions to the frontend
            $permissionService = app(PermissionService::class);
            $userPermissions = $permissionService->getUserPermissions($user);
            $layoutType = $user->getLayoutType();
            $adminLevel = $user->getAdminLevel();
            // Add navigation items to the frontend
            $navigationItems = $user->getNavigationItems();
            // Add navigation branding for tenant users
            $navigationBranding = !$user->is_central_admin && $user->tenant_id ? $user->getNavigationBranding() : null;
        }
        
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'tenant_id' => $user->tenant_id,
                    'is_central_admin' => $user->is_central_admin,
                    'admin_level' => $adminLevel ?? null,
                    'permissions' => $userPermissions ?? [],
                    'layout_type' => $layoutType ?? null,
                    'navigation_items' => $navigationItems ?? [],
                    'navigation_branding' => $navigationBranding ?? null,
                ] : null,
            ],
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'tenantId' => $user?->tenant_id ?? session('impersonated_tenant_id'),
            'tenant' => $tenant,
            'stats' => [
                'tenant_id' => $user?->tenant_id ?? session('impersonated_tenant_id'),
                'tenant_name' => $tenant?->name ?? 'Your Organization',
            ],
        ]);
    }
}
