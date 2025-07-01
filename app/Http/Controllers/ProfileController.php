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

class ProfileController extends Controller
{
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
            $stats = [
                'tenant_id' => $tenantId,
                'tenant_name' => $tenant?->name ?? 'Your Organization',
            ];
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
        
        // Get currently assigned tickets that are not closed/resolved
        $activities = $user->assignedTickets()
            ->with(['status', 'priority'])
            ->whereHas('status', function($query) {
                $query->where('is_closed', false);
            })
            ->whereNull('resolved_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($ticket) {
                return [
                    'id' => 'ticket_' . $ticket->id,
                    'type' => 'assigned_ticket',
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

        return response()->json([
            'activities' => $activities
        ]);
    }
}
