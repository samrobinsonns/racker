<?php

namespace App\Services\SupportTickets;

use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification as BaseNotification;

class NotificationService
{
    /**
     * Notify when a new ticket is created
     */
    public function notifyTicketCreated(SupportTicket $ticket): void
    {
        // Notify assigned agent (if any)
        if ($ticket->assignee) {
            $this->sendTicketAssignedNotification($ticket, $ticket->assignee);
        } else {
            // Notify all agents in the tenant who can view tickets
            $this->notifyAvailableAgents($ticket);
        }

        // Send confirmation to requester
        $this->sendTicketCreatedConfirmation($ticket);
    }

    /**
     * Notify when ticket is assigned
     */
    public function notifyTicketAssigned(SupportTicket $ticket, User $assignee, ?User $assignedBy = null): void
    {
        $this->sendTicketAssignedNotification($ticket, $assignee, $assignedBy);
    }

    /**
     * Notify when ticket status changes
     */
    public function notifyStatusChanged(SupportTicket $ticket, string $oldStatus, string $newStatus, ?User $changedBy = null): void
    {
        // Notify requester
        if ($ticket->requester) {
            $this->sendStatusChangeNotification($ticket, $ticket->requester, $oldStatus, $newStatus);
        }

        // Notify assignee if different from the person who made the change
        if ($ticket->assignee && $ticket->assignee->id !== $changedBy?->id) {
            $this->sendStatusChangeNotification($ticket, $ticket->assignee, $oldStatus, $newStatus);
        }
    }

    /**
     * Notify when a reply is added
     */
    public function notifyReplyAdded(SupportTicketReply $reply): void
    {
        $ticket = $reply->ticket;

        if ($reply->is_internal) {
            // Internal notes only notify agents
            $this->notifyAgentsOfInternalNote($reply);
        } else {
            // Public replies notify appropriate parties
            if ($reply->isFromAgent()) {
                // Agent reply - notify requester
                if ($ticket->requester) {
                    $this->sendAgentReplyNotification($reply, $ticket->requester);
                }
            } elseif ($reply->isFromCustomer()) {
                // Customer reply - notify assignee or available agents
                if ($ticket->assignee) {
                    $this->sendCustomerReplyNotification($reply, $ticket->assignee);
                } else {
                    $this->notifyAvailableAgentsOfReply($reply);
                }
            }
        }
    }

    /**
     * Notify when ticket is escalated
     */
    public function notifyTicketEscalated(SupportTicket $ticket, string $reason, ?User $escalatedBy = null): void
    {
        // Notify all agents with manage permissions
        $this->notifyManagersOfEscalation($ticket, $reason, $escalatedBy);
    }

    /**
     * Notify when ticket is overdue
     */
    public function notifyTicketOverdue(SupportTicket $ticket): void
    {
        // Notify assignee
        if ($ticket->assignee) {
            $this->sendOverdueNotification($ticket, $ticket->assignee);
        }

        // Notify managers
        $this->notifyManagersOfOverdue($ticket);
    }

    /**
     * Send daily digest of ticket activity
     */
    public function sendDailyDigest(User $user): void
    {
        if (!$user->hasAnyPermission(['view_support_tickets', 'manage_support_tickets'])) {
            return;
        }

        $stats = $this->getDailyStatsForUser($user);
        
        if ($this->shouldSendDigest($stats)) {
            $this->sendDigestEmail($user, $stats);
        }
    }

    /**
     * Send ticket created confirmation to requester
     */
    private function sendTicketCreatedConfirmation(SupportTicket $ticket): void
    {
        if (!$ticket->requester_email) {
            return;
        }

        $message = (new MailMessage)
            ->subject("Support Ticket Created - {$ticket->ticket_number}")
            ->greeting("Hello {$ticket->requester_name}!")
            ->line("Your support ticket has been created successfully.")
            ->line("**Ticket Number:** {$ticket->ticket_number}")
            ->line("**Subject:** {$ticket->subject}")
            ->line("**Priority:** {$ticket->priority->name}")
            ->line("We will respond to your ticket as soon as possible.")
            ->action('View Ticket', $this->getTicketUrl($ticket))
            ->line('Thank you for contacting our support team!');

        $this->sendEmailNotification($ticket->requester_email, $message);
    }

    /**
     * Send ticket assigned notification
     */
    private function sendTicketAssignedNotification(SupportTicket $ticket, User $assignee, ?User $assignedBy = null): void
    {
        $assignedByText = $assignedBy ? " by {$assignedBy->name}" : '';
        
        $message = (new MailMessage)
            ->subject("Ticket Assigned - {$ticket->ticket_number}")
            ->greeting("Hello {$assignee->name}!")
            ->line("A support ticket has been assigned to you{$assignedByText}.")
            ->line("**Ticket Number:** {$ticket->ticket_number}")
            ->line("**Subject:** {$ticket->subject}")
            ->line("**Priority:** {$ticket->priority->name}")
            ->line("**Requester:** {$ticket->requester_name} ({$ticket->requester_email})")
            ->action('View Ticket', $this->getTicketUrl($ticket))
            ->line('Please review and respond to this ticket promptly.');

        $assignee->notify(new GenericTicketNotification($message));
    }

    /**
     * Send status change notification
     */
    private function sendStatusChangeNotification(SupportTicket $ticket, User $user, string $oldStatus, string $newStatus): void
    {
        $message = (new MailMessage)
            ->subject("Ticket Status Updated - {$ticket->ticket_number}")
            ->greeting("Hello {$user->name}!")
            ->line("The status of your support ticket has been updated.")
            ->line("**Ticket Number:** {$ticket->ticket_number}")
            ->line("**Subject:** {$ticket->subject}")
            ->line("**Status Changed:** {$oldStatus} → {$newStatus}")
            ->action('View Ticket', $this->getTicketUrl($ticket))
            ->line('Thank you for using our support system!');

        $user->notify(new GenericTicketNotification($message));
    }

    /**
     * Send agent reply notification to customer
     */
    private function sendAgentReplyNotification(SupportTicketReply $reply, User $requester): void
    {
        $ticket = $reply->ticket;
        
        $message = (new MailMessage)
            ->subject("New Reply - {$ticket->ticket_number}")
            ->greeting("Hello {$requester->name}!")
            ->line("You have received a new reply on your support ticket.")
            ->line("**Ticket Number:** {$ticket->ticket_number}")
            ->line("**Subject:** {$ticket->subject}")
            ->line("**Reply from:** {$reply->author_name}")
            ->line("**Message:**")
            ->line($reply->content)
            ->action('View Ticket', $this->getTicketUrl($ticket))
            ->line('You can reply directly to this email or use the link above.');

        $requester->notify(new GenericTicketNotification($message));
    }

    /**
     * Send customer reply notification to agent
     */
    private function sendCustomerReplyNotification(SupportTicketReply $reply, User $agent): void
    {
        $ticket = $reply->ticket;
        
        $message = (new MailMessage)
            ->subject("Customer Reply - {$ticket->ticket_number}")
            ->greeting("Hello {$agent->name}!")
            ->line("You have received a new reply from the customer.")
            ->line("**Ticket Number:** {$ticket->ticket_number}")
            ->line("**Subject:** {$ticket->subject}")
            ->line("**Reply from:** {$reply->author_name} ({$reply->author_email})")
            ->line("**Message:**")
            ->line($reply->content)
            ->action('View Ticket', $this->getTicketUrl($ticket))
            ->line('Please respond to the customer promptly.');

        $agent->notify(new GenericTicketNotification($message));
    }

    /**
     * Notify available agents of new ticket
     */
    private function notifyAvailableAgents(SupportTicket $ticket): void
    {
        $agents = $this->getAvailableAgents($ticket->tenant_id);
        
        foreach ($agents as $agent) {
            $message = (new MailMessage)
                ->subject("New Support Ticket - {$ticket->ticket_number}")
                ->greeting("Hello {$agent->name}!")
                ->line("A new support ticket has been created and needs attention.")
                ->line("**Ticket Number:** {$ticket->ticket_number}")
                ->line("**Subject:** {$ticket->subject}")
                ->line("**Priority:** {$ticket->priority->name}")
                ->line("**Requester:** {$ticket->requester_name} ({$ticket->requester_email})")
                ->action('View Ticket', $this->getTicketUrl($ticket))
                ->line('Please review and assign this ticket if appropriate.');

            $agent->notify(new GenericTicketNotification($message));
        }
    }

    /**
     * Get available agents for a tenant
     */
    private function getAvailableAgents(string $tenantId): \Illuminate\Support\Collection
    {
        return User::where('tenant_id', $tenantId)
            ->whereHas('roles', function ($query) {
                $query->where(function ($q) {
                    $q->whereJsonContains('permissions', 'view_support_tickets')
                      ->orWhereJsonContains('permissions', 'manage_support_tickets');
                });
            })
            ->get();
    }

    /**
     * Get ticket URL
     */
    private function getTicketUrl(SupportTicket $ticket): string
    {
        return route('support-tickets.show', $ticket);
    }

    /**
     * Send email notification
     */
    private function sendEmailNotification(string $email, MailMessage $message): void
    {
        // For external emails (customers), send via mail
        Mail::to($email)->send(new TicketNotificationMail($message));
    }

    /**
     * Get daily stats for user
     */
    private function getDailyStatsForUser(User $user): array
    {
        $query = SupportTicket::forTenant($user->tenant_id)
            ->whereDate('created_at', today());

        if (!$user->hasPermission('manage_support_tickets')) {
            $query->assignedTo($user->id);
        }

        $tickets = $query->with(['priority', 'status'])->get();

        return [
            'new_tickets' => $tickets->count(),
            'high_priority' => $tickets->filter(fn($t) => $t->priority->level <= 2)->count(),
            'overdue' => $tickets->filter(fn($t) => $t->isOverdue())->count(),
            'assigned_to_user' => $tickets->filter(fn($t) => $t->assignee_id === $user->id)->count(),
        ];
    }

    /**
     * Check if digest should be sent
     */
    private function shouldSendDigest(array $stats): bool
    {
        return $stats['new_tickets'] > 0 || $stats['overdue'] > 0;
    }

    /**
     * Send digest email
     */
    private function sendDigestEmail(User $user, array $stats): void
    {
        $message = (new MailMessage)
            ->subject('Daily Support Ticket Digest - ' . now()->format('F j, Y'))
            ->greeting("Hello {$user->name}!")
            ->line('Here is your daily summary of support ticket activity:')
            ->line("**New Tickets Today:** {$stats['new_tickets']}")
            ->line("**High Priority Tickets:** {$stats['high_priority']}")
            ->line("**Overdue Tickets:** {$stats['overdue']}")
            ->line("**Assigned to You:** {$stats['assigned_to_user']}")
            ->action('View All Tickets', route('support-tickets.index'))
            ->line('Have a great day!');

        $user->notify(new GenericTicketNotification($message));
    }

    /**
     * Notify agents of internal note
     */
    private function notifyAgentsOfInternalNote(SupportTicketReply $reply): void
    {
        $ticket = $reply->ticket;
        
        // Get all agents who should be notified (assigned agent and managers)
        $agents = $this->getAgentsToNotify($ticket);
        
        foreach ($agents as $agent) {
            // Don't notify the agent who wrote the note
            if ($agent->id === $reply->created_by) {
                continue;
            }

            $message = (new MailMessage)
                ->subject("Internal Note Added - {$ticket->ticket_number}")
                ->greeting("Hello {$agent->name}!")
                ->line("An internal note has been added to a support ticket.")
                ->line("**Ticket Number:** {$ticket->ticket_number}")
                ->line("**Subject:** {$ticket->subject}")
                ->line("**Note from:** {$reply->author_name}")
                ->line("**Note:**")
                ->line($reply->content)
                ->action('View Ticket', $this->getTicketUrl($ticket))
                ->line('This note is only visible to support staff.');

            $agent->notify(new GenericTicketNotification($message));
        }
    }

    /**
     * Get agents who should be notified about a ticket
     */
    private function getAgentsToNotify(SupportTicket $ticket): \Illuminate\Support\Collection
    {
        $query = User::where('tenant_id', $ticket->tenant_id)
            ->where(function ($q) {
                $q->whereHas('roles', function ($query) {
                    $query->where(function ($q) {
                        $q->whereJsonContains('permissions', 'manage_support_tickets')
                          ->orWhereJsonContains('permissions', 'view_support_tickets');
                    });
                });
            });

        // Include assigned agent if there is one
        if ($ticket->assigned_to) {
            $query->orWhere('id', $ticket->assigned_to);
        }

        return $query->get();
    }
}

/**
 * Generic ticket notification class
 */
class GenericTicketNotification extends BaseNotification
{
    private MailMessage $mailMessage;

    public function __construct(MailMessage $mailMessage)
    {
        $this->mailMessage = $mailMessage;
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return $this->mailMessage;
    }
}

/**
 * Mail class for external notifications
 */
class TicketNotificationMail extends \Illuminate\Mail\Mailable
{
    private MailMessage $mailMessage;

    public function __construct(MailMessage $mailMessage)
    {
        $this->mailMessage = $mailMessage;
    }

    public function build()
    {
        $viewData = [
            'greeting' => $this->mailMessage->greeting ?? 'Hello!',
            'introLines' => $this->mailMessage->introLines ?? [],
            'outroLines' => $this->mailMessage->outroLines ?? [],
            'actionText' => $this->mailMessage->actionText ?? null,
            'actionUrl' => $this->mailMessage->actionUrl ?? null,
            'displayableActionUrl' => $this->mailMessage->actionUrl ?? null,
            'salutation' => $this->mailMessage->salutation ?? 'Regards,',
            'level' => $this->mailMessage->level ?? 'info',
        ];

        return $this->subject($this->mailMessage->subject)
                    ->markdown('emails.ticket-notification')
                    ->with('mailMessage', (object) $viewData);
    }
} 