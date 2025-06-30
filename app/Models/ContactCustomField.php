<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class ContactCustomField extends Model
{
    use HasFactory, HasTenant;

    protected $fillable = [
        'field_name',
        'field_type',
        'field_options',
        'is_required',
        'sort_order',
    ];

    protected $casts = [
        'field_options' => 'json',
        'is_required' => 'boolean',
        'sort_order' => 'integer',
    ];

    // Relationships
    public function values()
    {
        return $this->hasMany(ContactCustomFieldValue::class, 'field_id');
    }

    // Scopes
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('field_name');
    }

    public function scopeRequired($query)
    {
        return $query->where('is_required', true);
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('field_type', $type);
    }
}
