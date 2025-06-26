<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Message;
use App\Models\Conversation;
use App\Events\MessageSent;

class MessageController extends Controller
{
    /**
     * Get messages for a specific conversation with pagination
     */
    public function index(Request $request, $conversationId): JsonResponse
    {
        $user = auth()->user();
        $tenantId = $user->is_central_admin ? $request->input('tenant_id') : $user->tenant_id;

        if (!$tenantId) {
            return response()->json(['error' => 'No tenant context available'], 400);
        }

        // Find conversation and verify access
        $conversation = Conversation::where('id', $conversationId)
                                  ->where('tenant_id', $tenantId)
                                  ->first();

        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }

        // Verify user is a participant (unless central admin)
        if (!$user->is_central_admin && !$conversation->isParticipant($user)) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        // Get messages with pagination
        $messages = $conversation->messages()
                                ->with('user:id,name,email')
                                ->orderBy('created_at', 'asc')
                                ->paginate($request->input('per_page', 50));

        // Mark conversation as read for this user
        if (!$user->is_central_admin) {
            $conversation->markAsRead($user);
        }

        return response()->json([
            'messages' => $messages->items(),
            'pagination' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
                'has_more_pages' => $messages->hasMorePages(),
            ],
        ]);
    }

    /**
     * Send a new message
     */
    public function store(Request $request, $conversationId): JsonResponse
    {
        $user = auth()->user();
        $tenantId = $user->is_central_admin ? $request->input('tenant_id') : $user->tenant_id;

        if (!$tenantId) {
            return response()->json(['error' => 'No tenant context available'], 400);
        }

        $request->validate([
            'content' => 'required|string|max:5000',
            'type' => 'sometimes|in:text,file,image,system',
            'metadata' => 'sometimes|array',
        ]);

        // Find conversation and verify access
        $conversation = Conversation::where('id', $conversationId)
                                  ->where('tenant_id', $tenantId)
                                  ->first();

        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }

        // Verify user is a participant
        if (!$conversation->isParticipant($user)) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        // Create the message
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'content' => $request->input('content'),
            'type' => $request->input('type', 'text'),
            'metadata' => $request->input('metadata'),
        ]);

        // Load relationships for response
        $message->load(['user:id,name,email', 'conversation']);

        // Broadcast the message
        try {
            $event = new MessageSent($message);
            \Log::info('Broadcasting message', [
                'message_id' => $message->id,
                'conversation_id' => $message->conversation_id,
                'channel' => "tenant.{$conversation->tenant_id}.conversation.{$conversation->id}",
                'event_name' => $event->broadcastAs(),
                'broadcast_data' => $event->broadcastWith(),
            ]);
            broadcast($event)->toOthers();
            \Log::info('Message broadcast completed');
        } catch (\Exception $e) {
            \Log::error('Failed to broadcast message', [
                'message_id' => $message->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }

        return response()->json([
            'message' => $message->toArray(),
            'success' => true,
        ], 201);
    }

    /**
     * Update a message (edit)
     */
    public function update(Request $request, $conversationId, $messageId): JsonResponse
    {
        $user = auth()->user();
        $tenantId = $user->is_central_admin ? $request->input('tenant_id') : $user->tenant_id;

        $request->validate([
            'content' => 'required|string|max:5000',
        ]);

        // Find message and verify ownership/access
        $message = Message::whereHas('conversation', function ($query) use ($conversationId, $tenantId) {
                         $query->where('id', $conversationId)
                               ->where('tenant_id', $tenantId);
                     })
                     ->where('id', $messageId)
                     ->first();

        if (!$message) {
            return response()->json(['error' => 'Message not found'], 404);
        }

        // Only message owner can edit (unless central admin)
        if (!$user->is_central_admin && !$message->isOwnedBy($user)) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        // Update the message
        $message->edit($request->input('content'));
        $message->load('user:id,name,email');

        return response()->json([
            'message' => $message->toArray(),
            'success' => true,
        ]);
    }

    /**
     * Delete a message
     */
    public function destroy(Request $request, $conversationId, $messageId): JsonResponse
    {
        $user = auth()->user();
        $tenantId = $user->is_central_admin ? $request->input('tenant_id') : $user->tenant_id;

        // Find message and verify ownership/access
        $message = Message::whereHas('conversation', function ($query) use ($conversationId, $tenantId) {
                         $query->where('id', $conversationId)
                               ->where('tenant_id', $tenantId);
                     })
                     ->where('id', $messageId)
                     ->first();

        if (!$message) {
            return response()->json(['error' => 'Message not found'], 404);
        }

        // Only message owner or tenant admin can delete (or central admin)
        if (!$user->is_central_admin && 
            !$message->isOwnedBy($user) && 
            !$user->hasRole('tenant_admin', $tenantId)) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        $message->delete();

        return response()->json([
            'success' => true,
            'message' => 'Message deleted successfully',
        ]);
    }

    /**
     * Mark messages as read in a conversation
     */
    public function markAsRead(Request $request, $conversationId): JsonResponse
    {
        $user = auth()->user();
        $tenantId = $user->is_central_admin ? $request->input('tenant_id') : $user->tenant_id;

        if (!$tenantId) {
            return response()->json(['error' => 'No tenant context available'], 400);
        }

        // Find conversation and verify access
        $conversation = Conversation::where('id', $conversationId)
                                  ->where('tenant_id', $tenantId)
                                  ->first();

        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }

        // Verify user is a participant
        if (!$conversation->isParticipant($user)) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        // Mark as read
        $conversation->markAsRead($user);

        return response()->json([
            'success' => true,
            'message' => 'Messages marked as read',
        ]);
    }
}
