<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class SupportTicketPriority extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'description',
        'level',
        'color',
        'response_time_hours',
        'resolution_time_hours',
        'is_active',
        'is_system',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_system' => 'boolean',
        'level' => 'integer',
        'response_time_hours' => 'integer',
        'resolution_time_hours' => 'integer',
        'sort_order' => 'integer',
    ];

    /**
     * Get tickets with this priority
     */
    public function tickets()
    {
        return $this->hasMany(SupportTicket::class, 'priority_id');
    }

    /**
     * Scope to get priorities for a specific tenant (including system-wide)
     */
    public function scopeForTenant(Builder $query, ?string $tenantId): Builder
    {
        return $query->where(function (Builder $q) use ($tenantId) {
            $q->where('tenant_id', $tenantId)
              ->orWhereNull('tenant_id'); // Include system-wide priorities
        });
    }

    /**
     * Scope to get only active priorities
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to order by level (critical first)
     */
    public function scopeByLevel(Builder $query): Builder
    {
        return $query->orderBy('level')->orderBy('sort_order');
    }

    /**
     * Check if this priority is critical (level 1)
     */
    public function isCritical(): bool
    {
        return $this->level === 1;
    }

    /**
     * Check if this priority is high (level 2)
     */
    public function isHigh(): bool
    {
        return $this->level === 2;
    }

    /**
     * Get the priority level as a human-readable string
     */
    public function getLevelNameAttribute(): string
    {
        return match($this->level) {
            1 => 'Critical',
            2 => 'High',
            3 => 'Medium',
            4 => 'Low',
            default => 'Unknown'
        };
    }

    /**
     * Get the CSS class for the priority color
     */
    public function getColorClassAttribute(): string
    {
        return match($this->level) {
            1 => 'text-red-600 bg-red-100',
            2 => 'text-orange-600 bg-orange-100',
            3 => 'text-green-600 bg-green-100',
            4 => 'text-gray-600 bg-gray-100',
            default => 'text-gray-600 bg-gray-100'
        };
    }
}
