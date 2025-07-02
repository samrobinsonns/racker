# Notification System Documentation

## Overview

The Racker application includes a comprehensive notification system that provides both temporary toast notifications and persistent notifications stored in the database. This system is designed to work seamlessly with the multi-tenant architecture and provides a rich user experience for all user types.

## Features

### 🎯 Core Features
- **Toast Notifications**: Temporary notifications that auto-dismiss after 5 seconds
- **Persistent Notifications**: Stored notifications that appear in the notification center
- **Multi-tenant Support**: Notifications are properly scoped to tenants
- **Real-time Updates**: Live notification count and status updates
- **Rich Actions**: Support for action URLs and custom action text
- **Multiple Types**: Success, Error, Warning, and Info notification types
- **Read/Unread Management**: Mark individual or all notifications as read
- **Delete Functionality**: Remove individual notifications

### 🎨 UI Components
- **Notification Center**: Dropdown with notification list and management
- **Toast System**: Auto-dismissing notifications with progress bars
- **Badge Counter**: Unread notification count display
- **Responsive Design**: Works on all screen sizes
- **Theme Integration**: Adapts to user's theme (indigo/emerald)

## Architecture

### Frontend Components

#### 1. NotificationProvider (`resources/js/Components/Notifications/NotificationProvider.jsx`)
Global context provider that manages notification state across the application.

**Key Features:**
- Manages toast notifications and persistent notifications
- Provides convenience methods (`success`, `error`, `warning`, `info`)
- Handles notification lifecycle (add, remove, mark as read)
- Auto-cleanup of expired toasts

**Usage:**
```jsx
import { useNotifications } from '@/Components/Notifications/NotificationProvider';

const { success, error, warning, info, addNotification } = useNotifications();

// Toast notifications
success('Operation completed successfully');
error('Something went wrong');

// Persistent notifications
addNotification({
    type: 'info',
    title: 'System Update',
    message: 'New features are available',
    action_url: '/features',
    action_text: 'Learn More'
});
```

#### 2. NotificationCenter (`resources/js/Components/Notifications/NotificationCenter.jsx`)
Main notification dropdown component integrated into the AuthenticatedLayout.

**Features:**
- Displays notification list with read/unread status
- Mark individual or all notifications as read
- Delete notifications
- Refresh functionality
- Unread count badge
- Responsive design

**Props:**
```jsx
<NotificationCenter
    notifications={notifications}
    unreadCount={unreadCount}
    onMarkAsRead={handleMarkAsRead}
    onMarkAllAsRead={handleMarkAllAsRead}
    onDelete={handleDelete}
    onRefresh={loadNotifications}
    maxNotifications={10}
    showBadge={true}
    position="top-right"
    theme="default"
/>
```

#### 3. NotificationToast (`resources/js/Components/Notifications/NotificationToast.jsx`)
Individual toast notification component with progress bar and auto-dismiss.

**Features:**
- Auto-dismiss with configurable duration
- Progress bar showing time remaining
- Multiple positions (top-right, top-left, bottom-right, etc.)
- Action buttons support
- Smooth animations

### Backend Components

#### 1. Notification Model (`app/Models/Notification.php`)
Eloquent model for storing notifications in the database.

**Key Methods:**
```php
// Scopes
Notification::unread()->get();
Notification::read()->get();
Notification::ofType('success')->get();
Notification::forTenant($tenantId)->get();
Notification::forUser($userId)->get();

// Instance methods
$notification->markAsRead();
$notification->markAsUnread();
$notification->isUnread();
$notification->isRead();
```

**Database Schema:**
```sql
notifications:
- id (bigint, primary key)
- tenant_id (uuid, nullable)
- user_id (bigint, foreign key)
- type (string) - success, warning, error, info
- title (string, nullable)
- message (text)
- action_url (string, nullable)
- action_text (string, nullable)
- metadata (json, nullable)
- read_at (timestamp, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 2. NotificationController (`app/Http/Controllers/NotificationController.php`)
API controller for managing notifications.

**Endpoints:**
```php
GET    /api/notifications              // Get user's notifications
PATCH  /api/notifications/{id}/read    // Mark notification as read
PATCH  /api/notifications/mark-all-read // Mark all as read
DELETE /api/notifications/{id}         // Delete notification
DELETE /api/notifications              // Clear all notifications
GET    /api/notifications/stats        // Get notification statistics
```

#### 3. NotificationService (`app/Services/NotificationService.php`)
Service class for creating and managing notifications.

**Key Methods:**
```php
// Create notifications
$service->createForUser($user, 'success', 'Message');
$service->createForUsers($users, 'info', 'Message');
$service->createForTenant($tenantId, 'warning', 'Message');
$service->createForUsersWithRole($tenantId, 'admin', 'error', 'Message');
$service->createForUsersWithPermission($tenantId, 'manage_users', 'info', 'Message');

// Convenience methods
$service->success($user, 'Message');
$service->error($user, 'Message');
$service->warning($user, 'Message');
$service->info($user, 'Message');

// System notifications
$service->createSystemNotification('info', 'System message');
```

## Integration

### AuthenticatedLayout Integration

The notification system is automatically integrated into the AuthenticatedLayout:

```jsx
// In AuthenticatedLayout.jsx
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);

// Load notifications on mount
useEffect(() => {
    loadNotifications();
}, []);

// Notification center in header
<NotificationCenter
    notifications={notifications}
    unreadCount={unreadCount}
    onMarkAsRead={handleMarkAsRead}
    onMarkAllAsRead={handleMarkAllAsRead}
    onDelete={handleDeleteNotification}
    onRefresh={loadNotifications}
/>
```

### App-Level Integration

The NotificationProvider wraps the entire application:

```jsx
// In app.jsx
import NotificationProvider from '@/Components/Notifications/NotificationProvider';

root.render(
    <NotificationProvider>
        <App {...props} />
    </NotificationProvider>
);
```

## Usage Examples

### Creating Toast Notifications

```jsx
import { useNotifications } from '@/Components/Notifications/NotificationProvider';

function MyComponent() {
    const { success, error, warning, info } = useNotifications();

    const handleSuccess = () => {
        success('Operation completed successfully!', {
            title: 'Success',
            duration: 3000,
            position: 'top-right'
        });
    };

    const handleError = () => {
        error('Something went wrong. Please try again.', {
            title: 'Error',
            duration: 5000
        });
    };

    return (
        <div>
            <button onClick={handleSuccess}>Show Success</button>
            <button onClick={handleError}>Show Error</button>
        </div>
    );
}
```

### Creating Persistent Notifications

```jsx
import { useNotifications } from '@/Components/Notifications/NotificationProvider';

function MyComponent() {
    const { addNotification } = useNotifications();

    const createNotification = () => {
        addNotification({
            type: 'info',
            title: 'New Feature Available',
            message: 'Check out our latest updates in the dashboard.',
            action_url: '/dashboard',
            action_text: 'View Dashboard',
            metadata: {
                feature_id: 123,
                category: 'dashboard'
            }
        });
    };

    return <button onClick={createNotification}>Create Notification</button>;
}
```

### Backend Notification Creation

```php
use App\Services\NotificationService;

class MyController extends Controller
{
    public function someAction()
    {
        $notificationService = app(NotificationService::class);
        $user = auth()->user();

        // Create a success notification
        $notificationService->success(
            $user,
            'Your profile has been updated successfully.',
            'Profile Updated',
            '/profile',
            'View Profile'
        );

        // Create notification for all tenant users
        $notificationService->createForTenant(
            $user->tenant_id,
            'info',
            'System maintenance scheduled for tonight.',
            'Maintenance Notice',
            '/maintenance',
            'Learn More'
        );

        // Create notification for users with specific role
        $notificationService->createForUsersWithRole(
            $user->tenant_id,
            'admin',
            'warning',
            'New user registration requires approval.',
            'User Approval Required',
            '/admin/users',
            'Review Users'
        );
    }
}
```

## Configuration

### Notification Types

The system supports four notification types, each with distinct styling:

- **success**: Green theme with checkmark icon
- **error**: Red theme with exclamation icon
- **warning**: Yellow theme with warning icon
- **info**: Blue theme with information icon

### Toast Configuration

```jsx
// Default toast settings
{
    duration: 5000,        // Auto-dismiss after 5 seconds
    position: 'top-right', // Display position
    showProgress: true,    // Show progress bar
}

// Available positions
'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'
```

### Notification Center Configuration

```jsx
// Default center settings
{
    maxNotifications: 10,  // Max notifications to display
    showBadge: true,       // Show unread count badge
    position: 'top-right', // Dropdown position
    theme: 'default'       // Theme (default, dark, primary)
}
```

## API Reference

### Frontend API

#### useNotifications Hook

```jsx
const {
    // Toast notifications
    addToast,
    removeToast,
    toasts,
    
    // Persistent notifications
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    notifications,
    unreadCount,
    
    // Convenience methods
    success,
    error,
    warning,
    info,
} = useNotifications();
```

#### NotificationCenter Props

```jsx
interface NotificationCenterProps {
    notifications: Notification[];
    unreadCount: number;
    onMarkAsRead: (id: number) => Promise<void>;
    onMarkAllAsRead: () => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    onRefresh?: () => Promise<void>;
    maxNotifications?: number;
    showBadge?: boolean;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    theme?: 'default' | 'dark' | 'primary';
}
```

### Backend API

#### NotificationService Methods

```php
// Create notifications
public function createForUser(User $user, string $type, string $message, ?string $title = null, ?string $actionUrl = null, ?string $actionText = null, ?array $metadata = null): Notification
public function createForUsers(Collection $users, string $type, string $message, ?string $title = null, ?string $actionUrl = null, ?string $actionText = null, ?array $metadata = null): Collection
public function createForTenant(string $tenantId, string $type, string $message, ?string $title = null, ?string $actionUrl = null, ?string $actionText = null, ?array $metadata = null): Collection
public function createForUsersWithRole(string $tenantId, string $roleName, string $type, string $message, ?string $title = null, ?string $actionUrl = null, ?string $actionText = null, ?array $metadata = null): Collection
public function createForUsersWithPermission(string $tenantId, string $permission, string $type, string $message, ?string $title = null, ?string $actionUrl = null, ?string $actionText = null, ?array $metadata = null): Collection

// Convenience methods
public function success(User $user, string $message, ?string $title = null, ?string $actionUrl = null, ?string $actionText = null, ?array $metadata = null): Notification
public function error(User $user, string $message, ?string $title = null, ?string $actionUrl = null, ?string $actionText = null, ?array $metadata = null): Notification
public function warning(User $user, string $message, ?string $title = null, ?string $actionUrl = null, ?string $actionText = null, ?array $metadata = null): Notification
public function info(User $user, string $message, ?string $title = null, ?string $actionUrl = null, ?string $actionText = null, ?array $metadata = null): Notification

// Management methods
public function markAllAsRead(User $user): int
public function getUnreadCount(User $user): int
public function getRecentNotifications(User $user, int $limit = 10): Collection
public function deleteOldNotifications(int $days = 30): int
```

#### Notification Model Scopes

```php
// Query scopes
Notification::unread()->get();
Notification::read()->get();
Notification::ofType('success')->get();
Notification::forTenant($tenantId)->get();
Notification::forUser($userId)->get();

// Instance methods
$notification->markAsRead(): bool
$notification->markAsUnread(): bool
$notification->isUnread(): bool
$notification->isRead(): bool
```

## Testing

### Demo Page

A demo page is available at `/notification-demo` to test all notification features:

- Create toast notifications of all types
- Create persistent notifications
- Test notification center functionality
- Verify read/unread status
- Test delete functionality

### Manual Testing

1. **Toast Notifications:**
   - Navigate to `/notification-demo`
   - Click different toast buttons
   - Verify auto-dismiss behavior
   - Test different positions

2. **Persistent Notifications:**
   - Create persistent notifications
   - Check notification center
   - Mark notifications as read
   - Delete notifications

3. **API Testing:**
   - Test all API endpoints
   - Verify tenant scoping
   - Check permission restrictions

## Best Practices

### Frontend

1. **Use Appropriate Types:**
   - `success` for completed operations
   - `error` for failures and errors
   - `warning` for important notices
   - `info` for general information

2. **Keep Messages Concise:**
   - Use clear, actionable language
   - Include relevant context
   - Provide action URLs when appropriate

3. **Handle Loading States:**
   - Show loading indicators during API calls
   - Disable buttons during operations
   - Provide feedback for all actions

### Backend

1. **Use Service Layer:**
   - Always use NotificationService for creating notifications
   - Don't create Notification models directly
   - Leverage convenience methods when appropriate

2. **Proper Scoping:**
   - Always scope notifications to the correct tenant
   - Use role-based or permission-based targeting
   - Consider user preferences for notification types

3. **Performance:**
   - Use database indexes for queries
   - Implement cleanup for old notifications
   - Consider pagination for large notification lists

## Troubleshooting

### Common Issues

1. **Notifications Not Appearing:**
   - Check if NotificationProvider is properly wrapped
   - Verify API endpoints are accessible
   - Check browser console for errors

2. **Toast Notifications Not Working:**
   - Ensure useNotifications hook is imported
   - Check if component is within NotificationProvider
   - Verify notification type is valid

3. **Database Issues:**
   - Run migrations: `./vendor/bin/sail artisan migrate`
   - Check notification table exists
   - Verify foreign key constraints

4. **Permission Issues:**
   - Ensure user is authenticated
   - Check tenant scoping
   - Verify API route permissions

### Debug Commands

```bash
# Check notification table
./vendor/bin/sail artisan tinker
>>> App\Models\Notification::count()

# Clear old notifications
./vendor/bin/sail artisan tinker
>>> app(App\Services\NotificationService::class)->deleteOldNotifications(30)

# Test notification creation
./vendor/bin/sail artisan tinker
>>> $user = App\Models\User::first();
>>> app(App\Services\NotificationService::class)->success($user, 'Test notification');
```

## Future Enhancements

### Planned Features

1. **Real-time Notifications:**
   - WebSocket integration for live updates
   - Push notifications for mobile
   - Email notifications integration

2. **Advanced Filtering:**
   - Filter by notification type
   - Date range filtering
   - Search functionality

3. **Notification Preferences:**
   - User notification settings
   - Email notification preferences
   - Notification frequency controls

4. **Bulk Operations:**
   - Bulk mark as read
   - Bulk delete
   - Export notifications

5. **Analytics:**
   - Notification engagement metrics
   - Read rate tracking
   - User interaction analytics

### Integration Opportunities

1. **Support Tickets:**
   - Ticket status change notifications
   - Assignment notifications
   - Escalation alerts

2. **User Management:**
   - New user registration notifications
   - Role change notifications
   - Permission updates

3. **System Events:**
   - Maintenance notifications
   - System updates
   - Security alerts

## Conclusion

The notification system provides a robust foundation for user communication within the Racker application. It seamlessly integrates with the multi-tenant architecture and provides both immediate feedback through toasts and persistent communication through the notification center.

The system is designed to be extensible and can easily accommodate future enhancements such as real-time updates, advanced filtering, and integration with external notification services. 