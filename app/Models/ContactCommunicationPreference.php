<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactCommunicationPreference extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'contact_id',
        'email_notifications',
        'sms_notifications',
        'marketing_emails',
        'marketing_sms',
        'newsletter_subscription',
        'service_updates',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_notifications' => 'boolean',
        'sms_notifications' => 'boolean',
        'marketing_emails' => 'boolean',
        'marketing_sms' => 'boolean',
        'newsletter_subscription' => 'boolean',
        'service_updates' => 'boolean',
    ];

    // Relationships
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    // Scopes
    public function scopeMarketingOptIn($query)
    {
        return $query->where('marketing_emails', true);
    }

    public function scopeEmailNotificationsEnabled($query)
    {
        return $query->where('email_notifications', true);
    }

    public function scopeSmsNotificationsEnabled($query)
    {
        return $query->where('sms_notifications', true);
    }

    /**
     * Check if any communication channel is enabled.
     */
    public function hasAnyCommunicationEnabled(): bool
    {
        return $this->email_notifications
            || $this->sms_notifications
            || $this->marketing_emails
            || $this->marketing_sms
            || $this->newsletter_subscription
            || $this->service_updates;
    }

    /**
     * Check if all marketing communications are disabled.
     */
    public function isMarketingOptedOut(): bool
    {
        return !$this->marketing_emails
            && !$this->marketing_sms
            && !$this->newsletter_subscription;
    }
}
