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

        // Get recent activities
        $activities = collect();

        // Get ticket updates activity
        $ticketUpdates = SupportTicketActivityLog::where('user_id', $user->id)
            ->whereIn('action_type', ['status_changed', 'priority_changed', 'category_changed'])
            ->with(['ticket', 'ticket.status', 'ticket.priority'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => 'log_' . $log->id,
                    'type' => 'ticket_updated',
                    'description' => $log->description,
                    'created_at' => $log->created_at,
                    'ticket' => $log->ticket ? [
                        'id' => $log->ticket->id,
                        'ticket_number' => $log->ticket->ticket_number,
                        'status' => $log->ticket->status->name,
                        'priority' => $log->ticket->priority->name,
                    ] : null,
                ];
            });
        $activities = $activities->concat($ticketUpdates);

        // Get ticket comments activity
        $ticketComments = SupportTicketReply::where('created_by', $user->id)
            ->with(['ticket', 'ticket.status', 'ticket.priority'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($reply) {
                return [
                    'id' => 'reply_' . $reply->id,
                    'type' => 'ticket_comment',
                    'description' => "Commented on ticket #{$reply->ticket->ticket_number}",
                    'created_at' => $reply->created_at,
                    'ticket' => [
                        'id' => $reply->ticket->id,
                        'ticket_number' => $reply->ticket->ticket_number,
                        'status' => $reply->ticket->status->name,
                        'priority' => $reply->ticket->priority->name,
                    ],
                ];
            });
        $activities = $activities->concat($ticketComments);

        // Sort activities by date and take the most recent 15
        $activities = $activities->sortByDesc('created_at')->take(15)->values();

        return [
            'user_tickets' => $userTickets,
            'resolved_tickets' => $resolvedTickets,
            'user_reports' => 0, // This can be extended later for actual reports
            'recent_activities' => $activities,
        ];
    }
} 