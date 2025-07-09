<?php

namespace App\Services\SupportTickets;

use App\Models\SupportTicket;
use Illuminate\Support\Facades\Auth;
use App\Models\SupportTicketActivityLog;
use App\Models\SupportTicketReply;

class DashboardStatsService
{
    /**
     * Get ticket statistics for the user's dashboard
     */
    public function getDashboardStats(?string $tenantId = null): array
    {
        $user = Auth::user();
        $tenantId = $tenantId ?? $user->tenant_id;

        if (!$tenantId) {
            return [
                'user_tickets' => 0,
                'resolved_tickets' => 0,
                'user_reports' => 0,
                'recent_activities' => [],
            ];
        }

        // Base query for tenant's tickets
        $baseQuery = SupportTicket::forTenant($tenantId);

        // Get tickets assigned to the user
        $userTickets = (clone $baseQuery)
            ->where('assigned_to', $user->id)
            ->count();

        // Get resolved tickets assigned to the user
        $resolvedTickets = (clone $baseQuery)
            ->where('assigned_to', $user->id)
            ->whereNotNull('resolved_at')
            ->count();

        // Get resolution time statistics for all resolved tickets
        $resolvedTicketsQuery = (clone $baseQuery)
            ->where('assigned_to', $user->id)
            ->whereNotNull('resolved_at');

        // Calculate average resolution time
        $stats = $resolvedTicketsQuery
            ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, resolved_at)) as avg_minutes')
            ->first();

        // Format resolution time
        $avgMinutes = $stats && $stats->avg_minutes ? round($stats->avg_minutes) : null;
        $resolutionTimes = [
            'average' => $avgMinutes ? [
                'minutes' => $avgMinutes,
                'hours' => round($avgMinutes / 60, 1)
            ] : null
        ];

        // Get recent activities
        $activities = collect();

        // Get ticket updates activity
        $ticketUpdates = SupportTicketActivityLog::where('user_id', $user->id)
            ->whereIn('action_type', ['status_changed', 'priority_changed', 'category_changed'])
            ->with(['ticket'])
            ->latest()
            ->take(5)
            ->get();

        return [
            'user_tickets' => $userTickets,
            'resolved_tickets' => $resolvedTickets,
            'user_reports' => 0,
            'recent_activities' => $activities,
            'resolution_times' => $resolutionTimes
        ];
    }
} 