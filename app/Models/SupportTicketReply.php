<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class SupportTicketReply extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'ticket_id',
        'content',
        'content_html',
        'created_by',
        'author_email',
        'author_name',
        'reply_type',
        'source',
        'is_internal',
        'is_via_email',
        'microsoft365_message_id',
        'email_headers',
        'email_received_at',
        'email_metadata',
        'metadata'
    ];

    protected $casts = [
        'is_internal' => 'boolean',
        'is_via_email' => 'boolean',
        'email_headers' => 'array',
        'email_metadata' => 'array',
        'metadata' => 'array',
        'email_received_at' => 'datetime'
    ];

    protected static function boot()
    {
        parent::boot();

        static::created(function ($reply) {
            // Update ticket's last response time
            $reply->ticket->update([
                'last_response_at' => $reply->created_at,
                'first_response_at' => $reply->ticket->first_response_at ?? $reply->created_at,
            ]);
        });
    }

    /**
     * Get the ticket this reply belongs to
     */
    public function ticket()
    {
        return $this->belongsTo(SupportTicket::class);
    }

    /**
     * Get the user who created this reply
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get attachments for this reply
     */
    public function attachments()
    {
        return $this->hasMany(SupportTicketAttachment::class, 'reply_id');
    }

    /**
     * Scope for public replies
     */
    public function scopePublic(Builder $query): Builder
    {
        return $query->where('is_internal', false);
    }

    /**
     * Scope for internal notes
     */
    public function scopeInternal(Builder $query): Builder
    {
        return $query->where('is_internal', true);
    }

    /**
     * Scope to get replies from email
     */
    public function scopeFromEmail(Builder $query): Builder
    {
        return $query->where('is_via_email', true);
    }

    /**
     * Scope to get agent replies
     */
    public function scopeFromAgent(Builder $query): Builder
    {
        return $query->where('reply_type', 'agent');
    }

    /**
     * Scope to get customer replies
     */
    public function scopeFromCustomer(Builder $query): Builder
    {
        return $query->where('reply_type', 'customer');
    }

    /**
     * Scope to get system replies
     */
    public function scopeFromSystem(Builder $query): Builder
    {
        return $query->where('reply_type', 'system');
    }

    /**
     * Check if this reply is from an agent
     */
    public function isFromAgent(): bool
    {
        return $this->reply_type === 'agent';
    }

    /**
     * Check if this reply is from a customer
     */
    public function isFromCustomer(): bool
    {
        return $this->reply_type === 'customer';
    }

    /**
     * Check if this reply is from the system
     */
    public function isFromSystem(): bool
    {
        return $this->reply_type === 'system';
    }

    /**
     * Check if this reply is internal (staff only)
     */
    public function isInternal(): bool
    {
        return $this->is_internal;
    }

    /**
     * Check if this reply came via email
     */
    public function isViaEmail(): bool
    {
        return $this->is_via_email;
    }

    /**
     * Get the author's display name
     */
    public function getAuthorDisplayNameAttribute(): string
    {
        if ($this->user) {
            return $this->user->name;
        }

        return $this->author_name ?: $this->author_email;
    }

    /**
     * Get the reply type as a human-readable string
     */
    public function getTypeDisplayAttribute(): string
    {
        return match($this->reply_type) {
            'agent' => 'Agent',
            'customer' => 'Customer',
            'system' => 'System',
            'email' => 'Email',
            default => ucfirst($this->reply_type)
        };
    }

    /**
     * Get the CSS class for the reply type
     */
    public function getTypeColorClassAttribute(): string
    {
        return match($this->reply_type) {
            'agent' => 'text-blue-600 bg-blue-100',
            'customer' => 'text-green-600 bg-green-100',
            'system' => 'text-gray-600 bg-gray-100',
            'email' => 'text-purple-600 bg-purple-100',
            default => 'text-gray-600 bg-gray-100'
        };
    }

    /**
     * Convert content to HTML if needed
     */
    public function getHtmlContentAttribute(): string
    {
        if ($this->content_html) {
            return $this->content_html;
        }

        // Simple text to HTML conversion
        return nl2br(e($this->content));
    }

    /**
     * Get a truncated version of the content for previews
     */
    public function getPreviewAttribute(): string
    {
        return Str::limit(strip_tags($this->content), 100);
    }
}
