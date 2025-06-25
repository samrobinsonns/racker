<?php

namespace App\Models;

use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Database\Concerns\HasDomains;

class Tenant extends BaseTenant
{
    use HasDomains;

    protected $fillable = [
        'id',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    // Relationship to users in this tenant
    public function users()
    {
        return $this->hasMany(User::class);
    }

    // Relationship to roles in this tenant
    public function roles()
    {
        return $this->hasMany(Role::class);
    }
}
