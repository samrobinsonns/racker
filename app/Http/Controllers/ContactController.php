<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactRequest;
use App\Http\Requests\UpdateContactRequest;
use App\Models\Contact;
use App\Models\ContactCustomField;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContactController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Contact::query()
            ->with(['tags', 'owner'])
            ->withCount(['tickets', 'notes']);

        // Apply filters
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('first_name', 'like', "%{$request->search}%")
                  ->orWhere('last_name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
                  ->orWhere('company', 'like', "%{$request->search}%");
            });
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $contacts = $query->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Contacts/Index', [
            'contacts' => $contacts,
            'filters' => $request->only(['search', 'type', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $customFields = ContactCustomField::ordered()->get();

        return Inertia::render('Contacts/Create', [
            'customFields' => $customFields,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreContactRequest $request)
    {
        $contact = Contact::create($request->validated());

        // Handle custom fields
        if ($request->custom_fields) {
            foreach ($request->custom_fields as $fieldId => $value) {
                $contact->customFieldValues()->create([
                    'field_id' => $fieldId,
                    'field_value' => $value,
                ]);
            }
        }

        // Handle tags
        if ($request->tags) {
            $contact->tags()->sync($request->tags);
        }

        // Create communication preferences
        $contact->communicationPreferences()->create($request->communication_preferences ?? []);

        if ($request->wantsJson()) {
            return response()->json($contact->load(['tags', 'customFieldValues']));
        }

        return redirect()->route('contacts.show', $contact)
            ->with('success', 'Contact created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Contact $contact)
    {
        $contact->load([
            'tags',
            'notes.user',
            'addresses',
            'customFieldValues.field',
            'communicationPreferences',
            'tickets',
            'owner',
        ]);

        return Inertia::render('Contacts/Show', [
            'contact' => $contact,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Contact $contact)
    {
        $contact->load([
            'tags',
            'customFieldValues.field',
            'addresses',
            'communicationPreferences',
        ]);

        $customFields = ContactCustomField::ordered()->get();

        return Inertia::render('Contacts/Edit', [
            'contact' => $contact,
            'customFields' => $customFields,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateContactRequest $request, Contact $contact)
    {
        $contact->update($request->validated());

        // Update custom fields
        if ($request->custom_fields) {
            $contact->customFieldValues()->delete();
            foreach ($request->custom_fields as $fieldId => $value) {
                $contact->customFieldValues()->create([
                    'field_id' => $fieldId,
                    'field_value' => $value,
                ]);
            }
        }

        // Update tags
        if ($request->has('tags')) {
            $contact->tags()->sync($request->tags);
        }

        // Update communication preferences
        if ($request->has('communication_preferences')) {
            $contact->communicationPreferences()->update($request->communication_preferences);
        }

        if ($request->wantsJson()) {
            return response()->json($contact->load(['tags', 'customFieldValues']));
        }

        return redirect()->route('contacts.show', $contact)
            ->with('success', 'Contact updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Contact $contact)
    {
        $contact->delete();

        if (request()->wantsJson()) {
            return response()->json(['message' => 'Contact deleted successfully.']);
        }

        return redirect()->route('contacts.index')
            ->with('success', 'Contact deleted successfully.');
    }

    public function import(Request $request)
    {
        // TODO: Implement contact import
        return response()->json(['message' => 'Import functionality coming soon.']);
    }

    public function export(Request $request)
    {
        // TODO: Implement contact export
        return response()->json(['message' => 'Export functionality coming soon.']);
    }
}
