<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GeneratedPage extends Model
{
    use HasFactory;

    protected $fillable = [
        'navigation_item_key',
        'component_name',
        'page_directory',
        'file_path',
        'route_name',
        'title',
        'description',
        'icon',
        'template_type',
        'config',
        'is_active',
    ];

    protected $casts = [
        'config' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get the navigation item associated with this generated page
     */
    public function navigationItem()
    {
        return $this->belongsTo(NavigationItem::class, 'navigation_item_key', 'key');
    }

    /**
     * Scope for active pages
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Check if the file exists on disk
     */
    public function fileExists(): bool
    {
        return file_exists(resource_path('js/Pages/' . $this->page_directory . '/' . $this->component_name . '.jsx'));
    }

    /**
     * Get the full file path
     */
    public function getFullFilePathAttribute(): string
    {
        return resource_path('js/Pages/' . $this->page_directory . '/' . $this->component_name . '.jsx');
    }
} 