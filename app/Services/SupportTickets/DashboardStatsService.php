<?php

namespace App\Services\SupportTickets;

use App\Models\SupportTicket;
use Illuminate\Support\Facades\Auth;

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

        return [
            'user_tickets' => $userTickets,
            'resolved_tickets' => $resolvedTickets,
            'user_reports' => 0, // This can be extended later for actual reports
        ];
    }
} 