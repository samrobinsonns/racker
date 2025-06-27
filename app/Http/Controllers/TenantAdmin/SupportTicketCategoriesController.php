<?php

namespace App\Http\Controllers\TenantAdmin;

use App\Http\Controllers\Controller;
use App\Models\SupportTicketCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SupportTicketCategoriesController extends Controller
{
    /**
     * Display a listing of the categories.
     */
    public function index(): Response
    {
        Gate::authorize('viewAny', 'App\Models\SupportTicketSettings');
        
        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        
        $categories = SupportTicketCategory::forTenant($tenantId)
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('TenantAdmin/SupportTickets/Categories/Index', [
            'categories' => $categories,
        ]);
    }

    /**
     * Show the form for creating a new category.
     */
    public function create(): Response
    {
        Gate::authorize('update', 'App\Models\SupportTicketSettings');

        return Inertia::render('TenantAdmin/SupportTickets/Categories/Create');
    }

    /**
     * Store a newly created category in storage.
     */
    public function store(Request $request)
    {
        Gate::authorize('update', 'App\Models\SupportTicketSettings');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'required|string|max:7',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        $validated['tenant_id'] = $tenantId;

        SupportTicketCategory::create($validated);

        return redirect()
            ->route('tenant-admin.support-tickets.categories')
            ->with('success', 'Category created successfully.');
    }

    /**
     * Show the form for editing the specified category.
     */
    public function edit(SupportTicketCategory $category): Response
    {
        Gate::authorize('update', 'App\Models\SupportTicketSettings');

        return Inertia::render('TenantAdmin/SupportTickets/Categories/Edit', [
            'category' => $category,
        ]);
    }

    /**
     * Update the specified category in storage.
     */
    public function update(Request $request, SupportTicketCategory $category)
    {
        Gate::authorize('update', 'App\Models\SupportTicketSettings');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'required|string|max:7',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $category->update($validated);

        return redirect()
            ->route('tenant-admin.support-tickets.categories')
            ->with('success', 'Category updated successfully.');
    }

    /**
     * Remove the specified category from storage.
     */
    public function destroy(SupportTicketCategory $category)
    {
        Gate::authorize('update', 'App\Models\SupportTicketSettings');

        // Check if category has tickets
        if ($category->tickets()->exists()) {
            return redirect()
                ->route('tenant-admin.support-tickets.categories')
                ->with('error', 'Cannot delete category with existing tickets.');
        }

        $category->delete();

        return redirect()
            ->route('tenant-admin.support-tickets.categories')
            ->with('success', 'Category deleted successfully.');
    }
} 