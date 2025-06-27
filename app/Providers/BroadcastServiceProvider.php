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

        // Register the broadcast authentication route with custom handler
        Route::post('/broadcasting/auth', function (\Illuminate\Http\Request $request) {
            Log::info('Broadcasting auth request', [
                'user' => $request->user()?->toArray(),
                'headers' => $request->headers->all(),
                'channel_name' => $request->channel_name,
                'socket_id' => $request->socket_id,
                'session_id' => $request->session()->getId(),
                'is_authenticated' => auth()->check(),
                'request_data' => $request->all()
            ]);

            try {
                $manager = app(\Illuminate\Broadcasting\BroadcastManager::class);
                $response = $manager->auth($request);
                
                // Get the raw response content
                $content = $response->content();
                
                // Try to decode if it's JSON
                $decodedContent = json_decode($content, true);
                
                // Ensure we're returning a valid JSON response
                if (empty($content)) {
                    Log::error('Empty response content from broadcast auth');
                    return response()->json([
                        'message' => 'Unauthorized',
                    ], 403);
                }
                
                if (!$response->headers->has('Content-Type')) {
                    $response->headers->set('Content-Type', 'application/json');
                }
                
                // Log the response details
                Log::info('Broadcasting auth response', [
                    'status' => $response->status(),
                    'content' => $content,
                    'decoded_content' => $decodedContent,
                    'headers' => $response->headers->all(),
                    'is_json' => json_last_error() === JSON_ERROR_NONE,
                    'json_error' => json_last_error_msg()
                ]);

                return $response;
            } catch (\Exception $e) {
                Log::error('Broadcasting auth error', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);

                return response()->json([
                    'error' => $e->getMessage()
                ], 403);
            }
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

        // Load broadcast routes if they exist
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