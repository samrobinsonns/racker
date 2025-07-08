<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Stancl\Tenancy\Database\Models\Domain;
use App\Models\NavigationConfiguration;
use App\Services\NavigationService;
use Illuminate\Support\Facades\Log;

class AuthenticatedSessionController extends Controller
{
    protected NavigationService $navigationService;

    public function __construct(NavigationService $navigationService)
    {
        $this->navigationService = $navigationService;
    }

    /**
     * Display the login view.
     */
    public function create(): Response
    {
        $tenant = null;
        $host = request()->getHost();
        
        // Get domain from database
        $domain = Domain::where('domain', $host)->first();
        if ($domain) {
            $tenant = $domain->tenant;
            
            // Get all active navigation configurations for this tenant
            $configs = NavigationConfiguration::where('tenant_id', $tenant->id)
                ->where('is_active', true)
                ->orderBy('created_at', 'desc')
                ->get();

            Log::info('Found navigation configs for tenant', [
                'tenant_id' => $tenant->id,
                'config_count' => $configs->count()
            ]);

            // Look for branding in all configurations
            $branding = null;
            foreach ($configs as $config) {
                // First check root level branding
                if (isset($config->configuration['branding'])) {
                    $branding = $config->configuration['branding'];
                    Log::info('Found branding in root configuration', ['branding' => $branding]);
                    break;
                }
                
                // Then check items for branding
                if (isset($config->configuration['items'])) {
                    foreach ($config->configuration['items'] as $item) {
                        if (isset($item['branding'])) {
                            $branding = $item['branding'];
                            Log::info('Found branding in items', ['branding' => $branding]);
                            break 2;
                        }
                    }
                }
            }

            // Use default branding if none found
            if (!$branding) {
                $branding = [
                    'logo' => 'BuildingOffice2Icon',
                    'logoType' => 'icon',
                    'title' => $tenant->name,
                    'subtitle' => '',
                    'primaryColor' => '#22c55e',
                    'logoUrl' => null
                ];
                Log::info('Using default branding', ['branding' => $branding]);
            }

            // Ensure all required branding fields are present
            $branding = array_merge([
                'logo' => 'BuildingOffice2Icon',
                'logoType' => 'icon',
                'title' => $tenant->name,
                'subtitle' => '',
                'primaryColor' => '#22c55e',
                'logoUrl' => null
            ], $branding);

            $tenant->branding = $branding;
            Log::info('Final branding configuration', ['branding' => $branding]);
        }

        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'tenant' => $tenant ? [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'branding' => $tenant->branding,
            ] : null,
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
