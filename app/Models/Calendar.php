<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Builder;

class Calendar extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'color',
        'is_public',
        'created_by',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    /**
     * Get the tenant that owns the calendar.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the user who created the calendar.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the events for the calendar.
     */
    public function events(): HasMany
    {
        return $this->hasMany(CalendarEvent::class);
    }

    /**
     * Get the shares for the calendar.
     */
    public function shares(): HasMany
    {
        return $this->hasMany(CalendarShare::class);
    }

    /**
     * Get users who have access to this calendar.
     */
    public function sharedUsers(): HasManyThrough
    {
        return $this->hasManyThrough(
            User::class,
            CalendarShare::class,
            'calendar_id',
            'id',
            'id',
            'shared_with_user_id'
        );
    }

    /**
     * Scope a query to filter by tenant.
     */
    public function scopeForTenant(Builder $query, $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope a query to filter by user access.
     */
    public function scopeAccessibleByUser(Builder $query, User $user): Builder
    {
        return $query->where(function ($q) use ($user) {
            // User's own calendars
            $q->where('created_by', $user->id);
            
            // Public calendars in user's tenant
            if ($user->tenant_id) {
                $q->orWhere(function ($subQ) use ($user) {
                    $subQ->where('tenant_id', $user->tenant_id)
                          ->where('is_public', true);
                });
            }
            
            // Calendars shared with user
            $q->orWhereHas('shares', function ($shareQ) use ($user) {
                $shareQ->where('shared_with_user_id', $user->id);
            });
        });
    }

    /**
     * Check if a user can view this calendar.
     */
    public function canBeViewedBy(User $user): bool
    {
        // Creator can always view
        if ($this->created_by === $user->id) {
            return true;
        }

        // Public calendars in same tenant
        if ($user->tenant_id && $this->tenant_id === $user->tenant_id && $this->is_public) {
            return true;
        }

        // Shared calendars
        return $this->shares()->where('shared_with_user_id', $user->id)->exists();
    }

    /**
     * Check if a user can edit this calendar.
     */
    public function canBeEditedBy(User $user): bool
    {
        // Creator can always edit
        if ($this->created_by === $user->id) {
            return true;
        }

        // Shared with edit or admin permission
        return $this->shares()
            ->where('shared_with_user_id', $user->id)
            ->whereIn('permission', ['edit', 'admin'])
            ->exists();
    }

    /**
     * Check if a user can manage this calendar (admin permission).
     */
    public function canBeManagedBy(User $user): bool
    {
        // Creator can always manage
        if ($this->created_by === $user->id) {
            return true;
        }

        // Shared with admin permission
        return $this->shares()
            ->where('shared_with_user_id', $user->id)
            ->where('permission', 'admin')
            ->exists();
    }
} 