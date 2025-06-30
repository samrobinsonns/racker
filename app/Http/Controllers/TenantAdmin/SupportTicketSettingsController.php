<?php

namespace App\Http\Controllers\TenantAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SupportTicketSettingsController extends Controller
{
    /**
     * Display the support ticket settings page.
     */
    public function index(): Response
    {
        Gate::authorize('viewAny', 'App\Models\SupportTicketSettings');

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $tenant = auth()->user()->tenant;
        $settings = config('support-tickets');

        return Inertia::render('TenantAdmin/SupportTickets/Settings/Index', [
            'tenantId' => $tenantId,
            'tenant' => $tenant,
            'stats' => [
                'tenant_id' => $tenantId,
                'tenant_name' => $tenant?->name ?? 'Your Organization',
            ],
            'settings' => $settings,
            'permissions' => [
                'update' => auth()->user()->can('update', 'App\Models\SupportTicketSettings'),
            ],
        ]);
    }

    /**
     * Update the support ticket settings.
     */
    public function update(Request $request)
    {
        Gate::authorize('update', 'App\Models\SupportTicketSettings');

        $validated = $request->validate([
            'auto_assign_tickets' => 'boolean',
            'notify_admins_on_new_ticket' => 'boolean',
            'notify_assignee_on_update' => 'boolean',
            'allow_file_attachments' => 'boolean',
            'max_attachment_size' => 'integer|min:1|max:100',
            'allowed_file_types' => 'array',
            'allowed_file_types.*' => 'string',
            'default_priority' => 'string|in:low,medium,high,urgent',
            'auto_close_resolved_after_days' => 'integer|min:1',
        ]);

        // Update the settings in the database or config
        // This will depend on how you want to store tenant-specific settings
        
        return redirect()
            ->route('tenant-admin.support-tickets.settings')
            ->with('success', 'Settings updated successfully.');
    }
} 