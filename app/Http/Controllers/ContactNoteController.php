<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\ContactNote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\StoreContactNoteRequest;
use App\Http\Requests\UpdateContactNoteRequest;

class ContactNoteController extends Controller
{
    /**
     * Store a newly created note.
     */
    public function store(StoreContactNoteRequest $request, Contact $contact)
    {
        $note = $contact->notes()->create([
            'content' => $request->content,
            'user_id' => Auth::id(),
            'tenant_id' => Auth::user()->tenant_id,
        ]);

        $note->load('user');

        return response()->json([
            'note' => $note,
            'message' => 'Note added successfully',
        ]);
    }

    /**
     * Update the specified note.
     */
    public function update(UpdateContactNoteRequest $request, ContactNote $note)
    {
        $note->update([
            'content' => $request->content,
        ]);

        $note->load('user');

        return response()->json([
            'note' => $note,
            'message' => 'Note updated successfully',
        ]);
    }

    /**
     * Remove the specified note.
     */
    public function destroy(ContactNote $note)
    {
        $this->authorize('delete', $note);

        $note->delete();

        return response()->json([
            'message' => 'Note deleted successfully',
        ]);
    }
} 