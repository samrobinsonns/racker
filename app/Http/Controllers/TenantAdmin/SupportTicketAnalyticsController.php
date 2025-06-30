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

        $tickets = SupportTicket::forTenant($tenantId)
            ->when($period === 'day', function ($query) {
                return $query->whereDate('created_at', today());
            })
            ->when($period === 'week', function ($query) {
                return $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
            })
            ->when($period === 'month', function ($query) {
                return $query->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year);
            })
            ->when($period === 'year', function ($query) {
                return $query->whereYear('created_at', now()->year);
            });

        $analytics = [
            'total_tickets' => $tickets->count(),
            'open_tickets' => $tickets->whereNull('resolved_at')->count(),
            'resolved_tickets' => $tickets->whereNotNull('resolved_at')->count(),
            'escalated_tickets' => $tickets->whereNotNull('escalated_at')->count(),
            'average_resolution_time' => $tickets->whereNotNull('resolved_at')
                ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as avg_time')
                ->value('avg_time'),
            'tickets_by_category' => $tickets->with('category')
                ->get()
                ->groupBy('category.name')
                ->map(fn ($group) => $group->count()),
            'tickets_by_priority' => $tickets->get()
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
} 