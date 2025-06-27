<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Services\SupportTickets\TicketService;
use App\Enums\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SupportTicketController extends Controller
{
    protected TicketService $ticketService;

    public function __construct(TicketService $ticketService)
    {
        $this->ticketService = $ticketService;
    }

    /**
     * Get a list of tickets with filtering and pagination
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', SupportTicket::class);

        $filters = $request->validate([
            'status_id' => 'nullable|exists:support_ticket_statuses,id',
            'priority_id' => 'nullable|exists:support_ticket_priorities,id',
            'category_id' => 'nullable|exists:support_ticket_categories,id',
            'assignee_id' => 'nullable|exists:users,id',
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:100',
            'sort_by' => 'nullable|string|in:created_at,updated_at,priority,status',
            'sort_direction' => 'nullable|string|in:asc,desc',
        ]);

        try {
            $tickets = $this->ticketService->getTickets($filters);

            return response()->json([
                'success' => true,
                'tickets' => $tickets,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch tickets: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new support ticket
     */
    public function store(Request $request)
    {
        $this->authorize('create', SupportTicket::class);

        $validatedData = $request->validate([
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'priority_id' => 'required|exists:support_ticket_priorities,id',
            'category_id' => 'nullable|exists:support_ticket_categories,id',
            'assignee_id' => 'nullable|exists:users,id',
            'attachments.*' => 'nullable|file|max:10240', // 10MB max per file
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'custom_fields' => 'nullable|array',
        ]);

        try {
            $ticket = $this->ticketService->createTicket(
                $validatedData,
                Auth::user()->tenant_id,
                Auth::id()
            );

            return response()->json([
                'success' => true,
                'message' => 'Ticket created successfully!',
                'ticket' => $ticket,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create ticket: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get a specific ticket
     */
    public function show(SupportTicket $ticket)
    {
        $this->authorize('view', $ticket);

        try {
            $ticket->load([
                'requester',
                'assignee',
                'category',
                'priority',
                'status',
                'replies.user',
                'replies.attachments',
                'attachments',
                'activityLogs',
            ]);

            return response()->json([
                'success' => true,
                'ticket' => $ticket,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch ticket: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a ticket
     */
    public function update(Request $request, SupportTicket $ticket)
    {
        $this->authorize('update', $ticket);

        $validatedData = $request->validate([
            'subject' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'priority_id' => 'sometimes|required|exists:support_ticket_priorities,id',
            'category_id' => 'nullable|exists:support_ticket_categories,id',
            'assignee_id' => 'nullable|exists:users,id',
            'status_id' => 'sometimes|required|exists:support_ticket_statuses,id',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'custom_fields' => 'nullable|array',
        ]);

        try {
            $ticket = $this->ticketService->updateTicket($ticket, $validatedData);

            return response()->json([
                'success' => true,
                'message' => 'Ticket updated successfully!',
                'ticket' => $ticket,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update ticket: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Delete a ticket
     */
    public function destroy(SupportTicket $ticket)
    {
        $this->authorize('delete', $ticket);

        try {
            $this->ticketService->deleteTicket($ticket);

            return response()->json([
                'success' => true,
                'message' => 'Ticket deleted successfully!',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete ticket: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Assign a ticket to a user
     */
    public function assign(Request $request, SupportTicket $ticket)
    {
        $this->authorize('assign', $ticket);

        $validatedData = $request->validate([
            'assignee_id' => 'required|exists:users,id',
        ]);

        try {
            $ticket = $this->ticketService->assignTicket($ticket, $validatedData['assignee_id']);

            return response()->json([
                'success' => true,
                'message' => 'Ticket assigned successfully!',
                'ticket' => $ticket,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign ticket: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Escalate a ticket
     */
    public function escalate(Request $request, SupportTicket $ticket)
    {
        $this->authorize('escalate', $ticket);

        $validatedData = $request->validate([
            'escalation_reason' => 'required|string|max:255',
        ]);

        try {
            $ticket = $this->ticketService->escalateTicket($ticket, $validatedData['escalation_reason']);

            return response()->json([
                'success' => true,
                'message' => 'Ticket escalated successfully!',
                'ticket' => $ticket,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to escalate ticket: ' . $e->getMessage(),
            ], 422);
        }
    }
} 