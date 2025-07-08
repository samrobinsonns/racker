<?php

namespace App\Http\Controllers\TenantAdmin;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SupportTicketAnalyticsController extends Controller
{
    /**
     * Display the support ticket analytics page.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', 'App\Models\SupportTicketSettings');

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $tenant = auth()->user()->tenant;
        $period = $request->get('period', 'month'); // day, week, month, year

        $analytics = $this->getAnalyticsData($tenantId, $period);

        return Inertia::render('TenantAdmin/SupportTickets/Analytics/Index', [
            'tenantId' => $tenantId,
            'tenant' => $tenant,
            'stats' => [
                'tenant_id' => $tenantId,
                'tenant_name' => $tenant?->name ?? 'Your Organization',
            ],
            'analytics' => $analytics,
            'period' => $period,
        ]);
    }

    /**
     * Get analytics data as JSON for AJAX requests.
     */
    public function data(Request $request)
    {
        Gate::authorize('viewAny', 'App\Models\SupportTicketSettings');

        $user = auth()->user();
        $tenantId = $user->tenant_id ?? session('impersonated_tenant_id');
        
        \Log::debug('Tenant Resolution Debug', [
            'user_id' => $user->id,
            'user_tenant_id' => $user->tenant_id,
            'session_tenant_id' => session('impersonated_tenant_id'),
            'resolved_tenant_id' => $tenantId,
            'user_is_central_admin' => $user->is_central_admin ?? false,
            'session_data' => session()->all(),
            'request_url' => $request->url(),
        ]);

        if (!$tenantId) {
            \Log::error('No tenant ID resolved for analytics request', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'route' => $request->route()->getName(),
            ]);
            
            return response()->json([
                'error' => 'No tenant context available',
                'tickets_by_category' => ['No Tenant Context' => 1],
                'tickets_by_priority' => ['No Tenant Context' => 1],
            ], 422);
        }

        $period = $request->input('period', 'month'); // Use input() instead of get() for POST body data

        $analytics = $this->getAnalyticsData($tenantId, $period);

        return response()->json($analytics);
    }

    /**
     * Get analytics data for a given tenant and period.
     */
    private function getAnalyticsData($tenantId, $period)
    {
        \Log::debug('Analytics Tenant Debug', [
            'tenant_id' => $tenantId,
            'period' => $period,
            'current_user_id' => auth()->id(),
            'current_user_tenant' => auth()->user()->tenant_id,
            'session_tenant' => session('impersonated_tenant_id'),
        ]);

        $baseQuery = SupportTicket::forTenant($tenantId);

        // Build the period condition with qualified column names
        $periodCondition = function($query) use ($period) {
            $query->when($period === 'day', function ($q) {
                return $q->whereDate('support_tickets.created_at', today());
            })
            ->when($period === 'week', function ($q) {
                return $q->whereBetween('support_tickets.created_at', [now()->startOfWeek(), now()->endOfWeek()]);
            })
            ->when($period === 'month', function ($q) {
                return $q->whereMonth('support_tickets.created_at', now()->month)
                    ->whereYear('support_tickets.created_at', now()->year);
            })
            ->when($period === 'year', function ($q) {
                return $q->whereYear('support_tickets.created_at', now()->year);
            });
        };

        return [
            'total_tickets' => (clone $baseQuery)->tap($periodCondition)->count(),
            'open_tickets' => (clone $baseQuery)->tap($periodCondition)->whereNull('support_tickets.resolved_at')->count(),
            'resolved_tickets' => (clone $baseQuery)->tap($periodCondition)->whereNotNull('support_tickets.resolved_at')->count(),
            'escalated_tickets' => (clone $baseQuery)->tap($periodCondition)->whereNotNull('support_tickets.escalated_at')->count(),
            'resolution_time_stats' => $this->calculateResolutionTimeStats(clone $baseQuery),
            'tickets_by_category' => (function() use ($baseQuery, $periodCondition, $tenantId) {
                // Use a join-based approach to ensure proper tenant scoping
                $categoryStats = (clone $baseQuery)
                    ->tap($periodCondition)
                    ->leftJoin('support_ticket_categories', function($join) use ($tenantId) {
                        $join->on('support_tickets.category_id', '=', 'support_ticket_categories.id')
                             ->where('support_ticket_categories.tenant_id', '=', $tenantId);
                    })
                    ->selectRaw('
                        COALESCE(support_ticket_categories.name, "Uncategorized") as category_name,
                        COUNT(support_tickets.id) as ticket_count
                    ')
                    ->groupBy('category_name')

                    ->get();
                
                \Log::debug('Category Analysis (Fixed)', [
                    'tenant_id' => $tenantId,
                    'category_stats' => $categoryStats->toArray(),
                ]);
                
                return $categoryStats->pluck('ticket_count', 'category_name')->toArray();
            })(),
            'tickets_by_priority' => (function() use ($baseQuery, $periodCondition, $tenantId) {
                // Use a join-based approach with mixed tenant scoping for priorities
                $priorityStats = (clone $baseQuery)
                    ->tap($periodCondition)
                    ->leftJoin('support_ticket_priorities', function($join) use ($tenantId) {
                        $join->on('support_tickets.priority_id', '=', 'support_ticket_priorities.id')
                             ->where(function($query) use ($tenantId) {
                                 $query->where('support_ticket_priorities.tenant_id', '=', $tenantId)
                                       ->orWhereNull('support_ticket_priorities.tenant_id');
                             });
                    })
                    ->selectRaw('
                        COALESCE(support_ticket_priorities.name, "No Priority") as priority_name,
                        COUNT(support_tickets.id) as ticket_count
                    ')
                    ->groupBy('priority_name')
                    ->get();
                
                \Log::debug('Priority Analysis (Fixed)', [
                    'tenant_id' => $tenantId,
                    'priority_stats' => $priorityStats->toArray(),
                ]);
                
                return $priorityStats->pluck('ticket_count', 'priority_name')->toArray();
            })(),
        ];
    }

    /**
     * Calculate detailed resolution time statistics
     */
    private function calculateResolutionTimeStats($tickets)
    {
        // Get business hours configuration
        $businessHours = config('support-tickets.business_hours', [
            'start' => '09:00',
            'end' => '17:00',
            'timezone' => 'UTC',
            'working_days' => [1, 2, 3, 4, 5], // Monday to Friday
        ]);

        // Get base resolution time stats with properly qualified column names
        $stats = $tickets->whereNotNull('support_tickets.resolved_at')
            ->selectRaw('
                AVG(TIMESTAMPDIFF(MINUTE, support_tickets.created_at, support_tickets.resolved_at)) as avg_minutes,
                MIN(TIMESTAMPDIFF(MINUTE, support_tickets.created_at, support_tickets.resolved_at)) as min_minutes,
                MAX(TIMESTAMPDIFF(MINUTE, support_tickets.created_at, support_tickets.resolved_at)) as max_minutes
            ')
            ->first();

        if (!$stats || !$stats->avg_minutes) {
            return [
                'average' => null,
                'minimum' => null,
                'maximum' => null,
                'formatted' => [
                    'average' => 'N/A',
                    'minimum' => 'N/A',
                    'maximum' => 'N/A'
                ]
            ];
        }

        // Format the times
        return [
            'average' => [
                'minutes' => round($stats->avg_minutes),
                'hours' => round($stats->avg_minutes / 60, 1),
                'days' => round($stats->avg_minutes / 1440, 1), // 1440 = minutes in a day
            ],
            'minimum' => [
                'minutes' => $stats->min_minutes,
                'hours' => round($stats->min_minutes / 60, 1),
                'days' => round($stats->min_minutes / 1440, 1),
            ],
            'maximum' => [
                'minutes' => $stats->max_minutes,
                'hours' => round($stats->max_minutes / 60, 1),
                'days' => round($stats->max_minutes / 1440, 1),
            ],
            'formatted' => [
                'average' => $this->formatDuration($stats->avg_minutes),
                'minimum' => $this->formatDuration($stats->min_minutes),
                'maximum' => $this->formatDuration($stats->max_minutes)
            ]
        ];
    }

    /**
     * Format duration in minutes to a human-readable string
     */
    private function formatDuration(int $minutes): string
    {
        if ($minutes < 60) {
            return "{$minutes}m";
        }

        if ($minutes < 1440) { // Less than 24 hours
            $hours = floor($minutes / 60);
            $mins = $minutes % 60;
            return $mins > 0 ? "{$hours}h {$mins}m" : "{$hours}h";
        }

        $days = floor($minutes / 1440);
        $hours = floor(($minutes % 1440) / 60);
        $mins = $minutes % 60;

        $parts = [];
        if ($days > 0) $parts[] = "{$days}d";
        if ($hours > 0) $parts[] = "{$hours}h";
        if ($mins > 0) $parts[] = "{$mins}m";

        return implode(' ', $parts);
    }
} 