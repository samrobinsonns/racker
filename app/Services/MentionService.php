<?php

namespace App\Services;

use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Models\SupportTicketMention;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class MentionService
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Parse mentions from content and create mention records
     */
    public function processMentions(SupportTicketReply $reply, string $content, int $mentionedByUserId): Collection
    {
        $mentions = $this->extractMentions($content);
        $createdMentions = collect();

        foreach ($mentions as $username) {
            $user = $this->findUserByUsername($username, $reply->tenant_id);
            
            if ($user) {
                $mention = $this->createMention($reply, $user->id, $mentionedByUserId);
                $createdMentions->push($mention);
                
                // Send notification to mentioned user
                $this->sendMentionNotification($reply, $user, $mentionedByUserId);
            }
        }

        // Mark reply as processed
        $reply->update(['mentions_processed' => true]);

        return $createdMentions;
    }

    /**
     * Extract @mentions from content
     */
    public function extractMentions(string $content): array
    {
        // Match @username patterns - the frontend always inserts "@Name " (with space after)
        // So we capture everything between @ and the next space
        preg_match_all('/@([^@]+?)\s/', $content, $matches);
        
        // Also catch mentions at the end of text (without trailing space)
        preg_match_all('/@([^@\s]+(?:\s+[^@\s]+)*)$/', $content, $endMatches);
        
        // Combine both results
        $allMentions = array_merge($matches[1] ?? [], $endMatches[1] ?? []);
        
        // Clean up the matched names (trim whitespace)
        $mentions = array_map('trim', $allMentions);
        
        // Remove empty mentions and return unique values
        return array_unique(array_filter($mentions));
    }

    /**
     * Find user by username (email or name)
     */
    public function findUserByUsername(string $username, string $tenantId): ?User
    {
        return User::where('tenant_id', $tenantId)
            ->where(function ($query) use ($username) {
                $query->where('email', 'like', "%{$username}%")
                      ->orWhere('name', 'like', "%{$username}%")
                      ->orWhere('name', 'like', "%" . str_replace(['.', '_', '-'], ' ', $username) . "%");
            })
            ->first();
    }

    /**
     * Create a mention record
     */
    public function createMention(SupportTicketReply $reply, int $mentionedUserId, int $mentionedByUserId): SupportTicketMention
    {
        return SupportTicketMention::create([
            'tenant_id' => $reply->tenant_id,
            'ticket_id' => $reply->ticket_id,
            'reply_id' => $reply->id,
            'mentioned_user_id' => $mentionedUserId,
            'mentioned_by_user_id' => $mentionedByUserId,
        ]);
    }

    /**
     * Send notification to mentioned user
     */
    public function sendMentionNotification(SupportTicketReply $reply, User $mentionedUser, int $mentionedByUserId): void
    {
        $mentionedByUser = User::find($mentionedByUserId);
        
        $this->notificationService->createForUser(
            user: $mentionedUser,
            type: 'info',
            message: "You were mentioned in ticket #{$reply->ticket->ticket_number} by {$mentionedByUser->name}",
            title: 'You were mentioned',
            actionUrl: route('support-tickets.show', $reply->ticket),
            actionText: 'View Ticket',
            metadata: [
                'ticket_id' => $reply->ticket_id,
                'ticket_number' => $reply->ticket->ticket_number,
                'reply_id' => $reply->id,
                'mentioned_by_user_id' => $mentionedByUserId,
                'mentioned_by_user_name' => $mentionedByUser->name,
                'is_mention' => true,
            ]
        );
    }

    /**
     * Get users that can be mentioned in a tenant
     */
    public function getMentionableUsers(string $tenantId, ?int $excludeUserId = null): Collection
    {
        $query = User::where('tenant_id', $tenantId)
            ->whereHas('roles', function ($q) {
                $q->where(function ($roleQuery) {
                    $roleQuery->whereJsonContains('permissions', 'view_support_tickets')
                              ->orWhereJsonContains('permissions', 'manage_support_tickets')
                              ->orWhereJsonContains('permissions', 'reply_support_tickets');
                });
            });

        if ($excludeUserId) {
            $query->where('id', '!=', $excludeUserId);
        }

        return $query->select(['id', 'name', 'email'])
            ->orderBy('name')
            ->get();
    }

    /**
     * Search users for mention autocomplete
     */
    public function searchMentionableUsers(string $tenantId, string $search, ?int $excludeUserId = null): Collection
    {
        $query = User::where('tenant_id', $tenantId)
            ->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })
            ->whereHas('roles', function ($roleQuery) {
                $roleQuery->where(function ($q) {
                    $q->whereJsonContains('permissions', 'view_support_tickets')
                      ->orWhereJsonContains('permissions', 'manage_support_tickets')
                      ->orWhereJsonContains('permissions', 'reply_support_tickets');
                });
            });

        if ($excludeUserId) {
            $query->where('id', '!=', $excludeUserId);
        }

        return $query->select(['id', 'name', 'email', 'avatar_url'])
            ->orderBy('name')
            ->limit(10)
            ->get();
    }

    /**
     * Get mentions for a specific user
     */
    public function getUserMentions(int $userId, string $tenantId, int $limit = 20): Collection
    {
        return SupportTicketMention::forTenant($tenantId)
            ->forUser($userId)
            ->with(['ticket', 'reply', 'mentionedByUser'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get unread mentions for a user
     */
    public function getUnreadMentions(int $userId, string $tenantId): Collection
    {
        return SupportTicketMention::forTenant($tenantId)
            ->forUser($userId)
            ->unread()
            ->with(['ticket', 'reply', 'mentionedByUser'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Mark mentions as read for a user
     */
    public function markMentionsAsRead(int $userId, string $tenantId): int
    {
        $mentions = $this->getUnreadMentions($userId, $tenantId);
        
        $markedCount = 0;
        foreach ($mentions as $mention) {
            if ($mention->markAsRead()) {
                $markedCount++;
            }
        }

        return $markedCount;
    }
} 