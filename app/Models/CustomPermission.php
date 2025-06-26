<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomPermission extends Model
{
    protected $fillable = [
        'key',
        'label',
        'description',
        'category',
        'is_active',
        'created_by_user_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationship to the user who created this permission
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    // Scope for active permissions
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Scope by category
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    // Get grouped permissions for frontend
    public static function getGroupedPermissions()
    {
        $permissions = self::active()->get();
        $grouped = [];

        foreach ($permissions as $permission) {
            $grouped[$permission->category][] = [
                'key' => $permission->key,
                'label' => $permission->label,
                'description' => $permission->description,
            ];
        }

        return $grouped;
    }
}
