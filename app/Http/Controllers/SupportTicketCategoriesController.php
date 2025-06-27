<?php

namespace App\Http\Controllers;

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
        $tenantId = auth()->user()->tenant_id ?? session('impersonated_tenant_id');
        
        $categories = SupportTicketCategory::forTenant($tenantId)
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('SupportTickets/Categories/Index', [
            'categories' => $categories,
            'permissions' => [
                'create' => auth()->user()->hasPermission('configure_support_tickets'),
                'edit' => auth()->user()->hasPermission('configure_support_tickets'),
                'delete' => auth()->user()->hasPermission('configure_support_tickets'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new category.
     */
    public function create(): Response
    {
        Gate::authorize('configure_support_tickets');

        return Inertia::render('SupportTickets/Categories/Create');
    }

    /**
     * Store a newly created category in storage.
     */
    public function store(Request $request)
    {
        Gate::authorize('configure_support_tickets');

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
            ->route('support-ticket-categories.index')
            ->with('success', 'Category created successfully.');
    }

    /**
     * Show the form for editing the specified category.
     */
    public function edit(SupportTicketCategory $supportTicketCategory): Response
    {
        Gate::authorize('configure_support_tickets');

        return Inertia::render('SupportTickets/Categories/Edit', [
            'category' => $supportTicketCategory,
        ]);
    }

    /**
     * Update the specified category in storage.
     */
    public function update(Request $request, SupportTicketCategory $supportTicketCategory)
    {
        Gate::authorize('configure_support_tickets');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'required|string|max:7',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $supportTicketCategory->update($validated);

        return redirect()
            ->route('support-ticket-categories.index')
            ->with('success', 'Category updated successfully.');
    }

    /**
     * Remove the specified category from storage.
     */
    public function destroy(SupportTicketCategory $supportTicketCategory)
    {
        Gate::authorize('configure_support_tickets');

        // Check if category has tickets
        if ($supportTicketCategory->tickets()->exists()) {
            return redirect()
                ->route('support-ticket-categories.index')
                ->with('error', 'Cannot delete category with existing tickets.');
        }

        $supportTicketCategory->delete();

        return redirect()
            ->route('support-ticket-categories.index')
            ->with('success', 'Category deleted successfully.');
    }
} 