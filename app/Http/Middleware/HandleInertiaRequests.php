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
        $userWithPermissions = null;
        
        if ($user) {
            $userWithPermissions = $user->load('roles');
            // Add user permissions to the frontend
            $permissionService = app(PermissionService::class);
            $userWithPermissions->permissions = $permissionService->getUserPermissions($user);
            $userWithPermissions->layout_type = $user->getLayoutType();
            $userWithPermissions->admin_level = $user->getAdminLevel();
            // Add navigation items to the frontend
            $userWithPermissions->navigation_items = $user->getNavigationItems();
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $userWithPermissions,
            ],
        ];
    }
}
