<?php

namespace App\Traits;

use App\Models\Tenant;

trait HasTenant
{
    protected static function bootHasTenant()
    {
        static::creating(function ($model) {
            if (!$model->tenant_id && auth()->check()) {
                $model->tenant_id = auth()->user()->tenant_id;
            }
        });

        static::addGlobalScope('tenant', function ($query) {
            if (auth()->check()) {
                $query->where('tenant_id', auth()->user()->tenant_id);
            }
        });
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function scopeTenant($query, $tenantId = null)
    {
        $tenantId = $tenantId ?: auth()->user()?->tenant_id;

        return $query->where('tenant_id', $tenantId);
    }
} 