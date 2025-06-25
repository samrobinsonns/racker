<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

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
        ];
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

    // Get roles for specific tenant
    public function rolesForTenant($tenantId = null)
    {
        $tenantId = $tenantId ?? $this->tenant_id;
        return $this->roles()->wherePivot('tenant_id', $tenantId);
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
        return $this->roles()->wherePivot('tenant_id', $tenantId)->detach($roleId);
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
}
