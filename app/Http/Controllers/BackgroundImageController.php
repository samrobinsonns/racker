<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BackgroundImageController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'background_image' => ['required', 'image', 'max:5120'], // 5MB max
        ]);

        $path = $request->file('background_image')->store('background-images', 'public');
        $url = Storage::url($path);

        $user = $request->user();
        
        // Delete old background image if it exists
        if ($user->background_image_url) {
            $oldPath = str_replace('/storage/', '', $user->background_image_url);
            Storage::disk('public')->delete($oldPath);
        }

        $user->update([
            'background_image_url' => $url,
        ]);

        return response()->json([
            'url' => $url,
        ]);
    }

    public function destroy(Request $request)
    {
        $user = $request->user();

        if ($user->background_image_url) {
            $path = str_replace('/storage/', '', $user->background_image_url);
            Storage::disk('public')->delete($path);
        }

        $user->update([
            'background_image_url' => null,
        ]);

        return back();
    }
} 