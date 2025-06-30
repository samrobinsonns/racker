<?php

namespace App\Http\Controllers;

use App\Models\ContactTag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\StoreContactTagRequest;
use App\Http\Requests\UpdateContactTagRequest;

class ContactTagController extends Controller
{
    /**
     * Display a listing of the tags.
     */
    public function index()
    {
        $tags = ContactTag::forTenant()
            ->orderBy('name')
            ->get();

        return inertia('Contacts/Tags/Index', [
            'tags' => $tags,
        ]);
    }

    /**
     * Store a newly created tag.
     */
    public function store(StoreContactTagRequest $request)
    {
        $tag = ContactTag::create([
            'name' => $request->name,
            'tenant_id' => Auth::user()->tenant_id,
        ]);

        return response()->json([
            'tag' => $tag,
            'message' => 'Tag created successfully',
        ]);
    }

    /**
     * Update the specified tag.
     */
    public function update(UpdateContactTagRequest $request, ContactTag $tag)
    {
        $tag->update([
            'name' => $request->name,
        ]);

        return response()->json([
            'tag' => $tag,
            'message' => 'Tag updated successfully',
        ]);
    }

    /**
     * Remove the specified tag.
     */
    public function destroy(ContactTag $tag)
    {
        $this->authorize('delete', $tag);

        $tag->delete();

        return response()->json([
            'message' => 'Tag deleted successfully',
        ]);
    }

    /**
     * Search tags by name.
     */
    public function search(Request $request)
    {
        $tags = ContactTag::forTenant()
            ->where('name', 'like', "%{$request->search}%")
            ->orderBy('name')
            ->limit(10)
            ->get();

        return response()->json([
            'tags' => $tags,
        ]);
    }

    /**
     * Get popular tags.
     */
    public function popular()
    {
        $tags = ContactTag::forTenant()
            ->withCount('contacts')
            ->orderByDesc('contacts_count')
            ->limit(10)
            ->get();

        return response()->json([
            'tags' => $tags,
        ]);
    }
}
