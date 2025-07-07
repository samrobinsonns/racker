<?php

namespace App\Services\SupportTickets;

use App\Models\SupportTicket;
use App\Models\SupportTicketPriority;
use App\Models\SupportTicketStatus;
use App\Models\SupportTicketCategory;
use App\Models\SupportTicketActivityLog;
use App\Models\User;
use App\Models\Contact;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class TicketService
{
    /**
     * Find or create a contact from email information
     */
    public function findOrCreateContactFromEmail(string $email, string $name, string $tenantId): Contact
    {
        // First try to find existing contact by email
        $contact = Contact::where('tenant_id', $tenantId)
            ->where('email', $email)
            ->first();
            
        if ($contact) {
            // Update name if it's more complete than what we have
            if (strlen($name) > strlen($contact->first_name . ' ' . $contact->last_name)) {
                $nameParts = explode(' ', trim($name), 2);
                $firstName = $nameParts[0] ?? '';
                $lastName = $nameParts[1] ?? '';
                
                $contact->update([
                    'first_name' => $firstName ?: $contact->first_name,
                    'last_name' => $lastName ?: $contact->last_name,
                ]);
            }
            
            return $contact;
        }
        
        // Create new contact
        $nameParts = explode(' ', trim($name), 2);
        $firstName = $nameParts[0] ?? '';
        $lastName = $nameParts[1] ?? '';
        
        // If no name provided, use email prefix as first name
        if (empty($firstName) && empty($lastName)) {
            $emailPrefix = explode('@', $email)[0];
            $firstName = ucfirst(str_replace(['.', '_', '-'], ' ', $emailPrefix));
        }
        
        return Contact::create([
            'tenant_id' => $tenantId,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'source' => 'email_ticket',
            'status' => 'active',
            'type' => 'customer',
        ]);
    }

    /**
     * Create a new support ticket
     */
    public function createTicket(array $data, string $tenantId, ?int $userId = null): SupportTicket
    {
        \Log::info('Creating ticket with data:', [
            'contact_id' => $data['contact_id'] ?? null,
            'requester_email' => $data['requester_email'] ?? null,
            'requester_name' => $data['requester_name'] ?? null,
            'subject' => $data['subject'] ?? null,
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'assigned_to' => $data['assigned_to'] ?? null,
        ]);

        // Set default status if not provided
        if (!isset($data['status_id'])) {
            $defaultStatus = SupportTicketStatus::forTenant($tenantId)
                ->where('slug', 'new')
                ->active()
                ->first();
            $data['status_id'] = $defaultStatus->id;
        }

        // Set default priority if not provided
        if (!isset($data['priority_id'])) {
            $defaultPriority = SupportTicketPriority::forTenant($tenantId)
                ->where('level', 3) // Medium priority
                ->active()
                ->first();
            $data['priority_id'] = $defaultPriority->id;
        }

        // Ensure tenant_id is set
        $data['tenant_id'] = $tenantId;

        // Set requester information
        if ($userId && !isset($data['requester_id'])) {
            $user = User::find($userId);
            $data['requester_id'] = $userId;
            $data['requester_email'] = $user->email;
            $data['requester_name'] = $user->name;
        }

        // Set created_by to the current user
        $data['created_by'] = $userId;

        // Set source if not provided
        $data['source'] = $data['source'] ?? 'web';

        // Auto-create or find contact for email-created tickets
        if ($data['source'] === 'email' && !empty($data['requester_email']) && empty($data['contact_id'])) {
            $contact = $this->findOrCreateContactFromEmail(
                $data['requester_email'],
                $data['requester_name'] ?? '',
                $tenantId
            );
            $data['contact_id'] = $contact->id;
            
            \Log::info('Auto-created/found contact for email ticket:', [
                'contact_id' => $contact->id,
                'email' => $contact->email,
                'name' => $contact->first_name . ' ' . $contact->last_name,
            ]);
        }

        \Log::info('Creating ticket in database with final data:', [
            'contact_id' => $data['contact_id'] ?? null,
            'requester_email' => $data['requester_email'] ?? null,
            'requester_name' => $data['requester_name'] ?? null,
            'subject' => $data['subject'] ?? null,
            'tenant_id' => $data['tenant_id'],
            'created_by' => $data['created_by'],
            'status_id' => $data['status_id'],
            'priority_id' => $data['priority_id'],
        ]);

        $ticket = SupportTicket::create($data);

        \Log::info('Ticket created:', [
            'ticket_id' => $ticket->id,
            'ticket_number' => $ticket->ticket_number,
            'contact_id' => $ticket->contact_id,
        ]);

        // Log ticket creation
        SupportTicketActivityLog::logTicketCreated($ticket, $userId);

        // If ticket was assigned, trigger notification
        if (!empty($data['assigned_to'])) {
            $assignee = User::find($data['assigned_to']);
            if ($assignee) {
                app(NotificationService::class)->notifyTicketAssigned($ticket, $assignee, $userId ? User::find($userId) : null);
            }
        }

        return $ticket;
    }

    /**
     * Update a support ticket
     */
    public function updateTicket(SupportTicket $ticket, array $data, ?int $userId = null): SupportTicket
    {
        $oldValues = $ticket->only(array_keys($data));
        
        // Check if status is being changed
        $statusChanged = isset($data['status_id']) && 
                        isset($oldValues['status_id']) && 
                        $data['status_id'] !== $oldValues['status_id'];
        
        $oldStatus = null;
        if ($statusChanged) {
            $oldStatus = $ticket->status->name;
        }
        
        $ticket->update($data);
        
        // Log significant changes
        $this->logSignificantChanges($ticket, $oldValues, $data, $userId);

        // Handle status change notifications
        if ($statusChanged) {
            $newStatus = $ticket->fresh()->status->name;
            $changedBy = $userId ? User::find($userId) : null;
            
            app(\App\Services\SupportTickets\NotificationService::class)->notifyStatusChanged(
                $ticket,
                $oldStatus,
                $newStatus,
                $changedBy
            );
        }

        return $ticket->fresh();
    }

    /**
     * Assign ticket to a user
     */
    public function assignTicket(SupportTicket $ticket, int $assigneeId, ?int $assignedBy = null): bool
    {
        $assignee = User::find($assigneeId);
        if (!$assignee) {
            return false;
        }

        // Check if assignee belongs to the same tenant
        if ($assignee->tenant_id !== $ticket->tenant_id && !$assignee->is_central_admin) {
            return false;
        }

        $ticket->assignTo($assigneeId, $assignedBy);

        return true;
    }

    /**
     * Change ticket status
     */
    public function changeStatus(SupportTicket $ticket, int $statusId, ?int $userId = null, ?string $reason = null): bool
    {
        $newStatus = SupportTicketStatus::find($statusId);
        if (!$newStatus) {
            return false;
        }

        // Validate status transition
        if (!$ticket->status->canTransitionTo($newStatus->slug)) {
            return false;
        }

        $success = $ticket->updateStatus($statusId, $userId, $reason);

        if ($success) {
            // Update resolved/closed timestamps
            $this->updateStatusTimestamps($ticket, $newStatus);
        }

        return $success;
    }

    /**
     * Escalate a ticket
     */
    public function escalateTicket(SupportTicket $ticket, string $reason, ?int $userId = null): void
    {
        $ticket->escalate($reason, $userId);
    }

    /**
     * Get tickets with filters and pagination
     */
    public function getTickets(string $tenantId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = SupportTicket::with(['requester', 'assignee', 'category', 'priority', 'status'])
            ->forTenant($tenantId);

        $query = $this->applyFilters($query, $filters);

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Get ticket statistics for a tenant
     */
    public function getTicketStats(string $tenantId): array
    {
        return [
            'total' => SupportTicket::forTenant($tenantId)->count(),
            'open' => SupportTicket::forTenant($tenantId)->open()->count(),
            'unassigned' => SupportTicket::forTenant($tenantId)->unassigned()->count(),
            'overdue' => SupportTicket::forTenant($tenantId)->overdue()->count(),
            'escalated' => SupportTicket::forTenant($tenantId)->escalated()->count(),
            'resolved_today' => SupportTicket::forTenant($tenantId)->whereDate('resolved_at', today())->count(),
            'created_today' => SupportTicket::forTenant($tenantId)->whereDate('created_at', today())->count(),
            'by_priority' => $this->getTicketsByPriority($tenantId),
            'by_status' => $this->getTicketsByStatus($tenantId),
            'by_category' => $this->getTicketsByCategory($tenantId),
        ];
    }

    /**
     * Get tickets assigned to a specific user
     */
    public function getUserTickets(int $userId, string $tenantId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = SupportTicket::with(['requester', 'category', 'priority', 'status'])
            ->forTenant($tenantId)
            ->assignedTo($userId);

        $query = $this->applyFilters($query, $filters);

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Search tickets
     */
    public function searchTickets(string $tenantId, string $search, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = SupportTicket::with(['requester', 'assignee', 'category', 'priority', 'status'])
            ->forTenant($tenantId)
            ->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('requester_email', 'like', "%{$search}%")
                  ->orWhere('requester_name', 'like', "%{$search}%");
            });

        $query = $this->applyFilters($query, $filters);

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Apply filters to ticket query
     */
    private function applyFilters(Builder $query, array $filters): Builder
    {
        if (!empty($filters['status_id'])) {
            $query->where('status_id', $filters['status_id']);
        }

        if (!empty($filters['priority_id'])) {
            $query->where('priority_id', $filters['priority_id']);
        }

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (isset($filters['assignee_id'])) {
            if ($filters['assignee_id'] === 'unassigned') {
                $query->whereNull('assigned_to');
            } else {
                $query->where('assigned_to', $filters['assignee_id']);
            }
        }

        if (isset($filters['unassigned']) && $filters['unassigned']) {
            $query->whereNull('assignee_id');
        }

        if (isset($filters['overdue']) && $filters['overdue']) {
            $query->overdue();
        }

        if (isset($filters['escalated']) && $filters['escalated']) {
            $query->escalated();
        }

        if (!empty($filters['source'])) {
            $query->where('source', $filters['source']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query;
    }

    /**
     * Log significant changes to ticket
     */
    private function logSignificantChanges(SupportTicket $ticket, array $oldValues, array $newValues, ?int $userId): void
    {
        $significantFields = ['priority_id', 'category_id', 'assignee_id', 'status_id', 'subject'];

        foreach ($significantFields as $field) {
            if (isset($oldValues[$field]) && isset($newValues[$field]) && $oldValues[$field] !== $newValues[$field]) {
                $this->logFieldChange($ticket, $field, $oldValues[$field], $newValues[$field], $userId);
            }
        }
    }

    /**
     * Log a specific field change
     */
    private function logFieldChange(SupportTicket $ticket, string $field, $oldValue, $newValue, ?int $userId): void
    {
        $actionType = match($field) {
            'priority_id' => 'priority_changed',
            'category_id' => 'category_changed',
            'assignee_id' => 'assigned',
            'status_id' => 'status_changed',
            default => 'updated'
        };

        $description = match($field) {
            'priority_id' => 'Priority changed',
            'category_id' => 'Category changed',
            'assignee_id' => 'Assignee changed',
            'status_id' => 'Status changed',
            'subject' => 'Subject updated',
            default => ucfirst(str_replace('_', ' ', $field)) . ' updated'
        };

        SupportTicketActivityLog::create([
            'ticket_id' => $ticket->id,
            'user_id' => $userId,
            'action_type' => $actionType,
            'description' => $description,
            'old_values' => [$field => $oldValue],
            'new_values' => [$field => $newValue],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Update status-related timestamps
     */
    private function updateStatusTimestamps(SupportTicket $ticket, SupportTicketStatus $status): void
    {
        $updates = [];

        if ($status->is_resolved && !$ticket->resolved_at) {
            $updates['resolved_at'] = now();
            $updates['resolution_time_minutes'] = $ticket->created_at->diffInMinutes(now());
        }

        if ($status->is_closed && !$ticket->closed_at) {
            $updates['closed_at'] = now();
        }

        if (!empty($updates)) {
            $ticket->update($updates);
        }
    }

    /**
     * Get tickets grouped by priority
     */
    private function getTicketsByPriority(string $tenantId): Collection
    {
        return SupportTicket::forTenant($tenantId)
            ->selectRaw('priority_id, count(*) as count')
            ->with('priority:id,name,color')
            ->groupBy('priority_id')
            ->get();
    }

    /**
     * Get tickets grouped by status
     */
    private function getTicketsByStatus(string $tenantId): Collection
    {
        return SupportTicket::forTenant($tenantId)
            ->selectRaw('status_id, count(*) as count')
            ->with('status:id,name,color,type')
            ->groupBy('status_id')
            ->get();
    }

    /**
     * Get tickets grouped by category
     */
    private function getTicketsByCategory(string $tenantId): Collection
    {
        return SupportTicket::forTenant($tenantId)
            ->selectRaw('category_id, count(*) as count')
            ->with('category:id,name,color')
            ->whereNotNull('category_id')
            ->groupBy('category_id')
            ->get();
    }
} 