<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class CannedResponseUsage extends Model
{
    use HasFactory;

    protected $table = 'canned_response_usage';

    protected $fillable = [
        'tenant_id',
        'canned_response_id',
        'ticket_id',
        'reply_id',
        'used_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the tenant this usage belongs to
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    /**
     * Get the canned response that was used
     */
    public function cannedResponse()
    {
        return $this->belongsTo(CannedResponse::class, 'canned_response_id');
    }

    /**
     * Get the ticket where the canned response was used
     */
    public function ticket()
    {
        return $this->belongsTo(SupportTicket::class, 'ticket_id');
    }

    /**
     * Get the reply where the canned response was used
     */
    public function reply()
    {
        return $this->belongsTo(SupportTicketReply::class, 'reply_id');
    }

    /**
     * Get the user who used the canned response
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'used_by');
    }

    /**
     * Scope to get usage for a specific tenant
     */
    public function scopeForTenant(Builder $query, string $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope to get usage for a specific canned response
     */
    public function scopeForCannedResponse(Builder $query, int $cannedResponseId): Builder
    {
        return $query->where('canned_response_id', $cannedResponseId);
    }

    /**
     * Scope to get usage for a specific ticket
     */
    public function scopeForTicket(Builder $query, int $ticketId): Builder
    {
        return $query->where('ticket_id', $ticketId);
    }

    /**
     * Scope to get usage by a specific user
     */
    public function scopeByUser(Builder $query, int $userId): Builder
    {
        return $query->where('used_by', $userId);
    }

    /**
     * Scope to get recent usage
     */
    public function scopeRecent(Builder $query, int $days = 30): Builder
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Scope to get usage for today
     */
    public function scopeToday(Builder $query): Builder
    {
        return $query->whereDate('created_at', today());
    }

    /**
     * Scope to get usage for this week
     */
    public function scopeThisWeek(Builder $query): Builder
    {
        return $query->whereBetween('created_at', [
            now()->startOfWeek(),
            now()->endOfWeek()
        ]);
    }

    /**
     * Scope to get usage for this month
     */
    public function scopeThisMonth(Builder $query): Builder
    {
        return $query->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year);
    }

    /**
     * Get usage statistics for a tenant
     */
    public static function getTenantStats(string $tenantId, int $days = 30): array
    {
        $query = static::forTenant($tenantId);

        $totalUsage = $query->count();
        $recentUsage = $query->recent($days)->count();
        $todayUsage = $query->today()->count();
        $thisWeekUsage = $query->thisWeek()->count();
        $thisMonthUsage = $query->thisMonth()->count();

        // Get most used canned responses
        $mostUsed = $query->selectRaw('canned_response_id, COUNT(*) as usage_count')
            ->groupBy('canned_response_id')
            ->orderBy('usage_count', 'desc')
            ->limit(5)
            ->with('cannedResponse')
            ->get();

        // Get usage by user
        $usageByUser = $query->selectRaw('used_by, COUNT(*) as usage_count')
            ->groupBy('used_by')
            ->orderBy('usage_count', 'desc')
            ->limit(10)
            ->with('user')
            ->get();

        return [
            'total_usage' => $totalUsage,
            'recent_usage' => $recentUsage,
            'today_usage' => $todayUsage,
            'this_week_usage' => $thisWeekUsage,
            'this_month_usage' => $thisMonthUsage,
            'most_used_responses' => $mostUsed,
            'usage_by_user' => $usageByUser,
        ];
    }

    /**
     * Get usage statistics for a specific user
     */
    public static function getUserStats(int $userId, string $tenantId, int $days = 30): array
    {
        $query = static::forTenant($tenantId)->byUser($userId);

        $totalUsage = $query->count();
        $recentUsage = $query->recent($days)->count();
        $todayUsage = $query->today()->count();
        $thisWeekUsage = $query->thisWeek()->count();

        // Get user's most used canned responses
        $mostUsed = $query->selectRaw('canned_response_id, COUNT(*) as usage_count')
            ->groupBy('canned_response_id')
            ->orderBy('usage_count', 'desc')
            ->limit(5)
            ->with('cannedResponse')
            ->get();

        return [
            'total_usage' => $totalUsage,
            'recent_usage' => $recentUsage,
            'today_usage' => $todayUsage,
            'this_week_usage' => $thisWeekUsage,
            'most_used_responses' => $mostUsed,
        ];
    }
}
