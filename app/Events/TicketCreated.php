<?php

namespace App\Events;

use App\Models\SupportTicket;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ticket;

    /**
     * Create a new event instance.
     */
    public function __construct(SupportTicket $ticket)
    {
        $this->ticket = $ticket;
        
        \Log::info('TicketCreated event constructed', [
            'ticket_id' => $ticket->id,
            'ticket_number' => $ticket->ticket_number,
            'tenant_id' => $ticket->tenant_id,
            'channel' => 'tickets.' . $ticket->tenant_id,
        ]);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('tickets.' . $this->ticket->tenant_id),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'ticket_id' => $this->ticket->id,
            'ticket_number' => $this->ticket->ticket_number,
            'subject' => $this->ticket->subject,
            'requester_name' => $this->ticket->requester_name,
            'priority' => $this->ticket->priority->name,
            'status' => $this->ticket->status->name,
            'created_at' => $this->ticket->created_at->toISOString(),
            'assigned_to' => $this->ticket->assigned_to,
            'tenant_id' => $this->ticket->tenant_id,
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'TicketCreated';
    }

    /**
     * Determine if this event should broadcast.
     */
    public function broadcastWhen(): bool
    {
        \Log::info('TicketCreated event broadcasting', [
            'ticket_id' => $this->ticket->id,
            'ticket_number' => $this->ticket->ticket_number,
            'tenant_id' => $this->ticket->tenant_id,
            'channel' => 'tickets.' . $this->ticket->tenant_id,
        ]);
        
        return true;
    }
} 