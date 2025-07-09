<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Validation\Rule;
use App\Models\User;
use App\Services\SupportTickets\DashboardStatsService;

class ProfileController extends Controller
{
    protected DashboardStatsService $dashboardStatsService;

    public function __construct(DashboardStatsService $dashboardStatsService)
    {
        $this->dashboardStatsService = $dashboardStatsService;
    }

    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $stats = [];
        $tenantId = null;
        
        // Determine layout and stats based on user type (same logic as dashboard)
        if ($user->is_central_admin) {
            // Central Admin stats
            $controller = app(\App\Http\Controllers\Admin\CentralAdminController::class);
            $stats = $controller->getDashboardStats();
        } elseif ($user->hasRole('tenant_admin')) {
            // Tenant Admin stats
            $controller = app(\App\Http\Controllers\Admin\TenantAdminController::class);
            $stats = $controller->getDashboardStats();
            $tenantId = $stats['tenant_id'] ?? $user->tenant_id;
        } elseif ($user->tenant_id) {
            // Tenant User
            $tenantId = $user->tenant_id;
            $tenant = $user->tenant;
            $stats = array_merge(
                $this->dashboardStatsService->getDashboardStats($tenantId),
                [
                    'tenant_id' => $tenantId,
                    'tenant_name' => $tenant?->name ?? 'Your Organization',
                ]
            );
        }
        
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'stats' => $stats,
            'tenantId' => $tenantId,
            'user' => array_merge($user->toArray(), [
                'title' => $user->title,
                'company' => $user->company,
                'location' => $user->location,
                'bio' => $user->bio,
                'website' => $user->website,
            ]),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($request->user()->id),
            ],
            'title' => ['nullable', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'website' => ['nullable', 'url', 'max:255'],
        ]);

        $request->user()->fill($validated);

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    /**
     * Get the user's recent activities.
     */
    public function activities(Request $request)
    {
        $user = $request->user();
        $activities = collect();
        
        // Get assigned tickets
        $assignedTickets = $user->assignedTickets()
            ->with(['status', 'priority'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($ticket) {
                return [
                    'id' => 'ticket_' . $ticket->id,
                    'type' => 'ticket_assigned',
                    'description' => "Ticket #{$ticket->ticket_number}: {$ticket->subject}",
                    'created_at' => $ticket->created_at,
                    'metadata' => [
                        'ticket_id' => $ticket->id,
                        'ticket_number' => $ticket->ticket_number,
                        'status' => $ticket->status->name,
                        'priority' => $ticket->priority->name,
                    ]
                ];
            });
        $activities = $activities->concat($assignedTickets);

        // Get ticket replies
        $ticketReplies = $user->ticketReplies()
            ->with(['ticket'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($reply) {
                return [
                    'id' => 'reply_' . $reply->id,
                    'type' => 'ticket_reply',
                    'description' => "Replied to ticket #{$reply->ticket->ticket_number}",
                    'created_at' => $reply->created_at,
                    'metadata' => [
                        'ticket_id' => $reply->ticket->id,
                        'ticket_number' => $reply->ticket->ticket_number,
                        'is_internal' => $reply->is_internal,
                    ]
                ];
            });
        $activities = $activities->concat($ticketReplies);

        // Get ticket status changes
        $statusChanges = $user->ticketStatusChanges()
            ->with(['ticket'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($change) {
                return [
                    'id' => 'status_' . $change->id,
                    'type' => 'ticket_status_changed',
                    'description' => "Changed status of ticket #{$change->ticket->ticket_number} to {$change->new_status}",
                    'created_at' => $change->created_at,
                    'metadata' => [
                        'ticket_id' => $change->ticket->id,
                        'ticket_number' => $change->ticket->ticket_number,
                        'old_status' => $change->old_status,
                        'new_status' => $change->new_status,
                    ]
                ];
            });
        $activities = $activities->concat($statusChanges);

        // Sort all activities by created_at and take the most recent 15
        $activities = $activities
            ->sortByDesc('created_at')
            ->take(15)
            ->values();

        return response()->json([
            'activities' => $activities
        ]);
    }

    /**
     * Display the user's public profile.
     */
    public function show(User $user): Response
    {
        // Load necessary relationships and additional data
        $user->load(['tenant', 'roles']);

        // Get user's activities
        $activities = collect();
        
        // Get assigned tickets
        $assignedTickets = $user->assignedTickets()
            ->with(['status', 'priority'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($ticket) {
                return [
                    'id' => 'ticket_' . $ticket->id,
                    'type' => 'ticket_assigned',
                    'description' => "Ticket #{$ticket->ticket_number}: {$ticket->subject}",
                    'created_at' => $ticket->created_at,
                    'metadata' => [
                        'ticket_id' => $ticket->id,
                        'ticket_number' => $ticket->ticket_number,
                        'status' => $ticket->status->name,
                        'priority' => $ticket->priority->name,
                    ]
                ];
            });
        $activities = $activities->concat($assignedTickets);

        // Get ticket replies
        $ticketReplies = $user->ticketReplies()
            ->with(['ticket'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($reply) {
                return [
                    'id' => 'reply_' . $reply->id,
                    'type' => 'ticket_reply',
                    'description' => "Replied to ticket #{$reply->ticket->ticket_number}",
                    'created_at' => $reply->created_at,
                    'metadata' => [
                        'ticket_id' => $reply->ticket->id,
                        'ticket_number' => $reply->ticket->ticket_number,
                        'is_internal' => $reply->is_internal,
                    ]
                ];
            });
        $activities = $activities->concat($ticketReplies);

        // Get ticket status changes
        $statusChanges = $user->ticketStatusChanges()
            ->with(['ticket'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($change) {
                return [
                    'id' => 'status_' . $change->id,
                    'type' => 'ticket_status_changed',
                    'description' => "Changed status of ticket #{$change->ticket->ticket_number} to {$change->new_values['status']}",
                    'created_at' => $change->created_at,
                    'metadata' => [
                        'ticket_id' => $change->ticket->id,
                        'ticket_number' => $change->ticket->ticket_number,
                        'old_status' => $change->old_values['status'],
                        'new_status' => $change->new_values['status'],
                    ]
                ];
            });
        $activities = $activities->concat($statusChanges);

        // Sort all activities by created_at and take the most recent 15
        $activities = $activities
            ->sortByDesc('created_at')
            ->take(15)
            ->values();

        return Inertia::render('Profile/Show', [
            'profileUser' => array_merge($user->toArray(), [
                'title' => $user->title,
                'company' => $user->company,
                'location' => $user->location,
                'bio' => $user->bio,
                'website' => $user->website,
                'created_at_formatted' => $user->created_at->format('F j, Y'),
                'activities' => $activities,
            ]),
        ]);
    }
}
