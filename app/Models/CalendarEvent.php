<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class CalendarEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'calendar_id',
        'title',
        'description',
        'start_date',
        'end_date',
        'all_day',
        'location',
        'url',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'all_day' => 'boolean',
    ];

    /**
     * Set the start_date attribute as-is (no timezone conversion).
     */
    public function setStartDateAttribute($value)
    {
        $this->attributes['start_date'] = $value;
    }

    /**
     * Set the end_date attribute as-is (no timezone conversion).
     */
    public function setEndDateAttribute($value)
    {
        $this->attributes['end_date'] = $value;
    }

    /**
     * Get the start_date attribute as-is.
     */
    public function getStartDateAttribute($value)
    {
        return $value;
    }

    /**
     * Get the end_date attribute as-is.
     */
    public function getEndDateAttribute($value)
    {
        return $value;
    }

    /**
     * Get the tenant that owns the event.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the calendar that owns the event.
     */
    public function calendar(): BelongsTo
    {
        return $this->belongsTo(Calendar::class);
    }

    /**
     * Get the user who created the event.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope a query to filter by tenant.
     */
    public function scopeForTenant(Builder $query, $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope a query to filter by calendar.
     */
    public function scopeForCalendar(Builder $query, $calendarId): Builder
    {
        return $query->where('calendar_id', $calendarId);
    }

    /**
     * Scope a query to filter by date range.
     */
    public function scopeInDateRange(Builder $query, $startDate, $endDate): Builder
    {
        return $query->where(function ($q) use ($startDate, $endDate) {
            // Events that start within the range
            $q->whereBetween('start_date', [$startDate, $endDate])
              // Or events that end within the range
              ->orWhereBetween('end_date', [$startDate, $endDate])
              // Or events that span the range
              ->orWhere(function ($subQ) use ($startDate, $endDate) {
                  $subQ->where('start_date', '<=', $startDate)
                        ->where('end_date', '>=', $endDate);
              });
        });
    }

    /**
     * Scope a query to filter by upcoming events.
     */
    public function scopeUpcoming(Builder $query, $days = 7): Builder
    {
        $startDate = now();
        $endDate = now()->addDays($days);
        
        return $query->where('start_date', '>=', $startDate)
                    ->where('start_date', '<=', $endDate)
                    ->orderBy('start_date');
    }

    /**
     * Check if a user can view this event.
     */
    public function canBeViewedBy(User $user): bool
    {
        return $this->calendar->canBeViewedBy($user);
    }

    /**
     * Check if a user can edit this event.
     */
    public function canBeEditedBy(User $user): bool
    {
        return $this->calendar->canBeEditedBy($user);
    }

    /**
     * Check if a user can delete this event.
     */
    public function canBeDeletedBy(User $user): bool
    {
        return $this->calendar->canBeManagedBy($user);
    }
} 