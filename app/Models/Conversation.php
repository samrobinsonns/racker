<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Conversation extends Model
{
    protected $fillable = [
        'tenant_id',
        'type',
        'name',
        'description',
        'is_private',
        'created_by',
    ];

    protected $casts = [
        'is_private' => 'boolean',
    ];

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conversation_participants')
                    ->withPivot(['joined_at', 'last_read_at', 'role'])
                    ->withTimestamps();
    }

    public function conversationParticipants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    // Scopes
    public function scopeForTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->whereHas('participants', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        });
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    // Helper methods
    public function addParticipant(User $user, $role = 'member')
    {
        return $this->participants()->attach($user->id, [
            'joined_at' => now(),
            'role' => $role,
        ]);
    }

    public function removeParticipant(User $user)
    {
        return $this->participants()->detach($user->id);
    }

    public function isParticipant(User $user)
    {
        return $this->participants()->where('user_id', $user->id)->exists();
    }

    public function getLastMessage()
    {
        return $this->messages()->latest()->first();
    }

    public function getUnreadCount(User $user)
    {
        $participant = $this->conversationParticipants()
                          ->where('user_id', $user->id)
                          ->first();
        
        if (!$participant) {
            return 0;
        }

        return $this->messages()
                   ->where('created_at', '>', $participant->last_read_at ?? $participant->joined_at)
                   ->count();
    }

    public function markAsRead(User $user)
    {
        return $this->conversationParticipants()
                   ->where('user_id', $user->id)
                   ->update(['last_read_at' => now()]);
    }
}
