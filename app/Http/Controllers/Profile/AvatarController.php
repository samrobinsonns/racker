<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class AvatarController extends Controller
{
    public function store(Request $request)
    {
        try {
            // Debug raw request
            Log::info('Raw request details', [
                'content_type' => $request->header('Content-Type'),
                'method' => $request->method(),
                'all_input' => $request->all(),
                'all_files' => $request->allFiles(),
            ]);

            // Debug request information
            Log::info('Avatar upload request details', [
                'user_id' => $request->user()->id,
                'has_file' => $request->hasFile('avatar'),
                'files' => $request->allFiles(),
                'file_info' => $request->hasFile('avatar') ? [
                    'original_name' => $request->file('avatar')->getClientOriginalName(),
                    'mime_type' => $request->file('avatar')->getMimeType(),
                    'size' => $request->file('avatar')->getSize(),
                    'error' => $request->file('avatar')->getError(),
                    'path' => $request->file('avatar')->path(),
                    'extension' => $request->file('avatar')->extension(),
                ] : 'No file found',
                'request_keys' => array_keys($request->all()),
            ]);

            $request->validate([
                'avatar' => ['required', 'image', 'max:2048'], // 2MB Max
            ]);

            $user = $request->user();

            // Debug storage disk information
            Log::info('Storage disk information', [
                'disk' => 'public',
                'disk_root' => Storage::disk('public')->path(''),
                'disk_exists' => Storage::disk('public')->exists(''),
                'avatars_dir_exists' => Storage::disk('public')->exists('avatars'),
                'is_writable' => is_writable(Storage::disk('public')->path('')),
                'permissions' => decoct(fileperms(Storage::disk('public')->path(''))),
            ]);

            // Delete old avatar if exists
            if ($user->avatar_url) {
                $oldPath = str_replace('/storage/', '', $user->avatar_url);
                Log::info('Attempting to delete old avatar', [
                    'old_path' => $oldPath,
                    'full_old_path' => Storage::disk('public')->path($oldPath),
                    'exists' => Storage::disk('public')->exists($oldPath)
                ]);
                
                if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            // Store new avatar with explicit filename
            $file = $request->file('avatar');
            $extension = $file->getClientOriginalExtension();
            $filename = Str::random(40) . '.' . $extension;
            
            Log::info('Preparing to store new avatar', [
                'original_name' => $file->getClientOriginalName(),
                'new_filename' => $filename,
                'extension' => $extension,
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
            ]);

            $path = $file->storeAs('avatars', $filename, 'public');

            Log::info('New avatar storage attempt', [
                'generated_filename' => $filename,
                'target_path' => $path,
                'full_storage_path' => Storage::disk('public')->path($path),
                'file_exists_after_store' => Storage::disk('public')->exists($path)
            ]);

            // Verify the file was actually stored
            if (!Storage::disk('public')->exists($path)) {
                Log::error('Failed to store avatar file', [
                    'path' => $path,
                    'disk_path' => Storage::disk('public')->path($path)
                ]);
                throw new \Exception('Failed to store avatar file');
            }

            $user->avatar_url = '/storage/' . $path;
            $user->save();

            Log::info('Avatar upload completed', [
                'user_id' => $user->id,
                'new_avatar_url' => $user->avatar_url,
                'file_exists' => Storage::disk('public')->exists($path)
            ]);

            return back()->with('success', 'Avatar updated successfully.');
        } catch (\Exception $e) {
            Log::error('Avatar upload failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    public function destroy(Request $request)
    {
        try {
            $user = $request->user();
            Log::info('Avatar removal started', [
                'user_id' => $user->id,
                'current_avatar_url' => $user->avatar_url
            ]);

            if ($user->avatar_url) {
                $path = str_replace('/storage/', '', $user->avatar_url);
                Log::info('Attempting to delete avatar', [
                    'path' => $path,
                    'exists' => Storage::disk('public')->exists($path)
                ]);

                if ($path && Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                    Log::info('Avatar file deleted');
                }
                
                $user->avatar_url = null;
                $user->save();
                Log::info('Avatar removed from user record');
            }

            return back()->with('success', 'Avatar removed successfully.');
        } catch (\Exception $e) {
            Log::error('Avatar removal failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
}
