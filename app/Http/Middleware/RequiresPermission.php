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
            return redirect()->route('login');
        }

        $user = auth()->user();
        
        // Extract tenant ID from route if not provided
        if (!$tenantId && $request->route('tenant')) {
            $tenantId = $request->route('tenant');
        }

        if (!$this->permissionService->userHasPermission($user, $permission, $tenantId)) {
            // Log permission violation
            $this->permissionService->logPermissionCheck($user, $permission, false, $tenantId);
            
            abort(403, "Access denied. Required permission: {$permission}");
        }

        // Log successful permission check
        $this->permissionService->logPermissionCheck($user, $permission, true, $tenantId);

        return $next($request);
    }
} 