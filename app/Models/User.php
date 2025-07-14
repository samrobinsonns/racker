<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Traits\HasPermissions;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasPermissions;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'tenant_id',
        'is_central_admin',
        'title',
        'company',
        'location',
        'bio',
        'website',
        'background_image_url',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be appended to arrays.
     *
     * @var array
     */
    protected $appends = ['avatar_url'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_central_admin' => 'boolean',
            'navigation_branding' => 'json',
            'title' => 'string',
            'company' => 'string',
            'location' => 'string',
            'bio' => 'string',
            'website' => 'string',
        ];
    }

    /**
     * Get the user's avatar URL.
     */
    public function getAvatarUrlAttribute()
    {
        $storedValue = $this->attributes['avatar_url'] ?? null;

        // If we have a stored avatar URL, process it
        if ($storedValue) {
            // If it's already a full URL, return it as is
            if (filter_var($storedValue, FILTER_VALIDATE_URL)) {
                return $storedValue;
            }

            // If it starts with /storage, it's a local path
            if (str_starts_with($storedValue, '/storage')) {
                return $storedValue;
            }

            // If we have a relative path, append it to the current host
            return request()->getSchemeAndHttpHost() . $storedValue;
        }

        // If no avatar is set, generate one using UI Avatars
        $name = urlencode($this->name);
        return "https://ui-avatars.com/api/?name={$name}&background=random";
    }

    // Relationship to tenant
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    // Relationship to roles
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles')
                    ->withPivot('tenant_id')
                    ->withTimestamps();
    }

    // Messaging relationships
    public function conversations()
    {
        return $this->belongsToMany(Conversation::class, 'conversation_participants')
                    ->withPivot(['joined_at', 'last_read_at', 'role'])
                    ->withTimestamps();
    }

    // Calendar relationships
    public function calendars()
    {
        return $this->hasMany(Calendar::class, 'created_by');
    }

    public function calendarEvents()
    {
        return $this->hasMany(CalendarEvent::class, 'created_by');
    }

    public function calendarShares()
    {
        return $this->hasMany(CalendarShare::class, 'shared_with_user_id');
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function conversationParticipants()
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    public function createdConversations()
    {
        return $this->hasMany(Conversation::class, 'created_by');
    }

    // Get roles for specific tenant
    public function rolesForTenant($tenantId = null)
    {
        $tenantId = $tenantId ?? $this->tenant_id;
        return $this->roles()
                    ->select('roles.*')
                    ->wherePivot('user_roles.tenant_id', $tenantId);
    }

    // Check if user has specific role
    public function hasRole($roleName, $tenantId = null)
    {
        if ($this->is_central_admin) {
            return true; // Central admins have all roles
        }

        $tenantId = $tenantId ?? $this->tenant_id;
        return $this->rolesForTenant($tenantId)->where('name', $roleName)->exists();
    }

    // Check if user has specific permission
    public function hasPermission($permission, $tenantId = null)
    {
        if ($this->is_central_admin) {
            return true; // Central admins have all permissions
        }

        $tenantId = $tenantId ?? $this->tenant_id;
        $roles = $this->rolesForTenant($tenantId)->get();
        
        foreach ($roles as $role) {
            if ($role->hasPermission($permission)) {
                return true;
            }
        }

        return false;
    }

    // Assign role to user
    public function assignRole($roleId, $tenantId = null)
    {
        $tenantId = $tenantId ?? $this->tenant_id;
        return $this->roles()->attach($roleId, ['tenant_id' => $tenantId]);
    }

    // Remove role from user
    public function removeRole($roleId, $tenantId = null)
    {
        $tenantId = $tenantId ?? $this->tenant_id;
        return $this->roles()->wherePivot('user_roles.tenant_id', $tenantId)->detach($roleId);
    }

    // Scope for central admins
    public function scopeCentralAdmins($query)
    {
        return $query->where('is_central_admin', true);
    }

    // Scope for tenant users
    public function scopeTenantUsers($query, $tenantId = null)
    {
        if ($tenantId) {
            return $query->where('tenant_id', $tenantId);
        }
        return $query->whereNotNull('tenant_id');
    }

    /**
     * Get tickets assigned to this user
     */
    public function assignedTickets()
    {
        return $this->hasMany(SupportTicket::class, 'assigned_to');
    }

    /**
     * Get ticket replies by this user
     */
    public function ticketReplies()
    {
        return $this->hasMany(SupportTicketReply::class, 'created_by');
    }

    /**
     * Get ticket status changes by this user
     */
    public function ticketStatusChanges()
    {
        return $this->hasMany(SupportTicketActivityLog::class, 'user_id')
            ->where('action_type', 'status_changed');
    }

    /**
     * Get the user's data for frontend serialization
     * Includes navigation items and branding
     */
    public function toArrayWithNavigation(): array
    {
        $array = $this->toArray();
        
        // Add navigation items
        $array['navigation_items'] = $this->getNavigationItems();
        
        // Add navigation branding for tenant users
        if (!$this->is_central_admin && $this->tenant_id) {
            $array['navigation_branding'] = $this->getNavigationBranding();
        }
        
        return $array;
    }
}
