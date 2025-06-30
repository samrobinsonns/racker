<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenant
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
        
        // Get tenant ID from user or session
        $tenantId = $user->tenant_id ?? session('impersonated_tenant_id');

        if (!$tenantId) {
            abort(403, 'Access denied. Tenant context required.');
        }

        return $next($request);
    }
} 