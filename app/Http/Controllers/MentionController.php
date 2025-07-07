<?php

namespace App\Http\Controllers;

use App\Services\MentionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class MentionController extends Controller
{
    protected MentionService $mentionService;

    public function __construct(MentionService $mentionService)
    {
        $this->mentionService = $mentionService;
    }

    /**
     * Search users for mention autocomplete
     */
    public function searchUsers(Request $request): JsonResponse
    {
        $request->validate([
            'search' => 'required|string|min:1|max:50',
        ]);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $excludeUserId = auth()->id();

        // Return empty results if no tenant is found
        if (!$tenantId) {
            return response()->json([
                'users' => [],
            ]);
        }

        $users = $this->mentionService->searchMentionableUsers(
            $tenantId,
            $request->search,
            $excludeUserId
        );

        return response()->json([
            'users' => $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'display_name' => $user->name,
                    'mention_text' => "@{$user->name}",
                    'avatar_url' => $user->avatar_url,
                ];
            }),
        ]);
    }

    /**
     * Get mentionable users for a tenant
     */
    public function getMentionableUsers(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $excludeUserId = $request->input('exclude_user_id');

        // Return empty results if no tenant is found
        if (!$tenantId) {
            return response()->json([
                'users' => [],
            ]);
        }

        $users = $this->mentionService->getMentionableUsers($tenantId, $excludeUserId);

        return response()->json([
            'users' => $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'display_name' => $user->name,
                    'mention_text' => "@{$user->name}",
                    'avatar_url' => $user->avatar_url,
                ];
            }),
        ]);
    }

    /**
     * Get user's mentions
     */
    public function getUserMentions(Request $request): JsonResponse
    {
        $request->validate([
            'limit' => 'sometimes|integer|min:1|max:100',
        ]);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $userId = auth()->id();
        $limit = $request->input('limit', 20);

        // Return empty results if no tenant is found
        if (!$tenantId) {
            return response()->json([
                'mentions' => [],
            ]);
        }

        $mentions = $this->mentionService->getUserMentions($userId, $tenantId, $limit);

        return response()->json([
            'mentions' => $mentions->map(function ($mention) {
                return [
                    'id' => $mention->id,
                    'ticket' => [
                        'id' => $mention->ticket->id,
                        'ticket_number' => $mention->ticket->ticket_number,
                        'subject' => $mention->ticket->subject,
                    ],
                    'reply' => [
                        'id' => $mention->reply->id,
                        'content' => $mention->reply->content,
                        'created_at' => $mention->reply->created_at,
                    ],
                    'mentioned_by' => [
                        'id' => $mention->mentionedByUser->id,
                        'name' => $mention->mentionedByUser->name,
                    ],
                    'created_at' => $mention->created_at,
                    'is_recent' => $mention->isRecent(),
                ];
            }),
        ]);
    }

    /**
     * Get unread mentions for a user
     */
    public function getUnreadMentions(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $userId = auth()->id();

        // Return empty results if no tenant is found
        if (!$tenantId) {
            return response()->json([
                'mentions' => [],
                'count' => 0,
            ]);
        }

        $mentions = $this->mentionService->getUnreadMentions($userId, $tenantId);

        return response()->json([
            'mentions' => $mentions->map(function ($mention) {
                return [
                    'id' => $mention->id,
                    'ticket' => [
                        'id' => $mention->ticket->id,
                        'ticket_number' => $mention->ticket->ticket_number,
                        'subject' => $mention->ticket->subject,
                    ],
                    'reply' => [
                        'id' => $mention->reply->id,
                        'content' => $mention->reply->content,
                        'created_at' => $mention->reply->created_at,
                    ],
                    'mentioned_by' => [
                        'id' => $mention->mentionedByUser->id,
                        'name' => $mention->mentionedByUser->name,
                    ],
                    'created_at' => $mention->created_at,
                ];
            }),
            'count' => $mentions->count(),
        ]);
    }

    /**
     * Mark mentions as read for the authenticated user
     */
    public function markAsRead(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $userId = auth()->id();

        // Return success if no tenant is found
        if (!$tenantId) {
            return response()->json([
                'marked_count' => 0,
                'message' => 'No mentions to mark as read'
            ]);
        }

        $markedCount = $this->mentionService->markMentionsAsRead($userId, $tenantId);

        return response()->json([
            'marked_count' => $markedCount,
            'message' => "Marked {$markedCount} mentions as read"
        ]);
    }

    /**
     * Get mention statistics for the tenant (for analytics dashboard)
     */
    public function getMentionStats(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');

        // Return empty stats if no tenant is found
        if (!$tenantId) {
            return response()->json([
                'total_mentions' => 0,
                'unread_mentions' => 0,
                'recent_mentions' => 0,
                'today_mentions' => 0,
            ]);
        }

        // Get tenant-wide mention statistics for analytics dashboard
        $stats = $this->mentionService->getTenantMentionStats($tenantId);

        return response()->json($stats);
    }
}
