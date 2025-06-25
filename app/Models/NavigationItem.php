<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NavigationItem extends Model
{
    use HasFactory;

    protected $table = 'navigation_items_library';

    protected $fillable = [
        'key',
        'label',
        'icon',
        'route_name',
        'permission_required',
        'category',
        'is_active',
        'sort_order',
        'description',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    // Categories for navigation items
    const CATEGORY_CORE = 'core';
    const CATEGORY_ADMIN = 'admin';
    const CATEGORY_CONTENT = 'content';
    const CATEGORY_CUSTOM = 'custom';

    /**
     * Get items by category
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Get active items only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Order by sort order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('label');
    }

    /**
     * Get items available for a specific permission set
     */
    public function scopeForPermissions($query, array $permissions)
    {
        return $query->where(function ($q) use ($permissions) {
            $q->whereNull('permission_required')
              ->orWhereIn('permission_required', $permissions);
        });
    }

    /**
     * Get all categories
     */
    public static function getCategories()
    {
        return [
            self::CATEGORY_CORE => 'Core Navigation',
            self::CATEGORY_ADMIN => 'Administrative',
            self::CATEGORY_CONTENT => 'Content Management',
            self::CATEGORY_CUSTOM => 'Custom Items',
        ];
    }
} 