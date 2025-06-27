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
            'tenant_id' => $request->user()?->tenant_id,
            'is_authenticated' => auth()->check(),
            'channel_name' => $request->input('channel_name'),
            'socket_id' => $request->input('socket_id'),
            'request_data' => $request->all()
        ]);

        $response = $next($request);

        // Get response content and decode if JSON
        $content = $response->content();
        $decodedContent = json_decode($content, true);

        Log::info('Broadcasting auth response', [
            'status' => $response->status(),
            'content_type' => $response->headers->get('Content-Type'),
            'raw_content' => $content,
            'decoded_content' => $decodedContent,
            'is_json' => json_last_error() === JSON_ERROR_NONE,
            'json_error' => json_last_error_msg()
        ]);

        return $response;
    }
} 