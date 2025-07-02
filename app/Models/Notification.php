<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'type',
        'title',
        'message',
        'action_url',
        'action_text',
        'metadata',
        'read_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'read_at' => 'datetime',
    ];

    /**
     * Get the user that owns the notification.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the tenant that owns the notification.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Scope a query to only include unread notifications.
     */
    public function scopeUnread(Builder $query): Builder
    {
        return $query->whereNull('read_at');
    }

    /**
     * Scope a query to only include read notifications.
     */
    public function scopeRead(Builder $query): Builder
    {
        return $query->whereNotNull('read_at');
    }

    /**
     * Scope a query to filter by notification type.
     */
    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    /**
     * Scope a query to filter by tenant.
     */
    public function scopeForTenant(Builder $query, $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope a query to filter by user.
     */
    public function scopeForUser(Builder $query, $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Check if the notification is unread.
     */
    public function isUnread(): bool
    {
        return is_null($this->read_at);
    }

    /**
     * Check if the notification is read.
     */
    public function isRead(): bool
    {
        return !is_null($this->read_at);
    }

    /**
     * Mark the notification as read.
     */
    public function markAsRead(): bool
    {
        return $this->update(['read_at' => now()]);
    }

    /**
     * Mark the notification as unread.
     */
    public function markAsUnread(): bool
    {
        return $this->update(['read_at' => null]);
    }

    /**
     * Get the notification icon based on type.
     */
    public function getIconAttribute(): string
    {
        return match($this->type) {
            'success' => 'CheckCircleIcon',
            'warning' => 'ExclamationTriangleIcon',
            'error' => 'ExclamationCircleIcon',
            'info' => 'InformationCircleIcon',
            default => 'BellIcon',
        };
    }

    /**
     * Get the notification color classes based on type.
     */
    public function getColorClassesAttribute(): array
    {
        return match($this->type) {
            'success' => [
                'bg' => 'bg-green-50',
                'border' => 'border-green-200',
                'text' => 'text-green-800',
                'icon' => 'text-green-400',
            ],
            'warning' => [
                'bg' => 'bg-yellow-50',
                'border' => 'border-yellow-200',
                'text' => 'text-yellow-800',
                'icon' => 'text-yellow-400',
            ],
            'error' => [
                'bg' => 'bg-red-50',
                'border' => 'border-red-200',
                'text' => 'text-red-800',
                'icon' => 'text-red-400',
            ],
            'info' => [
                'bg' => 'bg-blue-50',
                'border' => 'border-blue-200',
                'text' => 'text-blue-800',
                'icon' => 'text-blue-400',
            ],
            default => [
                'bg' => 'bg-gray-50',
                'border' => 'border-gray-200',
                'text' => 'text-gray-800',
                'icon' => 'text-gray-400',
            ],
        };
    }
} 