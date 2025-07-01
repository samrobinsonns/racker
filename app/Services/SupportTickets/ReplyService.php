<?php

namespace App\Services\SupportTickets;

use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Models\SupportTicketActivityLog;
use App\Models\User;
use Illuminate\Support\Collection;

class ReplyService
{
    /**
     * Create a reply to a ticket
     */
    public function createReply(SupportTicket $ticket, array $data, ?int $userId = null): SupportTicketReply
    {
        // Set author information
        if ($userId) {
            $user = User::find($userId);
            $data['created_by'] = $userId;
            $data['author_email'] = $user->email;
            $data['author_name'] = $user->name;
            $data['reply_type'] = 'agent'; // Always set as agent when created by a user
        } else {
            // External reply (e.g., from email)
            $data['reply_type'] = 'customer';
        }

        // Set defaults
        $data['is_internal'] = $data['is_internal'] ?? false;
        $data['is_via_email'] = $data['is_via_email'] ?? false;
        $data['tenant_id'] = $ticket->tenant_id;

        $reply = $ticket->replies()->create($data);

        // Log the reply with tenant_id
        SupportTicketActivityLog::logReply($ticket, $reply, $userId, [
            'tenant_id' => $ticket->tenant_id
        ]);

        // Update ticket response times
        $this->updateTicketResponseTimes($ticket, $reply);

        return $reply;
    }

    /**
     * Create an internal note
     */
    public function createInternalNote(SupportTicket $ticket, string $content, int $userId): SupportTicketReply
    {
        $user = User::find($userId);
        
        $data = [
            'content' => $content,
            'created_by' => $userId,
            'author_email' => $user->email,
            'author_name' => $user->name,
            'reply_type' => 'agent',
            'is_internal' => true,
            'is_via_email' => false,
            'tenant_id' => $ticket->tenant_id,
        ];

        return $this->createReply($ticket, $data, $userId);
    }

    /**
     * Create a system message
     */
    public function createSystemMessage(SupportTicket $ticket, string $content, array $metadata = []): SupportTicketReply
    {
        $data = [
            'content' => $content,
            'author_email' => 'system@' . config('app.domain', 'system'),
            'author_name' => 'System',
            'reply_type' => 'system',
            'is_internal' => false,
            'is_via_email' => false,
            'email_metadata' => $metadata,
        ];

        return $ticket->replies()->create($data);
    }

    /**
     * Get all replies for a ticket (for agents)
     */
    public function getTicketReplies(SupportTicket $ticket, bool $includeInternal = true): Collection
    {
        $query = $ticket->replies()->with(['user', 'attachments'])->orderBy('created_at');

        if (!$includeInternal) {
            $query->public();
        }

        return $query->get();
    }

    /**
     * Get public replies for a ticket (for customers)
     */
    public function getPublicReplies(SupportTicket $ticket): Collection
    {
        return $ticket->replies()
            ->with(['user', 'attachments'])
            ->public()
            ->orderBy('created_at')
            ->get();
    }

    /**
     * Get internal notes for a ticket
     */
    public function getInternalNotes(SupportTicket $ticket): Collection
    {
        return $ticket->replies()
            ->with(['user'])
            ->internal()
            ->orderBy('created_at')
            ->get();
    }

    /**
     * Update a reply
     */
    public function updateReply(SupportTicketReply $reply, array $data, ?int $userId = null): SupportTicketReply
    {
        // Only allow updating content and visibility
        $allowedFields = ['content', 'content_html', 'is_internal'];
        $updateData = array_intersect_key($data, array_flip($allowedFields));

        $reply->update($updateData);

        // Log the update
        if ($userId) {
            SupportTicketActivityLog::create([
                'ticket_id' => $reply->ticket_id,
                'user_id' => $userId,
                'action_type' => 'reply_updated',
                'description' => $reply->is_internal ? 'Internal note updated' : 'Reply updated',
                'metadata' => ['reply_id' => $reply->id],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        }

        return $reply->fresh();
    }

    /**
     * Delete a reply
     */
    public function deleteReply(SupportTicketReply $reply, ?int $userId = null): bool
    {
        $ticket = $reply->ticket;
        
        // Log the deletion
        if ($userId) {
            SupportTicketActivityLog::create([
                'ticket_id' => $ticket->id,
                'user_id' => $userId,
                'action_type' => 'reply_deleted',
                'description' => $reply->is_internal ? 'Internal note deleted' : 'Reply deleted',
                'metadata' => ['reply_id' => $reply->id, 'reply_content' => substr($reply->content, 0, 100)],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        }

        return $reply->delete();
    }

    /**
     * Mark reply as sent via email
     */
    public function markAsSent(SupportTicketReply $reply, string $messageId): void
    {
        $reply->update([
            'email_sent' => true,
            'email_sent_at' => now(),
            'email_message_id' => $messageId,
        ]);
    }

    /**
     * Create reply from email
     */
    public function createEmailReply(SupportTicket $ticket, array $emailData): SupportTicketReply
    {
        $data = [
            'content' => $emailData['body_text'] ?? $emailData['body_html'] ?? '',
            'content_html' => $emailData['body_html'] ?? null,
            'author_email' => $emailData['from_email'],
            'author_name' => $emailData['from_name'] ?? $emailData['from_email'],
            'reply_type' => 'email',
            'is_internal' => false,
            'is_via_email' => true,
            'microsoft365_message_id' => $emailData['message_id'] ?? null,
            'email_headers' => $emailData['headers'] ?? [],
            'email_received_at' => $emailData['received_at'] ?? now(),
            'email_metadata' => [
                'subject' => $emailData['subject'] ?? '',
                'cc' => $emailData['cc'] ?? [],
                'bcc' => $emailData['bcc'] ?? [],
            ],
        ];

        return $this->createReply($ticket, $data);
    }

    /**
     * Get reply statistics for a ticket
     */
    public function getReplyStats(SupportTicket $ticket): array
    {
        $replies = $ticket->replies;

        return [
            'total_replies' => $replies->count(),
            'public_replies' => $replies->where('is_internal', false)->count(),
            'internal_notes' => $replies->where('is_internal', true)->count(),
            'agent_replies' => $replies->where('reply_type', 'agent')->count(),
            'customer_replies' => $replies->whereIn('reply_type', ['customer', 'email'])->count(),
            'system_messages' => $replies->where('reply_type', 'system')->count(),
            'email_replies' => $replies->where('is_via_email', true)->count(),
            'last_reply_at' => $replies->max('created_at'),
            'last_agent_reply_at' => $replies->where('reply_type', 'agent')->max('created_at'),
            'last_customer_reply_at' => $replies->whereIn('reply_type', ['customer', 'email'])->max('created_at'),
        ];
    }

    /**
     * Check if user can view reply
     */
    public function canViewReply(SupportTicketReply $reply, User $user): bool
    {
        // Central admins can see everything
        if ($user->is_central_admin) {
            return true;
        }

        // Check tenant access
        if ($user->tenant_id !== $reply->ticket->tenant_id) {
            return false;
        }

        // Internal notes are only visible to agents
        if ($reply->is_internal) {
            return $user->hasAnyPermission([
                'view_support_tickets',
                'manage_support_tickets'
            ]);
        }

        // Public replies are visible to everyone with ticket access
        return true;
    }

    /**
     * Check if user can edit reply
     */
    public function canEditReply(SupportTicketReply $reply, User $user): bool
    {
        // Central admins can edit everything
        if ($user->is_central_admin) {
            return true;
        }

        // Check tenant access
        if ($user->tenant_id !== $reply->ticket->tenant_id) {
            return false;
        }

        // User can edit their own replies
        if ($reply->created_by === $user->id) {
            return true;
        }

        // Agents with manage permissions can edit any reply
        return $user->hasPermission('manage_support_tickets');
    }

    /**
     * Update ticket response times based on new reply
     */
    private function updateTicketResponseTimes(SupportTicket $ticket, SupportTicketReply $reply): void
    {
        // Only update for agent replies that are not internal
        if ($reply->reply_type === 'agent' && !$reply->is_internal) {
            $updates = [];

            // Update first response time if this is the first agent response
            if (!$ticket->first_response_at) {
                $updates['first_response_at'] = $reply->created_at;
                $updates['response_time_minutes'] = $ticket->created_at->diffInMinutes($reply->created_at);
            }

            // Always update last response time
            $updates['last_response_at'] = $reply->created_at;

            if (!empty($updates)) {
                $ticket->update($updates);
            }
        }
    }
} 