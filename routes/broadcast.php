<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Private tenant-scoped conversation channels
Broadcast::channel('private-tenant.{tenantId}.conversation.{conversationId}', function ($user, $tenantId, $conversationId) {
    // Log authorization attempt
    \Log::info('Channel authorization attempt', [
        'user_id' => $user->id,
        'tenant_id' => $tenantId,
        'conversation_id' => $conversationId,
        'channel' => "private-tenant.{$tenantId}.conversation.{$conversationId}"
    ]);

    // Verify user belongs to the tenant or is central admin
    if ($user->is_central_admin) {
        return ['id' => $user->id, 'name' => $user->name, 'role' => 'admin'];
    }
    
    // Convert tenant IDs to strings for comparison (handle UUID)
    if (strval($user->tenant_id) !== strval($tenantId)) {
        return false;
    }

    return [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'role' => $user->hasRole('tenant_admin', $tenantId) ? 'admin' : 'member',
    ];
});

// Private tenant-wide notification channels
Broadcast::channel('private-tenant.{tenantId}.notifications', function ($user, $tenantId) {
    if ($user->is_central_admin) {
        return ['id' => $user->id, 'name' => $user->name, 'role' => 'admin'];
    }
    
    if (strval($user->tenant_id) !== strval($tenantId)) {
        return false;
    }

    return [
        'id' => $user->id,
        'name' => $user->name,
        'role' => $user->hasRole('tenant_admin', $tenantId) ? 'admin' : 'member',
    ];
});

Broadcast::routes(['middleware' => [
    'web',
    \App\Http\Middleware\DebugBroadcastAuth::class
]]); 