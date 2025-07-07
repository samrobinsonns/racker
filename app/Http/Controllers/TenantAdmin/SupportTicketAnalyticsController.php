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

        $baseQuery = SupportTicket::forTenant($tenantId);

        // Build the period condition
        $periodCondition = function($query) use ($period) {
            $query->when($period === 'day', function ($q) {
                return $q->whereDate('created_at', today());
            })
            ->when($period === 'week', function ($q) {
                return $q->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
            })
            ->when($period === 'month', function ($q) {
                return $q->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year);
            })
            ->when($period === 'year', function ($q) {
                return $q->whereYear('created_at', now()->year);
            });
        };

        $analytics = [
            'total_tickets' => (clone $baseQuery)->tap($periodCondition)->count(),
            'open_tickets' => (clone $baseQuery)->tap($periodCondition)->whereNull('resolved_at')->count(),
            'resolved_tickets' => (clone $baseQuery)->tap($periodCondition)->whereNotNull('resolved_at')->count(),
            'escalated_tickets' => (clone $baseQuery)->tap($periodCondition)->whereNotNull('escalated_at')->count(),
            'resolution_time_stats' => $this->calculateResolutionTimeStats($baseQuery),
            'tickets_by_category' => (clone $baseQuery)
                ->tap($periodCondition)
                ->with('category')
                ->get()
                ->groupBy('category.name')
                ->map(fn ($group) => $group->count()),
            'tickets_by_priority' => (clone $baseQuery)
                ->tap($periodCondition)
                ->get()
                ->groupBy('priority')
                ->map(fn ($group) => $group->count()),
        ];

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

        // Get base resolution time stats
        $stats = $tickets->whereNotNull('resolved_at')
            ->selectRaw('
                AVG(TIMESTAMPDIFF(MINUTE, created_at, resolved_at)) as avg_minutes,
                MIN(TIMESTAMPDIFF(MINUTE, created_at, resolved_at)) as min_minutes,
                MAX(TIMESTAMPDIFF(MINUTE, created_at, resolved_at)) as max_minutes
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