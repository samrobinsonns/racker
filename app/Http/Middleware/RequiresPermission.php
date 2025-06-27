<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\PermissionService;

class RequiresPermission
{
    protected PermissionService $permissionService;

    public function __construct(PermissionService $permissionService)
    {
        $this->permissionService = $permissionService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $permission
     * @param  string|null  $tenantId
     */
    public function handle(Request $request, Closure $next, string $permission, ?string $tenantId = null): Response
    {
        if (!auth()->check()) {
            \Log::debug('RequiresPermission: User not authenticated');
            return redirect()->route('login');
        }

        $user = auth()->user();
        \Log::debug('RequiresPermission: Checking permission', [
            'user_id' => $user->id,
            'email' => $user->email,
            'permission' => $permission,
            'tenant_id' => $user->tenant_id,
            'is_central_admin' => $user->is_central_admin
        ]);
        
        // Get tenant ID from user, session, or route
        $tenantId = $tenantId ?? $user->tenant_id ?? session('impersonated_tenant_id');
        
        // If still no tenant ID and route has tenant parameter, use that
        if (!$tenantId && $request->route('tenant')) {
            $tenantId = $request->route('tenant');
        }

        \Log::debug('RequiresPermission: Resolved tenant ID', [
            'tenant_id' => $tenantId,
            'from_session' => session('impersonated_tenant_id'),
            'from_route' => $request->route('tenant')
        ]);

        $hasPermission = $this->permissionService->userHasPermission($user, $permission, $tenantId);
        \Log::debug('RequiresPermission: Permission check result', [
            'has_permission' => $hasPermission,
            'roles' => $user->rolesForTenant($tenantId)->get()->pluck('name'),
            'all_permissions' => $this->permissionService->getUserPermissions($user, $tenantId)
        ]);

        if (!$hasPermission) {
            // Log permission violation
            $this->permissionService->logPermissionCheck($user, $permission, false, $tenantId);
            
            abort(403, "Access denied. Required permission: {$permission}");
        }

        // Log successful permission check
        $this->permissionService->logPermissionCheck($user, $permission, true, $tenantId);

        return $next($request);
    }
} 