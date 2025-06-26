<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DebugBroadcastAuth
{
    public function handle(Request $request, Closure $next)
    {
        Log::info('Broadcasting auth request details', [
            'path' => $request->path(),
            'method' => $request->method(),
            'headers' => $request->headers->all(),
            'cookies' => $request->cookies->all(),
            'session_id' => $request->session()->getId(),
            'user_id' => $request->user()?->id,
            'is_authenticated' => auth()->check(),
            'channel_name' => $request->input('channel_name'),
            'socket_id' => $request->input('socket_id')
        ]);

        $response = $next($request);

        Log::info('Broadcasting auth response', [
            'status' => $response->status(),
            'content' => $response->content()
        ]);

        return $response;
    }
} 