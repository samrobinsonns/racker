<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Events\MessageSent;

class Message extends Model
{
    protected $fillable = [
        'conversation_id',
        'user_id',
        'content',
        'type',
        'metadata',
        'is_edited',
        'edited_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'is_edited' => 'boolean',
        'edited_at' => 'datetime',
    ];

    // Boot method to automatically broadcast when message is created
    protected static function boot()
    {
        parent::boot();

        static::created(function ($message) {
            // Load necessary relationships before broadcasting
            $message->load(['user:id,name,email', 'conversation']);
            
            try {
                broadcast(new \App\Events\MessageSent($message))->toOthers();
                broadcast(new \App\Events\ConversationUpdated($message->conversation))->toOthers();
                
                \Log::info('Message events broadcast successfully', [
                    'message_id' => $message->id,
                    'conversation_id' => $message->conversation_id,
                    'user_id' => $message->user_id
                ]);
            } catch (\Exception $e) {
                \Log::error('Failed to broadcast message events', [
                    'message_id' => $message->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        });
    }

    // Relationships
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeForConversation($query, $conversationId)
    {
        return $query->where('conversation_id', $conversationId);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeRecent($query, $limit = 50)
    {
        return $query->latest()->limit($limit);
    }

    // Helper methods
    public function isOwnedBy(User $user)
    {
        return $this->user_id === $user->id;
    }

    public function edit($content)
    {
        return $this->update([
            'content' => $content,
            'is_edited' => true,
            'edited_at' => now(),
        ]);
    }

    public function isText()
    {
        return $this->type === 'text';
    }

    public function isFile()
    {
        return $this->type === 'file';
    }

    public function isImage()
    {
        return $this->type === 'image';
    }

    public function isSystem()
    {
        return $this->type === 'system';
    }

    // Format message for API response
    public function toArray()
    {
        return array_merge(parent::toArray(), [
            'user' => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ] : null,
            'formatted_date' => $this->created_at->format('M j, Y g:i A'),
            'time_ago' => $this->created_at->diffForHumans(),
        ]);
    }
}
