<?php

namespace App\Services;

use App\Models\CannedResponse;
use App\Models\CannedResponseUsage;
use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class CannedResponseService
{
    /**
     * Create a new canned response
     */
    public function createCannedResponse(array $data, string $tenantId, int $userId): CannedResponse
    {
        return CannedResponse::create([
            'tenant_id' => $tenantId,
            'name' => $data['name'],
            'content' => $data['content'],
            'category' => $data['category'] ?? 'general',
            'tags' => $data['tags'] ?? [],
            'is_active' => $data['is_active'] ?? true,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);
    }

    /**
     * Update an existing canned response
     */
    public function updateCannedResponse(CannedResponse $cannedResponse, array $data, int $userId): CannedResponse
    {
        $cannedResponse->update([
            'name' => $data['name'],
            'content' => $data['content'],
            'category' => $data['category'] ?? $cannedResponse->category,
            'tags' => $data['tags'] ?? $cannedResponse->tags,
            'is_active' => $data['is_active'] ?? $cannedResponse->is_active,
            'updated_by' => $userId,
        ]);

        return $cannedResponse->fresh();
    }

    /**
     * Delete a canned response
     */
    public function deleteCannedResponse(CannedResponse $cannedResponse): bool
    {
        return $cannedResponse->delete();
    }

    /**
     * Get canned responses for a tenant
     */
    public function getCannedResponses(string $tenantId, array $filters = []): Collection
    {
        $query = CannedResponse::forTenant($tenantId);

        // Apply filters
        if (isset($filters['category']) && $filters['category']) {
            $query->byCategory($filters['category']);
        }

        if (isset($filters['search']) && $filters['search']) {
            $query->search($filters['search']);
        }

        if (isset($filters['active_only']) && $filters['active_only']) {
            $query->active();
        }

        if (isset($filters['created_by']) && $filters['created_by']) {
            $query->byCreator($filters['created_by']);
        }

        // Apply sorting
        $sortBy = $filters['sort_by'] ?? 'name';
        $sortOrder = $filters['sort_order'] ?? 'asc';

        if ($sortBy === 'usage') {
            $query->orderBy('usage_count', $sortOrder);
        } elseif ($sortBy === 'recent') {
            $query->recentlyUsed();
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        return $query->with(['creator', 'updater'])->get();
    }

    /**
     * Search canned responses
     */
    public function searchCannedResponses(string $tenantId, string $search, int $limit = 10): Collection
    {
        return CannedResponse::forTenant($tenantId)
            ->active()
            ->search($search)
            ->with(['creator'])
            ->limit($limit)
            ->get();
    }

    /**
     * Get canned responses by category
     */
    public function getCannedResponsesByCategory(string $tenantId, string $category): Collection
    {
        return CannedResponse::forTenant($tenantId)
            ->active()
            ->byCategory($category)
            ->with(['creator'])
            ->orderBy('name')
            ->get();
    }

    /**
     * Get most used canned responses
     */
    public function getMostUsedCannedResponses(string $tenantId, int $limit = 10): Collection
    {
        return CannedResponse::forTenant($tenantId)
            ->active()
            ->mostUsed($limit)
            ->with(['creator'])
            ->get();
    }

    /**
     * Get recently used canned responses
     */
    public function getRecentlyUsedCannedResponses(string $tenantId, int $days = 30, int $limit = 10): Collection
    {
        return CannedResponse::forTenant($tenantId)
            ->active()
            ->recentlyUsed($days)
            ->with(['creator'])
            ->limit($limit)
            ->get();
    }

    /**
     * Use a canned response in a ticket reply
     */
    public function useCannedResponse(
        CannedResponse $cannedResponse,
        SupportTicket $ticket,
        SupportTicketReply $reply,
        int $userId,
        array $replacements = []
    ): CannedResponseUsage {
        // Increment usage count
        $cannedResponse->incrementUsage();

        // Create usage record
        $usage = CannedResponseUsage::create([
            'tenant_id' => $ticket->tenant_id,
            'canned_response_id' => $cannedResponse->id,
            'ticket_id' => $ticket->id,
            'reply_id' => $reply->id,
            'used_by' => $userId,
        ]);

        return $usage;
    }

    /**
     * Get processed content with replacements
     */
    public function getProcessedContent(CannedResponse $cannedResponse, SupportTicket $ticket, array $customReplacements = []): string
    {
        $replacements = array_merge([
            '{ticket_number}' => $ticket->ticket_number,
            '{customer_name}' => $ticket->requester_name ?? $ticket->contact?->full_name ?? 'Customer',
            '{agent_name}' => auth()->user()->name ?? 'Agent',
            '{date}' => now()->format('M j, Y'),
            '{time}' => now()->format('g:i A'),
            '{ticket_subject}' => $ticket->subject,
            '{ticket_status}' => $ticket->status->name ?? 'Open',
            '{ticket_priority}' => $ticket->priority->name ?? 'Medium',
        ], $customReplacements);

        return $cannedResponse->getProcessedContent($replacements);
    }

    /**
     * Get canned response categories for a tenant
     */
    public function getCategories(string $tenantId): Collection
    {
        return CannedResponse::forTenant($tenantId)
            ->select('category')
            ->distinct()
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->orderBy('category')
            ->pluck('category');
    }

    /**
     * Get canned response statistics for a tenant
     */
    public function getTenantStats(string $tenantId, int $days = 30): array
    {
        $totalResponses = CannedResponse::forTenant($tenantId)->count();
        $activeResponses = CannedResponse::forTenant($tenantId)->active()->count();
        $totalUsage = CannedResponseUsage::getTenantStats($tenantId, $days);

        // Get category distribution
        $categoryStats = CannedResponse::forTenant($tenantId)
            ->selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->orderBy('count', 'desc')
            ->get();

        // Get usage trends
        $usageTrends = CannedResponseUsage::forTenant($tenantId)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return [
            'total_responses' => $totalResponses,
            'active_responses' => $activeResponses,
            'usage_stats' => $totalUsage,
            'category_stats' => $categoryStats,
            'usage_trends' => $usageTrends,
        ];
    }

    /**
     * Get user-specific canned response statistics
     */
    public function getUserStats(int $userId, string $tenantId, int $days = 30): array
    {
        $userResponses = CannedResponse::forTenant($tenantId)
            ->byCreator($userId)
            ->count();

        $userUsage = CannedResponseUsage::getUserStats($userId, $tenantId, $days);

        // Get user's most used responses
        $mostUsed = CannedResponse::forTenant($tenantId)
            ->whereHas('usage', function ($q) use ($userId) {
                $q->where('used_by', $userId);
            })
            ->withCount(['usage' => function ($q) use ($userId) {
                $q->where('used_by', $userId);
            }])
            ->orderBy('usage_count', 'desc')
            ->limit(5)
            ->get();

        return [
            'created_responses' => $userResponses,
            'usage_stats' => $userUsage,
            'most_used_responses' => $mostUsed,
        ];
    }

    /**
     * Import canned responses from JSON/CSV
     */
    public function importCannedResponses(string $tenantId, int $userId, array $responses): array
    {
        $imported = 0;
        $errors = [];

        foreach ($responses as $index => $response) {
            try {
                $this->createCannedResponse([
                    'name' => $response['name'],
                    'content' => $response['content'],
                    'category' => $response['category'] ?? 'general',
                    'tags' => $response['tags'] ?? [],
                    'is_active' => $response['is_active'] ?? true,
                ], $tenantId, $userId);

                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Row " . ($index + 1) . ": " . $e->getMessage();
            }
        }

        return [
            'imported' => $imported,
            'errors' => $errors,
        ];
    }

    /**
     * Export canned responses to JSON
     */
    public function exportCannedResponses(string $tenantId): array
    {
        return CannedResponse::forTenant($tenantId)
            ->with(['creator', 'updater'])
            ->get()
            ->map(function ($response) {
                return [
                    'name' => $response->name,
                    'content' => $response->content,
                    'category' => $response->category,
                    'tags' => $response->tags,
                    'is_active' => $response->is_active,
                    'usage_count' => $response->usage_count,
                    'created_by' => $response->creator->name ?? 'Unknown',
                    'updated_by' => $response->updater->name ?? 'Unknown',
                    'created_at' => $response->created_at->toISOString(),
                    'updated_at' => $response->updated_at->toISOString(),
                ];
            })
            ->toArray();
    }

    /**
     * Track usage of a canned response
     */
    public function trackUsage(int $cannedResponseId, string $tenantId, int $userId, ?int $ticketId = null): CannedResponseUsage
    {
        $cannedResponse = CannedResponse::forTenant($tenantId)->findOrFail($cannedResponseId);
        
        // Increment usage count
        $cannedResponse->incrementUsage();

        // Create usage record
        $usage = CannedResponseUsage::create([
            'tenant_id' => $tenantId,
            'canned_response_id' => $cannedResponseId,
            'ticket_id' => $ticketId,
            'reply_id' => null, // Will be set when reply is created
            'used_by' => $userId,
        ]);

        return $usage;
    }
} 