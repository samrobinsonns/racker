<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class CannedResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'content',
        'category',
        'tags',
        'is_active',
        'created_by',
        'updated_by',
        'usage_count',
    ];

    protected $casts = [
        'tags' => 'array',
        'is_active' => 'boolean',
        'usage_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the tenant this canned response belongs to
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    /**
     * Get the user who created this canned response
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated this canned response
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get usage records for this canned response
     */
    public function usage()
    {
        return $this->hasMany(CannedResponseUsage::class);
    }

    /**
     * Scope to get canned responses for a specific tenant
     */
    public function scopeForTenant(Builder $query, string $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope to get only active canned responses
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get canned responses by category
     */
    public function scopeByCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    /**
     * Scope to get canned responses created by a specific user
     */
    public function scopeByCreator(Builder $query, int $userId): Builder
    {
        return $query->where('created_by', $userId);
    }

    /**
     * Scope to search canned responses by name or content
     */
    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('content', 'like', "%{$search}%")
              ->orWhere('tags', 'like', "%{$search}%");
        });
    }

    /**
     * Scope to get most used canned responses
     */
    public function scopeMostUsed(Builder $query, int $limit = 10): Builder
    {
        return $query->orderBy('usage_count', 'desc')->limit($limit);
    }

    /**
     * Scope to get recently used canned responses
     */
    public function scopeRecentlyUsed(Builder $query, int $days = 30): Builder
    {
        return $query->whereHas('usage', function ($q) use ($days) {
            $q->where('created_at', '>=', now()->subDays($days));
        });
    }

    /**
     * Increment usage count
     */
    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }

    /**
     * Get the content with placeholders replaced
     */
    public function getProcessedContent(array $replacements = []): string
    {
        $content = $this->content;

        // Replace common placeholders
        $defaultReplacements = [
            '{agent_name}' => auth()->user()->name ?? 'Agent',
            '{ticket_number}' => '{TICKET_NUMBER}',
            '{customer_name}' => '{CUSTOMER_NAME}',
            '{date}' => now()->format('M j, Y'),
            '{time}' => now()->format('g:i A'),
        ];

        $allReplacements = array_merge($defaultReplacements, $replacements);

        foreach ($allReplacements as $placeholder => $value) {
            $content = str_replace($placeholder, $value, $content);
        }

        return $content;
    }

    /**
     * Check if this canned response has been used recently
     */
    public function isRecentlyUsed(int $days = 7): bool
    {
        return $this->usage()
            ->where('created_at', '>=', now()->subDays($days))
            ->exists();
    }

    /**
     * Get usage statistics for this canned response
     */
    public function getUsageStats(int $days = 30): array
    {
        $totalUsage = $this->usage()->count();
        $recentUsage = $this->usage()
            ->where('created_at', '>=', now()->subDays($days))
            ->count();

        return [
            'total_usage' => $totalUsage,
            'recent_usage' => $recentUsage,
            'usage_count' => $this->usage_count,
        ];
    }
}
