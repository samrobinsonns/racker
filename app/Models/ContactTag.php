<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class ContactTag extends Model
{
    use HasFactory, HasTenant;

    protected $fillable = [
        'name',
    ];

    // Relationships
    public function contacts()
    {
        return $this->belongsToMany(Contact::class, 'contact_tag_relationships', 'tag_id', 'contact_id');
    }

    // Scopes
    public function scopeWithContactCount($query)
    {
        return $query->withCount('contacts');
    }

    public function scopePopular($query, $limit = 10)
    {
        return $query->withCount('contacts')
                    ->orderBy('contacts_count', 'desc')
                    ->limit($limit);
    }

    // Prevent duplicate tags within a tenant
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($tag) {
            $exists = static::where('tenant_id', $tag->tenant_id)
                          ->where('name', $tag->name)
                          ->where('id', '!=', $tag->id)
                          ->exists();

            if ($exists) {
                throw new \Exception('A tag with this name already exists.');
            }
        });
    }
}
