<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class SupportTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'ticket_number',
        'subject',
        'description',
        'raw_html',
        'is_html',
        'requester_id',
        'requester_email',
        'requester_name',
        'assigned_to',
        'category_id',
        'priority_id',
        'status_id',
        'source',
        'channel',
        'custom_fields',
        'tags',
        'first_response_at',
        'last_response_at',
        'resolved_at',
        'closed_at',
        'due_date',
        'response_time_minutes',
        'resolution_time_minutes',
        'customer_satisfaction_rating',
        'customer_satisfaction_comment',
        'is_escalated',
        'escalated_at',
        'escalation_reason',
        'escalated_by',
        'microsoft365_message_id',
        'microsoft365_thread_id',
        'email_message_id',
        'email_headers',
        'created_by',
        'contact_id',
    ];

    protected $casts = [
        'custom_fields' => 'array',
        'tags' => 'array',
        'email_headers' => 'array',
        'first_response_at' => 'datetime',
        'last_response_at' => 'datetime',
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
        'due_date' => 'datetime',
        'escalated_at' => 'datetime',
        'is_escalated' => 'boolean',
        'is_html' => 'boolean',
        'response_time_minutes' => 'integer',
        'resolution_time_minutes' => 'integer',
        'customer_satisfaction_rating' => 'decimal:1',
    ];

    protected $appends = [
        'is_overdue'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($ticket) {
            if (empty($ticket->ticket_number)) {
                $ticket->ticket_number = static::generateTicketNumber();
            }
        });
    }

    /**
     * Get the requester (customer)
     */
    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    /**
     * Get the assigned agent
     */
    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get the ticket category
     */
    public function category()
    {
        return $this->belongsTo(SupportTicketCategory::class, 'category_id');
    }

    /**
     * Get the ticket priority
     */
    public function priority()
    {
        return $this->belongsTo(SupportTicketPriority::class, 'priority_id');
    }

    /**
     * Get the ticket status
     */
    public function status()
    {
        return $this->belongsTo(SupportTicketStatus::class, 'status_id');
    }

    /**
     * Get ticket replies
     */
    public function replies()
    {
        return $this->hasMany(SupportTicketReply::class, 'ticket_id');
    }

    /**
     * Get public replies (not internal notes)
     */
    public function publicReplies()
    {
        return $this->replies()->where('is_internal', false);
    }

    /**
     * Get internal notes
     */
    public function internalNotes()
    {
        return $this->replies()->where('is_internal', true);
    }

    /**
     * Get ticket attachments
     */
    public function attachments()
    {
        return $this->hasMany(SupportTicketAttachment::class, 'ticket_id');
    }

    /**
     * Get activity logs
     */
    public function activityLogs()
    {
        return $this->hasMany(SupportTicketActivityLog::class, 'ticket_id');
    }

    /**
     * Get the associated contact
     */
    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * Scope to get tickets for a specific tenant
     */
    public function scopeForTenant(Builder $query, string $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope to get tickets assigned to a specific user
     */
    public function scopeAssignedTo(Builder $query, int $userId): Builder
    {
        return $query->where('assigned_to', $userId);
    }

    /**
     * Scope to get unassigned tickets
     */
    public function scopeUnassigned(Builder $query): Builder
    {
        return $query->whereNull('assigned_to');
    }

    /**
     * Scope to get open tickets (not closed/resolved)
     */
    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereHas('status', function ($q) {
            $q->where('is_closed', false);
        });
    }

    /**
     * Scope to get overdue tickets
     */
    public function scopeOverdue(Builder $query): Builder
    {
        return $query->whereNotNull('due_date')
                    ->where('due_date', '<', now())
                    ->whereHas('status', function ($q) {
                        $q->where('is_closed', false);
                    });
    }

    /**
     * Scope to get escalated tickets
     */
    public function scopeEscalated(Builder $query): Builder
    {
        return $query->whereNotNull('escalated_at');
    }

    /**
     * Scope to filter by priority
     */
    public function scopeByPriority(Builder $query, int $priorityId): Builder
    {
        return $query->where('priority_id', $priorityId);
    }

    /**
     * Scope to filter by status
     */
    public function scopeByStatus(Builder $query, int $statusId): Builder
    {
        return $query->where('status_id', $statusId);
    }

    /**
     * Scope to filter by category
     */
    public function scopeByCategory(Builder $query, int $categoryId): Builder
    {
        return $query->where('category_id', $categoryId);
    }

    /**
     * Generate a unique ticket number
     */
    public static function generateTicketNumber(): string
    {
        $prefix = config('support-tickets.ticket_number_prefix', 'TKT');
        $year = date('Y');
        
        do {
            $number = $prefix . '-' . $year . '-' . str_pad(mt_rand(1, 999999), 6, '0', STR_PAD_LEFT);
        } while (static::where('ticket_number', $number)->exists());

        return $number;
    }

    /**
     * Check if ticket is overdue
     */
    public function isOverdue(): bool
    {
        return $this->due_date !== null && 
               $this->due_date < now() && 
               !$this->status->is_closed;
    }

    /**
     * Get the is_overdue attribute for API responses
     */
    public function getIsOverdueAttribute(): bool
    {
        // Make sure status relationship is loaded to avoid N+1 queries
        if (!$this->relationLoaded('status')) {
            $this->load('status');
        }
        
        return $this->isOverdue();
    }

    /**
     * Check if ticket has been responded to
     */
    public function hasResponse(): bool
    {
        return !is_null($this->first_response_at);
    }

    /**
     * Get time since creation
     */
    public function getAgeAttribute(): string
    {
        return $this->created_at->diffForHumans();
    }

    /**
     * Get response time SLA status
     */
    public function getResponseSlaStatusAttribute(): string
    {
        if ($this->hasResponse()) {
            return 'met';
        }

        $slaMinutes = $this->priority->response_time_hours * 60;
        $elapsedMinutes = $this->created_at->diffInMinutes(now());

        if ($elapsedMinutes > $slaMinutes) {
            return 'breached';
        } elseif ($elapsedMinutes > ($slaMinutes * 0.8)) {
            return 'warning';
        }

        return 'ok';
    }

    /**
     * Get resolution time SLA status
     */
    public function getResolutionSlaStatusAttribute(): string
    {
        if ($this->resolved_at) {
            return 'met';
        }

        $slaMinutes = $this->priority->resolution_time_hours * 60;
        $elapsedMinutes = $this->created_at->diffInMinutes(now());

        if ($elapsedMinutes > $slaMinutes) {
            return 'breached';
        } elseif ($elapsedMinutes > ($slaMinutes * 0.8)) {
            return 'warning';
        }

        return 'ok';
    }

    /**
     * Update the ticket status and log the change
     */
    public function updateStatus(int $statusId, ?int $userId = null, ?string $reason = null): bool
    {
        $oldStatus = $this->status;
        $newStatus = SupportTicketStatus::find($statusId);

        if (!$newStatus || !$oldStatus->canTransitionTo($newStatus->slug)) {
            return false;
        }

        $this->update(['status_id' => $statusId]);

        // Log the status change
        $this->activityLogs()->create([
            'user_id' => $userId,
            'action_type' => 'status_changed',
            'description' => "Status changed from {$oldStatus->name} to {$newStatus->name}",
            'old_values' => ['status' => $oldStatus->name],
            'new_values' => ['status' => $newStatus->name],
            'metadata' => $reason ? ['reason' => $reason] : null,
        ]);

        return true;
    }

    /**
     * Assign ticket to a user
     */
    public function assignTo(int $userId, ?int $assignedBy = null): void
    {
        $oldAssignee = $this->assignee;
        $newAssignee = User::find($userId);

        $this->update(['assigned_to' => $userId]);

        // Log the assignment
        $this->activityLogs()->create([
            'user_id' => $assignedBy,
            'action_type' => 'assigned',
            'description' => "Ticket assigned to {$newAssignee->name}",
            'old_values' => ['assignee' => $oldAssignee?->name],
            'new_values' => ['assignee' => $newAssignee->name],
        ]);
    }

    /**
     * Escalate the ticket
     */
    public function escalate(string $reason, ?int $userId = null): void
    {
        $this->update([
            'escalated_at' => now(),
            'escalation_reason' => $reason,
            'escalated_by' => $userId,
        ]);

        // Log the escalation
        $this->activityLogs()->create([
            'user_id' => $userId,
            'action_type' => 'escalated',
            'description' => "Ticket escalated: {$reason}",
            'metadata' => ['reason' => $reason],
        ]);
    }
}
