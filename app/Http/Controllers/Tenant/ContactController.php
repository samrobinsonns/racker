<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ContactController extends Controller
{
    public function index(Request $request)
    {
        $query = Contact::query()
            ->with(['tags', 'customFields', 'addresses', 'tickets.status', 'tickets.priority']);

        // Handle search
        if ($request->has('search')) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('first_name', 'like', "%{$searchTerm}%")
                  ->orWhere('last_name', 'like', "%{$searchTerm}%")
                  ->orWhere('email', 'like', "%{$searchTerm}%")
                  ->orWhere('company', 'like', "%{$searchTerm}%")
                  ->orWhere('job_title', 'like', "%{$searchTerm}%");
            });
        }

        // Handle filters
        if ($request->has('type') && $request->type !== '') {
            $query->where('type', $request->type);
        }

        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        return Inertia::render('Tenant/Contacts/Index', [
            'contacts' => $query->latest()->paginate(10),
            'filters' => [
                'search' => $request->search ?? '',
                'type' => $request->type ?? '',
                'status' => $request->status ?? '',
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Tenant/Contacts/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'mobile' => 'nullable|string|max:50',
            'job_title' => 'nullable|string|max:255',
            'company' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $contact = Contact::create($validated);

        return redirect()->route('tenant.contacts.show', $contact)
            ->with('success', 'Contact created successfully.');
    }

    public function show(Contact $contact)
    {
        $contact->load(['tags', 'customFields', 'addresses', 'tickets.status', 'tickets.priority']);
        
        return Inertia::render('Tenant/Contacts/Show', [
            'contact' => $contact
        ]);
    }

    public function edit(Contact $contact)
    {
        $contact->load(['tags', 'customFields', 'addresses']);
        
        return Inertia::render('Tenant/Contacts/Edit', [
            'contact' => $contact
        ]);
    }

    public function update(Request $request, Contact $contact)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'mobile' => 'nullable|string|max:50',
            'job_title' => 'nullable|string|max:255',
            'company' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'addresses' => 'nullable|array',
            'addresses.*.type' => 'required_with:addresses|in:billing,shipping,other',
            'addresses.*.street_1' => 'required_with:addresses|string|max:255',
            'addresses.*.street_2' => 'nullable|string|max:255',
            'addresses.*.city' => 'required_with:addresses|string|max:255',
            'addresses.*.state' => 'nullable|string|max:255',
            'addresses.*.postal_code' => 'nullable|string|max:20',
            'addresses.*.country' => 'nullable|string|max:255',
            'addresses.*.is_primary' => 'nullable|boolean',
        ]);

        // Update basic contact info
        $contact->update(collect($validated)->except(['addresses'])->toArray());

        // Handle addresses if provided
        if (isset($validated['addresses'])) {
            // Delete existing addresses
            $contact->addresses()->delete();
            
            // Create new addresses
            foreach ($validated['addresses'] as $addressData) {
                $contact->addresses()->create($addressData);
            }
        }

        return response()->json([
            'contact' => $contact->fresh(['tags', 'customFields', 'addresses', 'tickets.status', 'tickets.priority']),
            'message' => 'Contact updated successfully'
        ]);
    }

    public function destroy(Contact $contact)
    {
        $contact->delete();

        return redirect()->route('tenant.contacts.index')
            ->with('success', 'Contact deleted successfully.');
    }

    /**
     * Search contacts by query.
     */
    public function search(Request $request)
    {
        $query = $request->input('query');
        
        if (empty($query)) {
            if ($request->wantsJson()) {
                return response()->json(['contacts' => []]);
            }
            return back();
        }

        $contacts = Contact::query()
            ->where('tenant_id', Auth::user()->tenant_id)
            ->where(function($q) use ($query) {
                $q->where('first_name', 'like', "%{$query}%")
                  ->orWhere('last_name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%")
                  ->orWhere('company', 'like', "%{$query}%");
            })
            ->select(['id', 'first_name', 'last_name', 'email', 'company'])
            ->orderBy('first_name')
            ->limit(10)
            ->get()
            ->map(function ($contact) {
                return [
                    'id' => $contact->id,
                    'first_name' => $contact->first_name,
                    'last_name' => $contact->last_name,
                    'email' => $contact->email,
                    'company' => $contact->company,
                    'display_name' => trim("{$contact->first_name} {$contact->last_name}"),
                ];
            });

        if ($request->wantsJson()) {
            return response()->json(['contacts' => $contacts]);
        }

        return Inertia::render('SupportTickets/Create', [
            'contacts' => $contacts
        ]);
    }
} 