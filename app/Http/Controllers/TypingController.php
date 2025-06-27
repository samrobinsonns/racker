<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Conversation;
use App\Events\UserTyping;

class TypingController extends Controller
{
    /**
     * Broadcast typing indicator for a conversation
     */
    public function typing(Request $request, $conversationId): JsonResponse
    {
        try {
            $user = auth()->user();
            $tenantId = $user->is_central_admin ? $request->input('tenant_id') : $user->tenant_id;

            if (!$tenantId) {
                return response()->json(['error' => 'No tenant context available'], 400);
            }

            // Log request data for debugging
            \Log::info('Typing request received', [
                'user_id' => $user->id,
                'tenant_id' => $tenantId,
                'conversation_id' => $conversationId,
                'request_data' => $request->all()
            ]);

            $request->validate([
                'is_typing' => 'required|boolean',
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

            // Broadcast typing event
            $isTyping = $request->boolean('is_typing');
            broadcast(new UserTyping($user, $conversation, $isTyping))->toOthers();

            return response()->json([
                'success' => true,
                'message' => $isTyping ? 'Typing indicator sent' : 'Typing indicator stopped',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in typing endpoint', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => auth()->id(),
                'conversation_id' => $conversationId
            ]);

            return response()->json([
                'error' => 'Failed to process typing indicator',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Stop typing indicator (convenience endpoint)
     */
    public function stopTyping(Request $request, $conversationId): JsonResponse
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

        // Broadcast stop typing event
        broadcast(new UserTyping($user, $conversation, false))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Typing indicator stopped',
        ]);
    }
}
