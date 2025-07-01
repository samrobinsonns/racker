<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use App\Models\SupportTicketPriority;
use App\Models\SupportTicketStatus;
use App\Models\SupportTicketCategory;
use App\Models\User;
use App\Services\SupportTickets\TicketService;
use App\Services\SupportTickets\ReplyService;
use App\Services\SupportTickets\AttachmentService;
use App\Services\SupportTickets\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SupportTicketsController extends Controller
{
    public function __construct(
        private TicketService $ticketService,
        private ReplyService $replyService,
        private AttachmentService $attachmentService,
        private NotificationService $notificationService
    ) {
        // Middleware will be handled in the routes file
    }

    /**
     * Display ticket list
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', SupportTicket::class);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $tenant = auth()->user()->tenant;
        
        $filters = $request->only([
            'status_id', 'priority_id', 'category_id', 'assignee_id',
            'unassigned', 'overdue', 'escalated', 'source',
            'date_from', 'date_to', 'search'
        ]);

        if (!empty($filters['search'])) {
            $tickets = $this->ticketService->searchTickets(
                $tenantId,
                $filters['search'],
                array_except($filters, ['search']),
                $request->get('per_page', 15)
            );
        } else {
            $tickets = $this->ticketService->getTickets(
                $tenantId,
                $filters,
                $request->get('per_page', 15)
            );
        }

        // Get filter options
        $filterOptions = $this->getFilterOptions($tenantId);

        // Get ticket statistics
        $stats = $this->ticketService->getTicketStats($tenantId);

        return Inertia::render('SupportTickets/Index', [
            'tenantId' => $tenantId,
            'tenant' => $tenant,
            'tickets' => $tickets,
            'filters' => $filters,
            'filterOptions' => $filterOptions,
            'stats' => array_merge($stats, [
                'tenant_id' => $tenantId,
                'tenant_name' => $tenant?->name ?? 'Your Organization',
            ]),
            'permissions' => [
                'create' => auth()->user()->can('create', SupportTicket::class),
                'manage' => auth()->user()->hasPermission('manage_support_tickets'),
                'assign' => auth()->user()->hasPermission('assign_support_tickets'),
            ],
        ]);
    }

    /**
     * Show ticket creation form
     */
    public function create(Request $request): Response
    {
        Gate::authorize('create', SupportTicket::class);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $tenant = auth()->user()->tenant;

        return Inertia::render('SupportTickets/Create', [
            'tenantId' => $tenantId,
            'tenant' => $tenant,
            'stats' => [
                'tenant_id' => $tenantId,
                'tenant_name' => $tenant?->name ?? 'Your Organization',
            ],
            'priorities' => SupportTicketPriority::forTenant($tenantId)->active()->orderBy('level')->get(),
            'categories' => SupportTicketCategory::forTenant($tenantId)->active()->orderBy('name')->get(),
            'statuses' => SupportTicketStatus::forTenant($tenantId)->active()->orderBy('sort_order')->get(),
            'users' => $this->getAssignableUsers($tenantId),
            'contact_id' => $request->input('contact_id'),
            'contact_name' => $request->input('contact_name'),
            'contact_email' => $request->input('contact_email'),
            'contact_phone' => $request->input('contact_phone'),
            'contact_company' => $request->input('contact_company')
        ]);
    }

    /**
     * Store a new ticket
     */
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', SupportTicket::class);

        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'priority_id' => 'required|exists:support_ticket_priorities,id',
            'category_id' => 'required|exists:support_ticket_categories,id',
            'status_id' => 'nullable|exists:support_ticket_statuses,id',
            'assignee_id' => 'nullable|exists:users,id',
            'requester_email' => 'nullable|email',
            'requester_name' => 'nullable|string|max:255',
            'contact_id' => 'nullable|exists:contacts,id',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240', // 10MB max
        ]);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $userId = auth()->id();

        // Add contact_id to the ticket data
        if (!empty($validated['contact_id'])) {
            $validated['contact_id'] = (int) $validated['contact_id'];
        }

        $ticket = $this->ticketService->createTicket($validated, $tenantId, $userId);

        // Handle file attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $this->attachmentService->uploadAttachment($ticket, $file, $userId);
            }
        }

        // Send notifications
        $this->notificationService->notifyTicketCreated($ticket);

        return redirect()
            ->route('support-tickets.show', $ticket)
            ->with('success', 'Support ticket created successfully.');
    }

    /**
     * Display a specific ticket
     */
    public function show(SupportTicket $supportTicket): Response
    {
        Gate::authorize('view', $supportTicket);

        $supportTicket->load([
            'requester',
            'assignee',
            'category',
            'priority',
            'status',
            'replies.user',
            'replies.attachments',
            'attachments.uploader',
            'activityLogs.user'
        ]);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $tenant = auth()->user()->tenant;

        return Inertia::render('SupportTickets/Show', [
            'tenantId' => $tenantId,
            'tenant' => $tenant,
            'stats' => [
                'tenant_id' => $tenantId,
                'tenant_name' => $tenant?->name ?? 'Your Organization',
            ],
            'ticket' => $supportTicket,
            'replies' => $this->replyService->getTicketReplies(
                $supportTicket,
                auth()->user()->hasAnyPermission(['view_support_tickets', 'manage_support_tickets'])
            ),
            'attachments' => $this->attachmentService->getTicketAttachments($supportTicket),
            'priorities' => SupportTicketPriority::forTenant($tenantId)->active()->orderBy('level')->get(),
            'categories' => SupportTicketCategory::forTenant($tenantId)->active()->orderBy('name')->get(),
            'statuses' => SupportTicketStatus::forTenant($tenantId)->active()->orderBy('sort_order')->get(),
            'users' => $this->getAssignableUsers($tenantId),
            'permissions' => [
                'update' => auth()->user()->can('update', $supportTicket),
                'delete' => auth()->user()->can('delete', $supportTicket),
                'manage' => auth()->user()->hasPermission('manage_support_tickets'),
                'assign' => auth()->user()->hasPermission('assign_support_tickets'),
                'reply' => auth()->user()->can('reply', $supportTicket),
            ],
        ]);
    }

    /**
     * Show ticket edit form
     */
    public function edit(SupportTicket $supportTicket): Response
    {
        Gate::authorize('update', $supportTicket);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $tenant = auth()->user()->tenant;

        return Inertia::render('SupportTickets/Edit', [
            'tenantId' => $tenantId,
            'tenant' => $tenant,
            'stats' => [
                'tenant_id' => $tenantId,
                'tenant_name' => $tenant?->name ?? 'Your Organization',
            ],
            'ticket' => $supportTicket->load(['requester', 'assignee', 'category', 'priority', 'status']),
            'priorities' => SupportTicketPriority::forTenant($tenantId)->active()->orderBy('level')->get(),
            'categories' => SupportTicketCategory::forTenant($tenantId)->active()->orderBy('name')->get(),
            'statuses' => SupportTicketStatus::forTenant($tenantId)->active()->orderBy('sort_order')->get(),
            'users' => $this->getAssignableUsers($tenantId),
        ]);
    }

    /**
     * Update a ticket
     */
    public function update(Request $request, SupportTicket $supportTicket): RedirectResponse
    {
        Gate::authorize('update', $supportTicket);

        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'priority_id' => 'required|exists:support_ticket_priorities,id',
            'category_id' => 'nullable|exists:support_ticket_categories,id',
            'status_id' => 'nullable|exists:support_ticket_statuses,id',
            'assignee_id' => 'nullable|exists:users,id',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ]);

        $this->ticketService->updateTicket($supportTicket, $validated, auth()->id());

        return redirect()
            ->route('support-tickets.show', $supportTicket)
            ->with('success', 'Ticket updated successfully.');
    }

    /**
     * Delete a ticket
     */
    public function destroy(SupportTicket $supportTicket): RedirectResponse
    {
        Gate::authorize('delete', $supportTicket);

        $supportTicket->delete();

        return redirect()
            ->route('support-tickets.index')
            ->with('success', 'Ticket deleted successfully.');
    }

    /**
     * Assign ticket to user
     */
    public function assign(Request $request, SupportTicket $supportTicket): RedirectResponse
    {
        Gate::authorize('assign', $supportTicket);

        $validated = $request->validate([
            'assignee_id' => 'required|exists:users,id',
        ]);

        $success = $this->ticketService->assignTicket(
            $supportTicket,
            $validated['assignee_id'],
            auth()->id()
        );

        if ($success) {
            $assignee = User::find($validated['assignee_id']);
            $this->notificationService->notifyTicketAssigned($supportTicket, $assignee, auth()->user());

            return back()->with('success', 'Ticket assigned successfully.');
        }

        return back()->with('error', 'Failed to assign ticket.');
    }

    /**
     * Change ticket status
     */
    public function changeStatus(Request $request, SupportTicket $supportTicket): RedirectResponse
    {
        Gate::authorize('update', $supportTicket);

        $validated = $request->validate([
            'status_id' => 'required|exists:support_ticket_statuses,id',
            'reason' => 'nullable|string|max:500',
        ]);

        $oldStatus = $supportTicket->status->name;
        
        $success = $this->ticketService->changeStatus(
            $supportTicket,
            $validated['status_id'],
            auth()->id(),
            $validated['reason'] ?? null
        );

        if ($success) {
            $newStatus = $supportTicket->fresh()->status->name;
            $this->notificationService->notifyStatusChanged(
                $supportTicket,
                $oldStatus,
                $newStatus,
                auth()->user()
            );

            return back()->with('success', 'Ticket status updated successfully.');
        }

        return back()->with('error', 'Failed to update ticket status.');
    }

    /**
     * Escalate a ticket
     */
    public function escalate(Request $request, SupportTicket $supportTicket): RedirectResponse
    {
        Gate::authorize('escalate', $supportTicket);

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $this->ticketService->escalateTicket($supportTicket, $validated['reason'], auth()->id());
        $this->notificationService->notifyTicketEscalated($supportTicket, $validated['reason'], auth()->user());

        return back()->with('success', 'Ticket escalated successfully.');
    }

    /**
     * Get filter options for the index page
     */
    private function getFilterOptions(string $tenantId): array
    {
        return [
            'priorities' => SupportTicketPriority::forTenant($tenantId)->active()->orderBy('level')->get(),
            'categories' => SupportTicketCategory::forTenant($tenantId)->active()->orderBy('name')->get(),
            'statuses' => SupportTicketStatus::forTenant($tenantId)->active()->orderBy('sort_order')->get(),
            'users' => $this->getAssignableUsers($tenantId),
            'sources' => [
                'web' => 'Web',
                'email' => 'Email',
                'phone' => 'Phone',
                'chat' => 'Chat',
                'api' => 'API',
            ],
        ];
    }

    /**
     * Get users that can be assigned tickets
     */
    private function getAssignableUsers(string $tenantId): \Illuminate\Support\Collection
    {
        return User::where('tenant_id', $tenantId)
            ->whereHas('roles', function ($query) {
                $query->where(function ($q) {
                    $q->whereJsonContains('permissions', 'view_support_tickets')
                      ->orWhereJsonContains('permissions', 'manage_support_tickets');
                });
            })
            ->select(['id', 'name', 'email'])
            ->orderBy('name')
            ->get();
    }
} 