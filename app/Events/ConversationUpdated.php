<?php

namespace App\Events;

use App\Models\Conversation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $conversation;
    public $afterCommit = true;

    /**
     * Create a new event instance.
     */
    public function __construct(Conversation $conversation)
    {
        $this->conversation = $conversation->load(['participants.user', 'lastMessage', 'lastMessage.user']);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("tenant.{$this->conversation->tenant_id}.notifications")
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array
     */
    public function broadcastWith(): array
    {
        // Get unread counts for all participants
        $participantData = $this->conversation->participants->mapWithKeys(function ($participant) {
            return [
                $participant->user->id => [
                    'unread_count' => $this->conversation->getUnreadCount($participant->user),
                    'user' => [
                        'id' => $participant->user->id,
                        'name' => $participant->user->name,
                        'email' => $participant->user->email,
                    ]
                ]
            ];
        });

        return [
            'conversation' => array_merge($this->conversation->toArray(), [
                'participants_data' => $participantData,
                'last_message' => $this->conversation->lastMessage ? [
                    'id' => $this->conversation->lastMessage->id,
                    'content' => $this->conversation->lastMessage->content,
                    'created_at' => $this->conversation->lastMessage->created_at,
                    'user' => [
                        'id' => $this->conversation->lastMessage->user->id,
                        'name' => $this->conversation->lastMessage->user->name,
                        'email' => $this->conversation->lastMessage->user->email,
                    ]
                ] : null
            ])
        ];
    }

    /**
     * The event's broadcast name.
     *
     * @return string
     */
    public function broadcastAs(): string
    {
        return 'conversation.updated';
    }
} 