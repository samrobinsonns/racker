<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Conversation;
use App\Models\User;
use App\Events\UserJoinedConversation;

class ConversationController extends Controller
{
    /**
     * Get all conversations for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        $tenantId = $user->is_central_admin ? $request->input('tenant_id') : $user->tenant_id;

        if (!$tenantId) {
            return response()->json(['error' => 'No tenant context available'], 400);
        }

        $query = Conversation::forTenant($tenantId)
                           ->with(['participants:id,name,email', 'messages' => function ($query) {
                               $query->latest()->limit(1)->with('user:id,name');
                           }]);

        // If not central admin, only show conversations user participates in
        if (!$user->is_central_admin) {
            $query->forUser($user->id);
        }

        $conversations = $query->latest()->paginate($request->input('per_page', 20));

        // Add unread count for each conversation
        $conversationsWithUnread = $conversations->getCollection()->map(function ($conversation) use ($user) {
            $conversationArray = $conversation->toArray();
            
            if (!$user->is_central_admin) {
                $conversationArray['unread_count'] = $conversation->getUnreadCount($user);
            } else {
                $conversationArray['unread_count'] = 0;
            }
            
            $conversationArray['last_message'] = $conversation->messages->first();
            return $conversationArray;
        });

        return response()->json([
            'conversations' => $conversationsWithUnread,
            'pagination' => [
                'current_page' => $conversations->currentPage(),
                'last_page' => $conversations->lastPage(),
                'per_page' => $conversations->perPage(),
                'total' => $conversations->total(),
                'has_more_pages' => $conversations->hasMorePages(),
            ],
        ]);
    }

    /**
     * Get a specific conversation
     */
    public function show(Request $request, $conversationId): JsonResponse
    {
        $user = auth()->user();
        $tenantId = $user->is_central_admin ? $request->input('tenant_id') : $user->tenant_id;

        if (!$tenantId) {
            return response()->json(['error' => 'No tenant context available'], 400);
        }

        $conversation = Conversation::where('id', $conversationId)
                                  ->where('tenant_id', $tenantId)
                                  ->with(['participants:id,name,email', 'creator:id,name,email'])
                                  ->first();

        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }

        // Verify user is a participant (unless central admin)
        if (!$user->is_central_admin && !$conversation->isParticipant($user)) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        $conversationArray = $conversation->toArray();
        
        if (!$user->is_central_admin) {
            $conversationArray['unread_count'] = $conversation->getUnreadCount($user);
        } else {
            $conversationArray['unread_count'] = 0;
        }

        return response()->json($conversationArray);
    }

    /**
     * Create a new conversation
     */
    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        $tenantId = $user->is_central_admin ? $request->input('tenant_id') : $user->tenant_id;

        if (!$tenantId) {
            return response()->json(['error' => 'No tenant context available'], 400);
        }

        try {
            $request->validate([
                'type' => 'required|in:direct,group,channel',
                'name' => 'nullable|required_if:type,group,channel|string|max:255',
                'description' => 'nullable|string|max:1000',
                'is_private' => 'sometimes|boolean',
                'participant_ids' => 'required|array|min:1',
                'participant_ids.*' => 'exists:users,id',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $e->errors(),
                'request_data' => $request->all(),
            ], 422);
        }

        // Add current user to participants if not already included
        $participantIds = $request->input('participant_ids', []);
        if (!in_array($user->id, $participantIds)) {
            $participantIds[] = $user->id;
        }

        // Verify all participants belong to the tenant
        $participants = User::whereIn('id', $participantIds)
                          ->where('tenant_id', $tenantId)
                          ->get();

        if ($participants->count() !== count($participantIds)) {
            return response()->json(['error' => 'Some participants do not belong to this tenant'], 400);
        }

        // Create the conversation
        $conversation = Conversation::create([
            'tenant_id' => $tenantId,
            'type' => $request->input('type'),
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'is_private' => $request->input('is_private', true),
            'created_by' => $user->id,
        ]);

        // Add participants
        foreach ($participants as $participant) {
            $role = $participant->id === $user->id ? 'admin' : 'member';
            $conversation->addParticipant($participant, $role);
            
            // Broadcast user joined event
            broadcast(new UserJoinedConversation($participant, $conversation))->toOthers();
        }

        // Load relationships for response
        $conversation->load(['participants:id,name,email', 'creator:id,name,email']);

        return response()->json([
            'conversation' => $conversation->toArray(),
            'success' => true,
        ], 201);
    }

    /**
     * Update a conversation
     */
    public function update(Request $request, $conversationId): JsonResponse
    {
        $user = auth()->user();
        $tenantId = $user->is_central_admin ? $request->input('tenant_id') : $user->tenant_id;

        if (!$tenantId) {
            return response()->json(['error' => 'No tenant context available'], 400);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:1000',
            'is_private' => 'sometimes|boolean',
        ]);

        $conversation = Conversation::where('id', $conversationId)
                                  ->where('tenant_id', $tenantId)
                                  ->first();

        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }

        // Only creator or tenant admin can update (unless central admin)
        if (!$user->is_central_admin && 
            $conversation->created_by !== $user->id && 
            !$user->hasRole('tenant_admin', $tenantId)) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        $conversation->update($request->only(['name', 'description', 'is_private']));
        $conversation->load(['participants:id,name,email', 'creator:id,name,email']);

        return response()->json([
            'conversation' => $conversation->toArray(),
            'success' => true,
        ]);
    }

    /**
     * Delete a conversation
     */
    public function destroy($id)
    {
        try {
            $user = auth()->user();
            $tenantId = $user->tenant_id;

            // Find conversation and verify access
            $conversation = Conversation::where('id', $id)
                ->where('tenant_id', $tenantId)
                ->first();

            if (!$conversation) {
                return response()->json(['error' => 'Conversation not found'], 404);
            }

            // Verify user is a participant
            if (!$conversation->isParticipant($user)) {
                return response()->json(['error' => 'Access denied'], 403);
            }

            // Delete all messages first
            $conversation->messages()->delete();
            
            // Delete all participants
            $conversation->participants()->detach();
            
            // Delete the conversation
            $conversation->delete();

            return response()->json(['message' => 'Conversation deleted successfully']);

        } catch (\Exception $e) {
            \Log::error('Failed to delete conversation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => auth()->id(),
                'conversation_id' => $id
            ]);

            return response()->json([
                'error' => 'Failed to delete conversation',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add participants to a conversation
     */
    public function addParticipants(Request $request, $conversationId): JsonResponse
    {
        $user = auth()->user();
        $tenantId = $user->is_central_admin ? $request->input('tenant_id') : $user->tenant_id;

        if (!$tenantId) {
            return response()->json(['error' => 'No tenant context available'], 400);
        }

        $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
        ]);

        $conversation = Conversation::where('id', $conversationId)
                                  ->where('tenant_id', $tenantId)
                                  ->first();

        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }

        // Verify user can add participants
        if (!$user->is_central_admin && !$conversation->isParticipant($user)) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        $newParticipants = User::whereIn('id', $request->input('user_ids'))
                             ->where('tenant_id', $tenantId)
                             ->get();

        $added = 0;
        foreach ($newParticipants as $participant) {
            if (!$conversation->isParticipant($participant)) {
                $conversation->addParticipant($participant);
                broadcast(new UserJoinedConversation($participant, $conversation))->toOthers();
                $added++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Added {$added} participants to the conversation",
            'participants_added' => $added,
        ]);
    }

    /**
     * Remove a participant from a conversation
     */
    public function removeParticipant(Request $request, $conversationId, $userId): JsonResponse
    {
        $user = auth()->user();
        $tenantId = $user->is_central_admin ? $request->input('tenant_id') : $user->tenant_id;

        if (!$tenantId) {
            return response()->json(['error' => 'No tenant context available'], 400);
        }

        $conversation = Conversation::where('id', $conversationId)
                                  ->where('tenant_id', $tenantId)
                                  ->first();

        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }

        $participantToRemove = User::where('id', $userId)
                                 ->where('tenant_id', $tenantId)
                                 ->first();

        if (!$participantToRemove) {
            return response()->json(['error' => 'User not found'], 404);
        }

        // Users can remove themselves, or admins can remove others
        if (!$user->is_central_admin && 
            $user->id !== $userId && 
            $conversation->created_by !== $user->id && 
            !$user->hasRole('tenant_admin', $tenantId)) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        $conversation->removeParticipant($participantToRemove);

        return response()->json([
            'success' => true,
            'message' => 'Participant removed successfully',
        ]);
    }
}
