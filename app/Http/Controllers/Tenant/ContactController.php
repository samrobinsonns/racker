<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContactController extends Controller
{
    public function index()
    {
        return Inertia::render('Tenant/Contacts/Index', [
            'contacts' => Contact::with(['tags', 'customFields'])
                ->latest()
                ->paginate(10),
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
        ]);

        $contact = Contact::create($validated);

        return redirect()->route('tenant.contacts.show', $contact)
            ->with('success', 'Contact created successfully.');
    }

    public function show(Contact $contact)
    {
        $contact->load(['tags', 'customFields', 'addresses', 'notes']);
        
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
        ]);

        $contact->update($validated);

        return response()->json([
            'contact' => $contact->fresh(),
            'message' => 'Contact updated successfully'
        ]);
    }

    public function destroy(Contact $contact)
    {
        $contact->delete();

        return redirect()->route('tenant.contacts.index')
            ->with('success', 'Contact deleted successfully.');
    }
} 