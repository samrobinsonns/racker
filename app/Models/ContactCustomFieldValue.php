<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContactCustomFieldValue extends Model
{
    use HasFactory;

    protected $fillable = [
        'contact_id',
        'field_id',
        'field_value',
    ];

    // Relationships
    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function field()
    {
        return $this->belongsTo(ContactCustomField::class, 'field_id');
    }

    // Helper method to get typed value based on field type
    public function getTypedValueAttribute()
    {
        if (!$this->field) {
            return $this->field_value;
        }

        switch ($this->field->field_type) {
            case 'number':
                return is_numeric($this->field_value) ? (float) $this->field_value : null;
            case 'date':
                return $this->field_value ? date('Y-m-d', strtotime($this->field_value)) : null;
            case 'checkbox':
                return (bool) $this->field_value;
            case 'select':
            case 'multiselect':
                return json_decode($this->field_value, true) ?? $this->field_value;
            default:
                return $this->field_value;
        }
    }
}
