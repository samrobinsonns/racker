<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Crypt;

class Microsoft365EmailConnection extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'email_address',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'client_id',
        'client_secret',
        'tenant_domain',
        'is_active',
        'auto_create_tickets',
        'email_processing_rules',
        'default_category_id',
        'default_priority_id',
        'default_assignee_id',
        'reply_signature',
        'last_email_sync',
        'sync_settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'auto_create_tickets' => 'boolean',
        'email_processing_rules' => 'array',
        'sync_settings' => 'array',
        'token_expires_at' => 'datetime',
        'last_email_sync' => 'datetime',
    ];

    protected $hidden = [
        'access_token',
        'refresh_token',
        'client_secret',
    ];

    /**
     * Get the tenant this connection belongs to
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    /**
     * Get the default category
     */
    public function defaultCategory()
    {
        return $this->belongsTo(SupportTicketCategory::class, 'default_category_id');
    }

    /**
     * Get the default priority
     */
    public function defaultPriority()
    {
        return $this->belongsTo(SupportTicketPriority::class, 'default_priority_id');
    }

    /**
     * Get the default assignee
     */
    public function defaultAssignee()
    {
        return $this->belongsTo(User::class, 'default_assignee_id');
    }

    /**
     * Scope to get connections for a specific tenant
     */
    public function scopeForTenant(Builder $query, string $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope to get only active connections
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get connections that need token refresh
     */
    public function scopeNeedsTokenRefresh(Builder $query): Builder
    {
        return $query->where('token_expires_at', '<=', now()->addMinutes(10));
    }

    /**
     * Encrypt and set access token
     */
    protected function accessToken(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? Crypt::decryptString($value) : null,
            set: fn (?string $value) => $value ? Crypt::encryptString($value) : null,
        );
    }

    /**
     * Encrypt and set refresh token
     */
    protected function refreshToken(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? Crypt::decryptString($value) : null,
            set: fn (?string $value) => $value ? Crypt::encryptString($value) : null,
        );
    }

    /**
     * Encrypt and set client secret
     */
    protected function clientSecret(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? Crypt::decryptString($value) : null,
            set: fn (?string $value) => $value ? Crypt::encryptString($value) : null,
        );
    }

    /**
     * Check if the token is expired or about to expire
     */
    public function tokenNeedsRefresh(): bool
    {
        return $this->token_expires_at <= now()->addMinutes(10);
    }

    /**
     * Check if the connection is properly configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->email_address) && 
               !empty($this->access_token) && 
               !empty($this->refresh_token);
    }

    /**
     * Get the last sync status
     */
    public function getLastSyncStatusAttribute(): string
    {
        if (!$this->last_email_sync) {
            return 'never';
        }

        $minutes = now()->diffInMinutes($this->last_email_sync);
        
        if ($minutes < 5) {
            return 'just_now';
        } elseif ($minutes < 60) {
            return 'recent';
        } elseif ($minutes < 1440) { // 24 hours
            return 'today';
        } else {
            return 'old';
        }
    }

    /**
     * Update the last sync timestamp
     */
    public function updateLastSync(): void
    {
        $this->update(['last_email_sync' => now()]);
    }

    /**
     * Get processing rules for email parsing
     */
    public function getProcessingRules(): array
    {
        return $this->email_processing_rules ?? [
            'ignore_auto_replies' => true,
            'ignore_out_of_office' => true,
            'ignore_delivery_reports' => true,
            'minimum_body_length' => 10,
            'allowed_senders' => [],
            'blocked_senders' => [],
            'subject_filters' => [],
        ];
    }
}
