<?php

namespace App\Observers;

use App\Events\ConversationUpdated;
use App\Models\Message;

class MessageObserver
{
    /**
     * Handle the Message "created" event.
     */
    public function created(Message $message): void
    {
        // Load the conversation with necessary relationships
        $conversation = $message->conversation->fresh()->load('participants.user', 'lastMessage');
        
        // Broadcast conversation updated event
        broadcast(new ConversationUpdated($conversation))->toOthers();
    }
} 