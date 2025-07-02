<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Events\NotificationCreated;
use Illuminate\Support\Collection;

class NotificationService
{
    /**
     * Create a notification for a single user.
     */
    public function createForUser(
        User $user,
        string $type,
        string $message,
        ?string $title = null,
        ?string $actionUrl = null,
        ?string $actionText = null,
        ?array $metadata = null
    ): Notification {
        $notification = Notification::create([
            'tenant_id' => $user->tenant_id,
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
            'action_text' => $actionText,
            'metadata' => $metadata,
        ]);

        // Broadcast the notification in real-time
        \Log::info('Dispatching NotificationCreated event', [
            'notification_id' => $notification->id,
            'user_id' => $notification->user_id,
            'type' => $notification->type,
            'message' => $notification->message,
        ]);
        
        event(new NotificationCreated($notification));

        return $notification;
    }

    /**
     * Create notifications for multiple users.
     */
    public function createForUsers(
        Collection $users,
        string $type,
        string $message,
        ?string $title = null,
        ?string $actionUrl = null,
        ?string $actionText = null,
        ?array $metadata = null
    ): Collection {
        $notifications = [];

        foreach ($users as $user) {
            $notifications[] = $this->createForUser(
                $user,
                $type,
                $message,
                $title,
                $actionUrl,
                $actionText,
                $metadata
            );
        }

        return collect($notifications);
    }

    /**
     * Create a notification for all users in a tenant.
     */
    public function createForTenant(
        string $tenantId,
        string $type,
        string $message,
        ?string $title = null,
        ?string $actionUrl = null,
        ?string $actionText = null,
        ?array $metadata = null
    ): Collection {
        $users = User::where('tenant_id', $tenantId)->get();
        return $this->createForUsers($users, $type, $message, $title, $actionUrl, $actionText, $metadata);
    }

    /**
     * Create a notification for users with specific roles.
     */
    public function createForUsersWithRole(
        string $tenantId,
        string $roleName,
        string $type,
        string $message,
        ?string $title = null,
        ?string $actionUrl = null,
        ?string $actionText = null,
        ?array $metadata = null
    ): Collection {
        $users = User::where('tenant_id', $tenantId)
            ->whereHas('roles', function ($query) use ($roleName) {
                $query->where('name', $roleName);
            })
            ->get();

        return $this->createForUsers($users, $type, $message, $title, $actionUrl, $actionText, $metadata);
    }

    /**
     * Create a notification for users with specific permissions.
     */
    public function createForUsersWithPermission(
        string $tenantId,
        string $permission,
        string $type,
        string $message,
        ?string $title = null,
        ?string $actionUrl = null,
        ?string $actionText = null,
        ?array $metadata = null
    ): Collection {
        $users = User::where('tenant_id', $tenantId)
            ->whereHas('roles', function ($query) use ($permission) {
                $query->whereJsonContains('permissions', $permission);
            })
            ->get();

        return $this->createForUsers($users, $type, $message, $title, $actionUrl, $actionText, $metadata);
    }

    /**
     * Create a success notification.
     */
    public function success(
        User $user,
        string $message,
        ?string $title = null,
        ?string $actionUrl = null,
        ?string $actionText = null,
        ?array $metadata = null
    ): Notification {
        return $this->createForUser($user, 'success', $message, $title, $actionUrl, $actionText, $metadata);
    }

    /**
     * Create an error notification.
     */
    public function error(
        User $user,
        string $message,
        ?string $title = null,
        ?string $actionUrl = null,
        ?string $actionText = null,
        ?array $metadata = null
    ): Notification {
        return $this->createForUser($user, 'error', $message, $title, $actionUrl, $actionText, $metadata);
    }

    /**
     * Create a warning notification.
     */
    public function warning(
        User $user,
        string $message,
        ?string $title = null,
        ?string $actionUrl = null,
        ?string $actionText = null,
        ?array $metadata = null
    ): Notification {
        return $this->createForUser($user, 'warning', $message, $title, $actionUrl, $actionText, $metadata);
    }

    /**
     * Create an info notification.
     */
    public function info(
        User $user,
        string $message,
        ?string $title = null,
        ?string $actionUrl = null,
        ?string $actionText = null,
        ?array $metadata = null
    ): Notification {
        return $this->createForUser($user, 'info', $message, $title, $actionUrl, $actionText, $metadata);
    }

    /**
     * Mark all notifications as read for a user.
     */
    public function markAllAsRead(User $user): int
    {
        $query = Notification::forUser($user->id)->unread();
        
        if ($user->tenant_id) {
            $query->forTenant($user->tenant_id);
        }

        return $query->update(['read_at' => now()]);
    }

    /**
     * Get unread count for a user.
     */
    public function getUnreadCount(User $user): int
    {
        $query = Notification::forUser($user->id)->unread();
        
        if ($user->tenant_id) {
            $query->forTenant($user->tenant_id);
        }

        return $query->count();
    }

    /**
     * Get recent notifications for a user.
     */
    public function getRecentNotifications(User $user, int $limit = 10): Collection
    {
        $query = Notification::forUser($user->id)
            ->orderBy('created_at', 'desc')
            ->limit($limit);
        
        if ($user->tenant_id) {
            $query->forTenant($user->tenant_id);
        }

        return $query->get();
    }

    /**
     * Delete old notifications (older than specified days).
     */
    public function deleteOldNotifications(int $days = 30): int
    {
        $cutoffDate = now()->subDays($days);
        
        return Notification::where('created_at', '<', $cutoffDate)->delete();
    }

    /**
     * Create a system notification (for central admin).
     */
    public function createSystemNotification(
        string $type,
        string $message,
        ?string $title = null,
        ?string $actionUrl = null,
        ?string $actionText = null,
        ?array $metadata = null
    ): Collection {
        $users = User::where('is_central_admin', true)->get();
        return $this->createForUsers($users, $type, $message, $title, $actionUrl, $actionText, $metadata);
    }
} 