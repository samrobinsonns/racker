<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalendarShare extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'calendar_id',
        'shared_with_user_id',
        'shared_by_user_id',
        'permission',
    ];

    /**
     * Get the tenant that owns the share.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the calendar being shared.
     */
    public function calendar(): BelongsTo
    {
        return $this->belongsTo(Calendar::class);
    }

    /**
     * Get the user the calendar is shared with.
     */
    public function sharedWithUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'shared_with_user_id');
    }

    /**
     * Get the user who shared the calendar.
     */
    public function sharedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'shared_by_user_id');
    }

    /**
     * Check if the share has view permission.
     */
    public function hasViewPermission(): bool
    {
        return in_array($this->permission, ['view', 'edit', 'admin']);
    }

    /**
     * Check if the share has edit permission.
     */
    public function hasEditPermission(): bool
    {
        return in_array($this->permission, ['edit', 'admin']);
    }

    /**
     * Check if the share has admin permission.
     */
    public function hasAdminPermission(): bool
    {
        return $this->permission === 'admin';
    }
} 