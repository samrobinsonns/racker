<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class SupportTicketStatus extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'description',
        'color',
        'type',
        'is_active',
        'is_system',
        'is_closed',
        'is_resolved',
        'sort_order',
        'next_statuses',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_system' => 'boolean',
        'is_closed' => 'boolean',
        'is_resolved' => 'boolean',
        'sort_order' => 'integer',
        'next_statuses' => 'array',
    ];

    /**
     * Get tickets with this status
     */
    public function tickets()
    {
        return $this->hasMany(SupportTicket::class, 'status_id');
    }

    /**
     * Scope to get statuses for a specific tenant (includes system-wide as fallback)
     */
    public function scopeForTenant(Builder $query, ?string $tenantId): Builder
    {
        return $query->where(function (Builder $q) use ($tenantId) {
            // Prioritize tenant-specific records first, then fall back to system-wide
            $q->where('tenant_id', $tenantId)
              ->orWhereNull('tenant_id'); // Include system-wide statuses as fallback
        })->orderByRaw('tenant_id IS NULL ASC'); // Tenant-specific records first
    }

    /**
     * Scope to get only active statuses
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get statuses ordered by sort order
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Scope to get open statuses (not closed)
     */
    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('is_closed', false);
    }

    /**
     * Scope to get closed statuses
     */
    public function scopeClosed(Builder $query): Builder
    {
        return $query->where('is_closed', true);
    }

    /**
     * Check if this status allows transition to another status
     * Note: Currently allows all transitions for maximum flexibility
     */
    public function canTransitionTo(string $statusSlug): bool
    {
        // Allow all status transitions for maximum flexibility
        return true;
    }

    /**
     * Get allowed next statuses
     */
    public function getAllowedNextStatuses()
    {
        if (empty($this->next_statuses)) {
            return collect();
        }

        return static::whereIn('slug', $this->next_statuses)
            ->active()
            ->forTenant($this->tenant_id)
            ->ordered()
            ->get();
    }

    /**
     * Check if this is a terminal status (closed or resolved)
     */
    public function isTerminal(): bool
    {
        return $this->is_closed || $this->is_resolved;
    }

    /**
     * Get the status type as a human-readable string
     */
    public function getTypeNameAttribute(): string
    {
        return match($this->type) {
            'open' => 'Open',
            'in_progress' => 'In Progress',
            'waiting' => 'Waiting',
            'resolved' => 'Resolved',
            'closed' => 'Closed',
            default => ucfirst($this->type)
        };
    }

    /**
     * Get the CSS class for the status color
     */
    public function getColorClassAttribute(): string
    {
        return match($this->type) {
            'open' => 'text-blue-600 bg-blue-100',
            'in_progress' => 'text-yellow-600 bg-yellow-100',
            'waiting' => 'text-purple-600 bg-purple-100',
            'resolved' => 'text-green-600 bg-green-100',
            'closed' => 'text-gray-600 bg-gray-100',
            default => 'text-gray-600 bg-gray-100'
        };
    }
}
