<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use App\Traits\HasTenant;

class SupportTicketActivityLog extends Model
{
    use HasFactory, HasTenant;

    protected $fillable = [
        'tenant_id',
        'ticket_id',
        'user_id',
        'action_type',
        'description',
        'old_values',
        'new_values',
        'metadata',
        'ip_address',
        'user_agent',
        'is_system_action',
        'is_visible_to_customer',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'metadata' => 'array',
        'is_system_action' => 'boolean',
        'is_visible_to_customer' => 'boolean',
    ];

    /**
     * Get the ticket this log entry belongs to
     */
    public function ticket()
    {
        return $this->belongsTo(SupportTicket::class, 'ticket_id');
    }

    /**
     * Get the user who performed this action
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Scope to get logs visible to customers
     */
    public function scopeVisibleToCustomer(Builder $query): Builder
    {
        return $query->where('is_visible_to_customer', true);
    }

    /**
     * Scope to get system actions
     */
    public function scopeSystemActions(Builder $query): Builder
    {
        return $query->where('is_system_action', true);
    }

    /**
     * Scope to get user actions
     */
    public function scopeUserActions(Builder $query): Builder
    {
        return $query->where('is_system_action', false);
    }

    /**
     * Scope to filter by action type
     */
    public function scopeByActionType(Builder $query, string $actionType): Builder
    {
        return $query->where('action_type', $actionType);
    }

    /**
     * Get the actor's display name
     */
    public function getActorNameAttribute(): string
    {
        if ($this->is_system_action) {
            return 'System';
        }

        return $this->user?->name ?? 'Unknown User';
    }

    /**
     * Get the action type as a human-readable string
     */
    public function getActionDisplayAttribute(): string
    {
        return match($this->action_type) {
            'created' => 'Created',
            'updated' => 'Updated',
            'assigned' => 'Assigned',
            'unassigned' => 'Unassigned',
            'status_changed' => 'Status Changed',
            'priority_changed' => 'Priority Changed',
            'category_changed' => 'Category Changed',
            'replied' => 'Replied',
            'internal_note' => 'Internal Note Added',
            'attachment_added' => 'Attachment Added',
            'attachment_removed' => 'Attachment Removed',
            'escalated' => 'Escalated',
            'resolved' => 'Resolved',
            'closed' => 'Closed',
            'reopened' => 'Reopened',
            'merged' => 'Merged',
            'split' => 'Split',
            'email_received' => 'Email Received',
            'email_sent' => 'Email Sent',
            default => ucfirst(str_replace('_', ' ', $this->action_type))
        };
    }

    /**
     * Get the icon class for this action type
     */
    public function getIconClassAttribute(): string
    {
        return match($this->action_type) {
            'created' => 'heroicon-o-plus-circle',
            'updated' => 'heroicon-o-pencil-square',
            'assigned' => 'heroicon-o-user-plus',
            'unassigned' => 'heroicon-o-user-minus',
            'status_changed' => 'heroicon-o-arrow-path',
            'priority_changed' => 'heroicon-o-exclamation-triangle',
            'category_changed' => 'heroicon-o-tag',
            'replied' => 'heroicon-o-chat-bubble-left',
            'internal_note' => 'heroicon-o-document-text',
            'attachment_added' => 'heroicon-o-paper-clip',
            'attachment_removed' => 'heroicon-o-trash',
            'escalated' => 'heroicon-o-arrow-trending-up',
            'resolved' => 'heroicon-o-check-circle',
            'closed' => 'heroicon-o-x-circle',
            'reopened' => 'heroicon-o-arrow-uturn-left',
            'merged' => 'heroicon-o-arrows-pointing-in',
            'split' => 'heroicon-o-arrows-pointing-out',
            'email_received' => 'heroicon-o-envelope',
            'email_sent' => 'heroicon-o-paper-airplane',
            default => 'heroicon-o-information-circle'
        };
    }

    /**
     * Get the color class for this action type
     */
    public function getColorClassAttribute(): string
    {
        return match($this->action_type) {
            'created' => 'text-green-600 bg-green-100',
            'assigned' => 'text-blue-600 bg-blue-100',
            'status_changed' => 'text-purple-600 bg-purple-100',
            'priority_changed' => 'text-orange-600 bg-orange-100',
            'replied' => 'text-blue-600 bg-blue-100',
            'escalated' => 'text-red-600 bg-red-100',
            'resolved' => 'text-green-600 bg-green-100',
            'closed' => 'text-gray-600 bg-gray-100',
            'reopened' => 'text-yellow-600 bg-yellow-100',
            default => 'text-gray-600 bg-gray-100'
        };
    }

    /**
     * Check if this action has changes to show
     * 
     * @param array|string|null $changes
     * @param array|null $attributes
     * @return bool
     */
    public function hasChanges($changes = null, $attributes = null): bool
    {
        // If parent method parameters are provided, use parent implementation
        if ($changes !== null || $attributes !== null) {
            return parent::hasChanges($changes, $attributes);
        }

        // Our custom implementation
        return !empty($this->old_values) || !empty($this->new_values);
    }

    /**
     * Get formatted changes for display
     */
    public function getFormattedChangesAttribute(): array
    {
        $changes = [];

        if ($this->old_values && $this->new_values) {
            foreach ($this->new_values as $field => $newValue) {
                $oldValue = $this->old_values[$field] ?? null;
                
                if ($oldValue !== $newValue) {
                    $changes[] = [
                        'field' => ucfirst(str_replace('_', ' ', $field)),
                        'old' => $oldValue,
                        'new' => $newValue,
                    ];
                }
            }
        }

        return $changes;
    }

    /**
     * Create a log entry for ticket creation
     */
    public static function logTicketCreated(SupportTicket $ticket, ?int $userId = null): void
    {
        static::create([
            'tenant_id' => $ticket->tenant_id,
            'ticket_id' => $ticket->id,
            'user_id' => $userId,
            'action_type' => 'created',
            'description' => 'Ticket created',
            'is_visible_to_customer' => true,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Create a log entry for status change
     */
    public static function logStatusChange(SupportTicket $ticket, string $oldStatus, string $newStatus, ?int $userId = null): void
    {
        static::create([
            'ticket_id' => $ticket->id,
            'user_id' => $userId,
            'action_type' => 'status_changed',
            'description' => "Status changed from {$oldStatus} to {$newStatus}",
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => $newStatus],
            'is_visible_to_customer' => true,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Create a log entry for assignment
     */
    public static function logAssignment(SupportTicket $ticket, ?string $oldAssignee, string $newAssignee, ?int $userId = null): void
    {
        static::create([
            'ticket_id' => $ticket->id,
            'user_id' => $userId,
            'action_type' => 'assigned',
            'description' => "Ticket assigned to {$newAssignee}",
            'old_values' => ['assignee' => $oldAssignee],
            'new_values' => ['assignee' => $newAssignee],
            'is_visible_to_customer' => false,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Create a log entry for reply
     */
    public static function logReply(SupportTicket $ticket, SupportTicketReply $reply, ?int $userId = null): void
    {
        static::create([
            'ticket_id' => $ticket->id,
            'user_id' => $userId,
            'action_type' => $reply->is_internal ? 'internal_note' : 'replied',
            'description' => $reply->is_internal ? 'Internal note added' : 'Reply added',
            'metadata' => ['reply_id' => $reply->id],
            'is_visible_to_customer' => !$reply->is_internal,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
