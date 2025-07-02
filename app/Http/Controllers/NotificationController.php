<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get notifications for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $limit = $request->get('limit', 20);
        $type = $request->get('type');
        $unreadOnly = $request->boolean('unread_only', false);

        $query = Notification::forUser($user->id)
            ->when($user->tenant_id, function ($query) use ($user) {
                $query->forTenant($user->tenant_id);
            })
            ->when($type, function ($query) use ($type) {
                $query->ofType($type);
            })
            ->when($unreadOnly, function ($query) {
                $query->unread();
            })
            ->orderBy('created_at', 'desc');

        $notifications = $query->limit($limit)->get();
        $unreadCount = Notification::forUser($user->id)
            ->when($user->tenant_id, function ($query) use ($user) {
                $query->forTenant($user->tenant_id);
            })
            ->unread()
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Request $request, Notification $notification): JsonResponse
    {
        $user = Auth::user();

        // Ensure the notification belongs to the user
        if ($notification->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read',
            'notification' => $notification->fresh(),
        ]);
    }

    /**
     * Mark all notifications as read for the user.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = Notification::forUser($user->id)->unread();
        
        if ($user->tenant_id) {
            $query->forTenant($user->tenant_id);
        }

        $updated = $query->update(['read_at' => now()]);

        return response()->json([
            'message' => "Marked {$updated} notifications as read",
            'updated_count' => $updated,
        ]);
    }

    /**
     * Delete a notification.
     */
    public function destroy(Notification $notification): JsonResponse
    {
        $user = Auth::user();

        // Ensure the notification belongs to the user
        if ($notification->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->delete();

        return response()->json([
            'message' => 'Notification deleted successfully',
        ]);
    }

    /**
     * Clear all notifications for the user.
     */
    public function clearAll(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = Notification::forUser($user->id);
        
        if ($user->tenant_id) {
            $query->forTenant($user->tenant_id);
        }

        $deleted = $query->delete();

        return response()->json([
            'message' => "Cleared {$deleted} notifications",
            'deleted_count' => $deleted,
        ]);
    }

    /**
     * Get notification statistics for the user.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = Notification::forUser($user->id);
        
        if ($user->tenant_id) {
            $query->forTenant($user->tenant_id);
        }

        $stats = [
            'total' => $query->count(),
            'unread' => $query->unread()->count(),
            'read' => $query->read()->count(),
            'by_type' => [
                'success' => $query->ofType('success')->count(),
                'warning' => $query->ofType('warning')->count(),
                'error' => $query->ofType('error')->count(),
                'info' => $query->ofType('info')->count(),
            ],
        ];

        return response()->json($stats);
    }
} 