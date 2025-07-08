<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class SupportTicketMention extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'ticket_id',
        'reply_id',
        'mentioned_user_id',
        'mentioned_by_user_id',
        'read_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    /**
     * Get the ticket this mention belongs to
     */
    public function ticket()
    {
        return $this->belongsTo(SupportTicket::class, 'ticket_id');
    }

    /**
     * Get the reply this mention belongs to
     */
    public function reply()
    {
        return $this->belongsTo(SupportTicketReply::class, 'reply_id');
    }

    /**
     * Get the user who was mentioned
     */
    public function mentionedUser()
    {
        return $this->belongsTo(User::class, 'mentioned_user_id');
    }

    /**
     * Get the user who made the mention
     */
    public function mentionedByUser()
    {
        return $this->belongsTo(User::class, 'mentioned_by_user_id');
    }

    /**
     * Scope to get mentions for a specific tenant
     */
    public function scopeForTenant(Builder $query, string $tenantId): Builder
    {
        return $query->where('support_ticket_mentions.tenant_id', $tenantId);
    }

    /**
     * Scope to get mentions for a specific user
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('mentioned_user_id', $userId);
    }

    /**
     * Scope to get mentions for a specific ticket
     */
    public function scopeForTicket(Builder $query, int $ticketId): Builder
    {
        return $query->where('ticket_id', $ticketId);
    }

    /**
     * Scope to get mentions for a specific reply
     */
    public function scopeForReply(Builder $query, int $replyId): Builder
    {
        return $query->where('reply_id', $replyId);
    }

    /**
     * Scope to get recent mentions
     */
    public function scopeRecent(Builder $query, int $days = 7): Builder
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Get the mention text for display
     */
    public function getMentionTextAttribute(): string
    {
        return "@{$this->mentionedUser->name}";
    }

    /**
     * Check if the mention is recent (within last 24 hours)
     */
    public function isRecent(): bool
    {
        return $this->created_at->isAfter(now()->subDay());
    }

    /**
     * Check if the mention has been read
     */
    public function isRead(): bool
    {
        return !is_null($this->read_at);
    }

    /**
     * Check if the mention is unread
     */
    public function isUnread(): bool
    {
        return is_null($this->read_at);
    }

    /**
     * Mark the mention as read
     */
    public function markAsRead(): bool
    {
        if ($this->isUnread()) {
            return $this->update(['read_at' => now()]);
        }
        return true;
    }

    /**
     * Mark the mention as unread
     */
    public function markAsUnread(): bool
    {
        return $this->update(['read_at' => null]);
    }

    /**
     * Scope to get unread mentions
     */
    public function scopeUnread(Builder $query): Builder
    {
        return $query->whereNull('read_at');
    }

    /**
     * Scope to get read mentions
     */
    public function scopeRead(Builder $query): Builder
    {
        return $query->whereNotNull('read_at');
    }
}
