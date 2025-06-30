<?php

namespace App\Policies;

use App\Models\User;
use App\Models\SupportTicket;
use Illuminate\Auth\Access\HandlesAuthorization;

class SupportTicketPolicy
{
    /**
     * Determine whether the user can view any support tickets.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission([
            'view_support_tickets',
            'view_all_support_tickets',
            'manage_support_tickets'
        ]);
    }

    /**
     * Determine whether the user can view the support ticket.
     */
    public function view(User $user, SupportTicket $ticket): bool
    {
        // Users can view tickets if they have view permissions and either:
        // 1. They have view_all_support_tickets permission
        // 2. They have manage_support_tickets permission
        // 3. They are the requester or assignee of the ticket
        // 4. They have view_support_tickets permission and the ticket is in their tenant
        return $user->hasAnyPermission(['view_support_tickets', 'view_all_support_tickets', 'manage_support_tickets'])
            && (
                $user->hasPermission('view_all_support_tickets')
                || $user->hasPermission('manage_support_tickets')
                || $ticket->requester_id === $user->id
                || $ticket->assignee_id === $user->id
                || ($user->hasPermission('view_support_tickets') && $ticket->tenant_id === $user->tenant_id)
            );
    }

    /**
     * Determine whether the user can create support tickets.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyPermission([
            'create_support_tickets',
            'manage_support_tickets'
        ]);
    }

    /**
     * Determine whether the user can update the support ticket.
     */
    public function update(User $user, SupportTicket $ticket): bool
    {
        return $user->hasPermission('manage_support_tickets')
            && $ticket->tenant_id === $user->tenant_id;
    }

    /**
     * Determine whether the user can delete the support ticket.
     */
    public function delete(User $user, SupportTicket $ticket): bool
    {
        return $user->hasPermission('delete_support_tickets')
            && $ticket->tenant_id === $user->tenant_id;
    }

    /**
     * Determine whether the user can assign the support ticket.
     */
    public function assign(User $user, SupportTicket $ticket): bool
    {
        return $user->hasPermission('assign_support_tickets')
            && $ticket->tenant_id === $user->tenant_id;
    }

    /**
     * Determine whether the user can reply to the support ticket.
     */
    public function reply(User $user, SupportTicket $ticket): bool
    {
        return $user->hasAnyPermission(['view_support_tickets', 'manage_support_tickets'])
            && $ticket->tenant_id === $user->tenant_id;
    }
} 