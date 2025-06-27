<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class SupportTicketCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'description',
        'color',
        'icon',
        'is_active',
        'sort_order',
        'parent_id',
        'email_templates',
        'auto_assignment_rules',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'auto_assignment_rules' => 'array',
    ];

    /**
     * Get tickets in this category
     */
    public function tickets()
    {
        return $this->hasMany(SupportTicket::class, 'category_id');
    }

    /**
     * Get parent category
     */
    public function parent()
    {
        return $this->belongsTo(static::class, 'parent_id');
    }

    /**
     * Get child categories
     */
    public function children()
    {
        return $this->hasMany(static::class, 'parent_id');
    }

    /**
     * Get all descendants (recursive)
     */
    public function descendants()
    {
        return $this->children()->with('descendants');
    }

    /**
     * Scope to get categories for a specific tenant
     */
    public function scopeForTenant(Builder $query, string $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope to get only active categories
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get only parent categories (top-level)
     */
    public function scopeParents(Builder $query): Builder
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope to get categories ordered by sort order
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Check if this category has children
     */
    public function hasChildren(): bool
    {
        return $this->children()->exists();
    }

    /**
     * Check if this is a root category (no parent)
     */
    public function isRoot(): bool
    {
        return is_null($this->parent_id);
    }

    /**
     * Get the full category path (Parent > Child > etc.)
     */
    public function getFullPathAttribute(): string
    {
        $path = [$this->name];
        $parent = $this->parent;

        while ($parent) {
            array_unshift($path, $parent->name);
            $parent = $parent->parent;
        }

        return implode(' > ', $path);
    }

    /**
     * Get all tickets including from child categories
     */
    public function allTickets()
    {
        $categoryIds = $this->getAllDescendantIds();
        $categoryIds[] = $this->id;

        return SupportTicket::whereIn('category_id', $categoryIds);
    }

    /**
     * Get all descendant category IDs
     */
    private function getAllDescendantIds(): array
    {
        $ids = [];
        
        foreach ($this->children as $child) {
            $ids[] = $child->id;
            $ids = array_merge($ids, $child->getAllDescendantIds());
        }

        return $ids;
    }

    /**
     * Get the CSS class for the category color
     */
    public function getColorClassAttribute(): string
    {
        return "text-{$this->getColorName()}-600 bg-{$this->getColorName()}-100";
    }

    /**
     * Get color name from hex code
     */
    private function getColorName(): string
    {
        return match($this->color) {
            '#3B82F6' => 'blue',
            '#10B981' => 'green',
            '#8B5CF6' => 'purple',
            '#F59E0B' => 'yellow',
            '#EF4444' => 'red',
            '#6B7280' => 'gray',
            default => 'gray'
        };
    }
}
