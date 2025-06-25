<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'display_name',
        'description',
        'type',
        'tenant_id',
        'permissions',
    ];

    protected $casts = [
        'permissions' => 'array',
    ];

    // Relationship to tenant
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    // Relationship to users
    public function users()
    {
        return $this->belongsToMany(User::class, 'user_roles')
                    ->withPivot('tenant_id')
                    ->withTimestamps();
    }

    // Check if role has specific permission
    public function hasPermission($permission)
    {
        return in_array($permission, $this->permissions ?? []);
    }

    // Scope for central roles
    public function scopeCentral($query)
    {
        return $query->where('type', 'central');
    }

    // Scope for tenant roles
    public function scopeTenant($query)
    {
        return $query->where('type', 'tenant');
    }

    // Scope for specific tenant
    public function scopeForTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}
