<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Contact extends Model
{
    use HasFactory, SoftDeletes, HasTenant;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'mobile',
        'job_title',
        'company',
        'department',
        'status',
        'type',
        'source',
        'owner_id',
    ];

    protected $casts = [
        'status' => 'string',
        'type' => 'string',
    ];

    // Relationships
    public function customFields()
    {
        return $this->hasMany(ContactCustomFieldValue::class);
    }

    public function addresses()
    {
        return $this->hasMany(ContactAddress::class);
    }

    public function notes()
    {
        return $this->hasMany(ContactNote::class);
    }

    public function tags()
    {
        return $this->belongsToMany(ContactTag::class, 'contact_tag_relationships', 'contact_id', 'tag_id');
    }

    public function tickets()
    {
        return $this->hasMany(SupportTicket::class);
    }

    /**
     * Get the communication preferences associated with the contact.
     */
    public function communicationPreferences(): HasOne
    {
        return $this->hasOne(ContactCommunicationPreference::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    // Accessors
    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }

    // Scopes
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($query) use ($search) {
            $query->where('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('company', 'like', "%{$search}%");
        });
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }
}
