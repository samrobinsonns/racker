<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\PermissionService;

class RequiresAnyPermission
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
     * @param  string  ...$permissions
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        if (!auth()->check()) {
            return redirect()->route('login');
        }

        $user = auth()->user();
        $tenantId = $request->route('tenant') ?? $user->tenant_id;

        if (!$this->permissionService->userHasAnyPermission($user, $permissions, $tenantId)) {
            $permissionList = implode(', ', $permissions);
            abort(403, "Access denied. Required one of: {$permissionList}");
        }

        return $next($request);
    }
} 