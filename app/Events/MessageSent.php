<?php

namespace App\Events;

use App\Models\Message;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast, ShouldQueue
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;
    public $user;
    public $afterCommit = true;

    /**
     * Create a new event instance.
     */
    public function __construct(Message $message)
    {
        $this->message = $message->load('user', 'conversation');
        $this->user = $message->user;

        \Log::info('MessageSent event constructed', [
            'message_id' => $message->id,
            'user_id' => $message->user_id,
            'conversation_id' => $message->conversation_id
        ]);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $tenantId = $this->message->conversation->tenant_id;
        $conversationId = $this->message->conversation_id;
        $channelName = "tenant.{$tenantId}.conversation.{$conversationId}";

        \Log::info('Broadcasting to channel', [
            'channel' => $channelName,
            'message_id' => $this->message->id,
            'tenant_id' => $tenantId,
            'conversation_id' => $conversationId,
            'event_name' => $this->broadcastAs(),
            'conversation_type' => $this->message->conversation->type
        ]);

        // Always use PrivateChannel - presence channels are handled through the authorization
        return [
            new PrivateChannel($channelName)
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array
     */
    public function broadcastWith(): array
    {
        $data = [
            'id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'content' => $this->message->content,
            'type' => $this->message->type,
            'metadata' => $this->message->metadata,
            'created_at' => $this->message->created_at->toISOString(),
            'formatted_date' => $this->message->created_at->format('M j, Y g:i A'),
            'time_ago' => $this->message->created_at->diffForHumans(),
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ],
        ];

        \Log::info('Broadcasting message data', [
            'message_id' => $this->message->id,
            'data' => $data
        ]);

        return $data;
    }

    /**
     * The event's broadcast name.
     *
     * @return string
     */
    public function broadcastAs(): string
    {
        return 'message.sent';
    }
}
