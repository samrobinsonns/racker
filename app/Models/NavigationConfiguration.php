<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NavigationConfiguration extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'role_id',
        'name',
        'is_active',
        'configuration',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'configuration' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Relationship to tenant
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Relationship to user (for user-specific configurations)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relationship to role (for role-specific configurations)
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * User who created this configuration
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * User who last updated this configuration
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scope for active configurations
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for tenant configurations
     */
    public function scopeForTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope for default tenant configurations (no user or role specific)
     */
    public function scopeDefault($query)
    {
        return $query->whereNull('user_id')->whereNull('role_id');
    }

    /**
     * Scope for role-specific configurations
     */
    public function scopeForRole($query, $roleId)
    {
        return $query->where('role_id', $roleId)->whereNull('user_id');
    }

    /**
     * Scope for user-specific configurations
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Activate this configuration and deactivate others of the same type
     */
    public function activate()
    {
        // Deactivate other configurations of the same type for this tenant
        $query = self::where('tenant_id', $this->tenant_id)
                     ->where('id', '!=', $this->id);

        if ($this->user_id) {
            $query->where('user_id', $this->user_id);
        } elseif ($this->role_id) {
            $query->where('role_id', $this->role_id);
        } else {
            $query->whereNull('user_id')->whereNull('role_id');
        }

        $query->update(['is_active' => false]);

        // Activate this configuration
        $this->update(['is_active' => true]);
    }

    /**
     * Get the configuration type (default, role, user)
     */
    public function getTypeAttribute()
    {
        if ($this->user_id) {
            return 'user';
        } elseif ($this->role_id) {
            return 'role';
        }
        return 'default';
    }

    /**
     * Validate configuration structure
     */
    public function isValidConfiguration()
    {
        $config = $this->configuration;
        
        if (!is_array($config) || !isset($config['items'])) {
            return false;
        }

        foreach ($config['items'] as $item) {
            if (!isset($item['id'], $item['type'], $item['label'])) {
                return false;
            }
        }

        return true;
    }
} 