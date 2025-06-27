<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            \Log::debug('EnsureTenantAdmin: User not authenticated');
            return redirect()->route('login');
        }

        $user = auth()->user();
        \Log::debug('EnsureTenantAdmin: Checking tenant admin access', [
            'user_id' => $user->id,
            'email' => $user->email,
            'tenant_id' => $user->tenant_id,
            'is_central_admin' => $user->is_central_admin
        ]);

        // Central admins can access any tenant admin area
        if ($user->is_central_admin) {
            \Log::debug('EnsureTenantAdmin: User is central admin, access granted');
            return $next($request);
        }

        // Get tenant ID from user or session
        $tenantId = $user->tenant_id ?? session('impersonated_tenant_id');
        \Log::debug('EnsureTenantAdmin: Resolved tenant ID', [
            'tenant_id' => $tenantId,
            'from_session' => session('impersonated_tenant_id')
        ]);

        // Check if user has tenant admin role for this tenant
        $hasTenantAdminRole = $user->hasRole('tenant_admin', $tenantId);
        $roles = $user->rolesForTenant($tenantId)->get()->pluck('name');
        \Log::debug('EnsureTenantAdmin: Role check result', [
            'has_tenant_admin_role' => $hasTenantAdminRole,
            'all_roles' => $roles
        ]);

        if (!$hasTenantAdminRole) {
            abort(403, 'Access denied. Tenant admin privileges required.');
        }

        return $next($request);
    }
}
