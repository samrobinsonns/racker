<?php

namespace App\Http\Controllers;

use App\Models\CannedResponse;
use App\Services\CannedResponseService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CannedResponseController extends Controller
{
    protected CannedResponseService $cannedResponseService;

    public function __construct(CannedResponseService $cannedResponseService)
    {
        $this->cannedResponseService = $cannedResponseService;
    }

    /**
     * Display a listing of canned responses
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', CannedResponse::class);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $filters = $request->only(['category', 'search', 'active_only', 'sort_by', 'sort_order']);

        $cannedResponses = $this->cannedResponseService->getCannedResponses($tenantId, $filters);
        $categories = $this->cannedResponseService->getCategories($tenantId);

        return Inertia::render('TenantAdmin/CannedResponses/Index', [
            'cannedResponses' => $cannedResponses,
            'categories' => $categories,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new canned response
     */
    public function create(): Response
    {
        Gate::authorize('create', CannedResponse::class);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $categories = $this->cannedResponseService->getCategories($tenantId);

        return Inertia::render('TenantAdmin/CannedResponses/Create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created canned response
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        Gate::authorize('create', CannedResponse::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'content' => 'required|string|max:10000',
            'category' => 'nullable|string|max:100',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'is_active' => 'boolean',
        ]);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $userId = auth()->id();

        $cannedResponse = $this->cannedResponseService->createCannedResponse($validated, $tenantId, $userId);

        // Return JSON for AJAX requests (modal)
        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Canned response created successfully.',
                'canned_response' => [
                    'id' => $cannedResponse->id,
                    'name' => $cannedResponse->name,
                    'content' => $cannedResponse->content,
                    'category' => $cannedResponse->category,
                ]
            ]);
        }

        return redirect()->route('canned-responses.index')
            ->with('success', 'Canned response created successfully.');
    }

    /**
     * Display the specified canned response
     */
    public function show(CannedResponse $cannedResponse): Response
    {
        Gate::authorize('view', $cannedResponse);

        $cannedResponse->load(['creator', 'updater', 'usage.user', 'usage.ticket']);

        return Inertia::render('TenantAdmin/CannedResponses/Show', [
            'cannedResponse' => $cannedResponse,
        ]);
    }

    /**
     * Show the form for editing the specified canned response
     */
    public function edit(CannedResponse $cannedResponse): Response
    {
        Gate::authorize('update', $cannedResponse);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $categories = $this->cannedResponseService->getCategories($tenantId);

        return Inertia::render('TenantAdmin/CannedResponses/Edit', [
            'cannedResponse' => $cannedResponse,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified canned response
     */
    public function update(Request $request, CannedResponse $cannedResponse): RedirectResponse|JsonResponse
    {
        Gate::authorize('update', $cannedResponse);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'content' => 'required|string|max:10000',
            'category' => 'nullable|string|max:100',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'is_active' => 'boolean',
        ]);

        $userId = auth()->id();

        $updatedResponse = $this->cannedResponseService->updateCannedResponse($cannedResponse, $validated, $userId);

        // Return JSON for AJAX requests (modal)
        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Canned response updated successfully.',
                'canned_response' => [
                    'id' => $updatedResponse->id,
                    'name' => $updatedResponse->name,
                    'content' => $updatedResponse->content,
                    'category' => $updatedResponse->category,
                ]
            ]);
        }

        return redirect()->route('canned-responses.index')
            ->with('success', 'Canned response updated successfully.');
    }

    /**
     * Remove the specified canned response
     */
    public function destroy(CannedResponse $cannedResponse): RedirectResponse|JsonResponse
    {
        Gate::authorize('delete', $cannedResponse);

        $this->cannedResponseService->deleteCannedResponse($cannedResponse);

        // Return JSON for AJAX requests (modal)
        if (request()->wantsJson() || request()->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Canned response deleted successfully.'
            ]);
        }

        return redirect()->route('canned-responses.index')
            ->with('success', 'Canned response deleted successfully.');
    }

    /**
     * Search canned responses for autocomplete
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'search' => 'nullable|string|max:100',
            'limit' => 'sometimes|integer|min:1|max:50',
        ]);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $search = $request->search ?? '';
        $limit = $request->input('limit', 10);

        $responses = $this->cannedResponseService->searchCannedResponses($tenantId, $search, $limit);

        return response()->json([
            'responses' => $responses->map(function ($response) {
                return [
                    'id' => $response->id,
                    'name' => $response->name,
                    'content' => $response->content,
                    'category' => $response->category,
                    'usage_count' => $response->usage_count,
                ];
            }),
        ]);
    }

    /**
     * Get canned responses by category
     */
    public function byCategory(Request $request): JsonResponse
    {
        $request->validate([
            'category' => 'required|string|max:100',
        ]);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $category = $request->category;

        $responses = $this->cannedResponseService->getCannedResponsesByCategory($tenantId, $category);

        return response()->json([
            'responses' => $responses->map(function ($response) {
                return [
                    'id' => $response->id,
                    'name' => $response->name,
                    'content' => $response->content,
                    'category' => $response->category,
                    'usage_count' => $response->usage_count,
                ];
            }),
        ]);
    }

    /**
     * Get most used canned responses
     */
    public function mostUsed(Request $request): JsonResponse
    {
        $request->validate([
            'limit' => 'sometimes|integer|min:1|max:50',
        ]);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $limit = $request->input('limit', 10);

        $responses = $this->cannedResponseService->getMostUsedCannedResponses($tenantId, $limit);

        return response()->json([
            'responses' => $responses->map(function ($response) {
                return [
                    'id' => $response->id,
                    'name' => $response->name,
                    'content' => $response->content,
                    'category' => $response->category,
                    'usage_count' => $response->usage_count,
                ];
            }),
        ]);
    }

    /**
     * Get recently used canned responses
     */
    public function recentlyUsed(Request $request): JsonResponse
    {
        $request->validate([
            'days' => 'sometimes|integer|min:1|max:365',
            'limit' => 'sometimes|integer|min:1|max:50',
        ]);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $days = $request->input('days', 30);
        $limit = $request->input('limit', 10);

        $responses = $this->cannedResponseService->getRecentlyUsedCannedResponses($tenantId, $days, $limit);

        return response()->json([
            'responses' => $responses->map(function ($response) {
                return [
                    'id' => $response->id,
                    'name' => $response->name,
                    'content' => $response->content,
                    'category' => $response->category,
                    'usage_count' => $response->usage_count,
                ];
            }),
        ]);
    }

    /**
     * Get canned response statistics
     */
    public function stats(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', CannedResponse::class);

        $request->validate([
            'days' => 'sometimes|integer|min:1|max:365',
        ]);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $days = $request->input('days', 30);

        $stats = $this->cannedResponseService->getTenantStats($tenantId, $days);

        return response()->json($stats);
    }

    /**
     * Get user-specific canned response statistics
     */
    public function userStats(Request $request): JsonResponse
    {
        $request->validate([
            'days' => 'sometimes|integer|min:1|max:365',
        ]);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $userId = auth()->id();
        $days = $request->input('days', 30);

        $stats = $this->cannedResponseService->getUserStats($userId, $tenantId, $days);

        return response()->json($stats);
    }

    /**
     * Export canned responses
     */
    public function export(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', CannedResponse::class);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');

        $responses = $this->cannedResponseService->exportCannedResponses($tenantId);

        return response()->json([
            'responses' => $responses,
            'exported_at' => now()->toISOString(),
        ]);
    }

    /**
     * Import canned responses
     */
    public function import(Request $request): JsonResponse
    {
        Gate::authorize('create', CannedResponse::class);

        $request->validate([
            'responses' => 'required|array',
            'responses.*.name' => 'required|string|max:255',
            'responses.*.content' => 'required|string|max:10000',
            'responses.*.category' => 'nullable|string|max:100',
            'responses.*.tags' => 'nullable|array',
            'responses.*.is_active' => 'boolean',
        ]);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $userId = auth()->id();

        $result = $this->cannedResponseService->importCannedResponses(
            $tenantId,
            $userId,
            $request->responses
        );

        return response()->json([
            'message' => "Imported {$result['imported']} canned responses successfully.",
            'imported' => $result['imported'],
            'errors' => $result['errors'],
        ]);
    }

    /**
     * Track usage of a canned response
     */
    public function trackUsage(Request $request): JsonResponse
    {
        $request->validate([
            'canned_response_id' => 'required|exists:canned_responses,id',
            'ticket_id' => 'nullable|exists:support_tickets,id',
        ]);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $userId = auth()->id();

        try {
            $this->cannedResponseService->trackUsage(
                $request->canned_response_id,
                $tenantId,
                $userId,
                $request->ticket_id
            );

            return response()->json([
                'success' => true,
                'message' => 'Usage tracked successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to track usage: ' . $e->getMessage(),
            ], 422);
        }
    }
}
