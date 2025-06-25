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
            return redirect()->route('login');
        }

        $user = auth()->user();

        // Central admins can access any tenant admin area
        if ($user->is_central_admin) {
            return $next($request);
        }

        // Check if user has tenant admin role
        if (!$user->hasRole('tenant_admin')) {
            abort(403, 'Access denied. Tenant admin privileges required.');
        }

        return $next($request);
    }
}
