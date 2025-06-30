<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomFieldRequest;
use App\Http\Requests\UpdateCustomFieldRequest;
use App\Models\ContactCustomField;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContactCustomFieldController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $customFields = ContactCustomField::ordered()
            ->withCount('values')
            ->get();

        return Inertia::render('Contacts/CustomFields/Index', [
            'customFields' => $customFields,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCustomFieldRequest $request)
    {
        $customField = ContactCustomField::create($request->validated());

        if ($request->wantsJson()) {
            return response()->json($customField);
        }

        return redirect()->route('contact-custom-fields.index')
            ->with('success', 'Custom field created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCustomFieldRequest $request, ContactCustomField $contactCustomField)
    {
        $contactCustomField->update($request->validated());

        if ($request->wantsJson()) {
            return response()->json($contactCustomField);
        }

        return redirect()->route('contact-custom-fields.index')
            ->with('success', 'Custom field updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ContactCustomField $contactCustomField)
    {
        // Check if the field has any values
        if ($contactCustomField->values()->exists()) {
            return back()->with('error', 'Cannot delete custom field that is in use.');
        }

        $contactCustomField->delete();

        if (request()->wantsJson()) {
            return response()->json(['message' => 'Custom field deleted successfully.']);
        }

        return redirect()->route('contact-custom-fields.index')
            ->with('success', 'Custom field deleted successfully.');
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['required', 'integer', 'exists:contact_custom_fields,id'],
        ]);

        foreach ($request->order as $index => $id) {
            ContactCustomField::where('id', $id)->update(['sort_order' => $index]);
        }

        return response()->json(['message' => 'Custom fields reordered successfully.']);
    }
}
