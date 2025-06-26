<?php

namespace App\Providers;

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

class BroadcastServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Log before registering routes
        Log::info('Registering broadcast routes');

        // Register the broadcast authentication routes first
        Broadcast::routes(['middleware' => ['web', 'auth']]);

        // Add a route to debug auth requests
        Route::post('/broadcasting/auth', function (\Illuminate\Http\Request $request) {
            Log::info('Broadcasting auth request', [
                'user' => $request->user()?->toArray(),
                'headers' => $request->headers->all(),
                'channel_name' => $request->channel_name,
                'socket_id' => $request->socket_id,
                'session_id' => $request->session()->getId(),
                'is_authenticated' => auth()->check()
            ]);

            return app(\Illuminate\Broadcasting\BroadcastManager::class)
                ->auth($request);
        })->middleware(['web', 'auth'])->withoutMiddleware([\App\Http\Middleware\HandleInertiaRequests::class]);

        // Log registered routes
        Log::info('Broadcast routes registered', [
            'routes' => collect(Route::getRoutes()->getRoutes())
                ->filter(function ($route) {
                    return str_contains($route->uri(), 'broadcasting');
                })
                ->map(function ($route) {
                    return [
                        'uri' => $route->uri(),
                        'methods' => $route->methods(),
                        'middleware' => $route->middleware()
                    ];
                })
                ->values()
                ->toArray()
        ]);

        // Load channel authorization rules
        require base_path('routes/channels.php');

        // Load broadcast routes
        if (file_exists(base_path('routes/broadcast.php'))) {
            require base_path('routes/broadcast.php');
        }

        // Log broadcast configuration
        Log::info('Broadcasting configuration', [
            'driver' => config('broadcasting.default'),
            'connections' => config('broadcasting.connections'),
        ]);

        // Log after loading channel rules
        Log::info('Channel authorization rules loaded');
    }
} 