# Notification System Quick Reference

## Quick Start

### 1. Frontend Usage

```jsx
import { useNotifications } from '@/Components/Notifications/NotificationProvider';

function MyComponent() {
    const { success, error, warning, info, addNotification } = useNotifications();

    // Toast notifications (auto-dismiss)
    success('Operation completed!');
    error('Something went wrong');
    warning('Please review your input');
    info('New features available');

    // Persistent notifications (stored in database)
    addNotification({
        type: 'info',
        title: 'System Update',
        message: 'Maintenance scheduled for tonight',
        action_url: '/maintenance',
        action_text: 'Learn More'
    });
}
```

### 2. Backend Usage

```php
use App\Services\NotificationService;

class MyController extends Controller
{
    public function someAction()
    {
        $service = app(NotificationService::class);
        $user = auth()->user();

        // Quick methods
        $service->success($user, 'Profile updated!');
        $service->error($user, 'Failed to save changes');
        $service->warning($user, 'Please complete your profile');
        $service->info($user, 'New features available');

        // Advanced methods
        $service->createForTenant($user->tenant_id, 'info', 'System maintenance tonight');
        $service->createForUsersWithRole($user->tenant_id, 'admin', 'warning', 'New user requires approval');
    }
}
```

## Component Props

### NotificationCenter

```jsx
<NotificationCenter
    notifications={notifications}           // Array of notification objects
    unreadCount={unreadCount}              // Number of unread notifications
    onMarkAsRead={handleMarkAsRead}        // Function to mark as read
    onMarkAllAsRead={handleMarkAllAsRead}  // Function to mark all as read
    onDelete={handleDelete}                // Function to delete notification
    onRefresh={loadNotifications}          // Function to refresh list
    maxNotifications={10}                  // Max notifications to show
    showBadge={true}                       // Show unread count badge
    position="top-right"                   // Dropdown position
    theme="default"                        // Theme (default, dark, primary)
/>
```

### NotificationToast

```jsx
<NotificationToast
    notification={{
        type: 'success',                   // success, error, warning, info
        title: 'Success',                  // Optional title
        message: 'Operation completed',    // Required message
        action: {                          // Optional action
            text: 'View Details',
            onClick: () => {}
        }
    }}
    onClose={() => {}}                     // Close handler
    duration={5000}                        // Auto-dismiss time (ms)
    position="top-right"                   // Display position
    showProgress={true}                    // Show progress bar
/>
```

## API Endpoints

### Get Notifications
```http
GET /api/notifications
GET /api/notifications?limit=20&type=success&unread_only=true
```

### Mark as Read
```http
PATCH /api/notifications/{id}/read
PATCH /api/notifications/mark-all-read
```

### Delete Notifications
```http
DELETE /api/notifications/{id}
DELETE /api/notifications
```

### Get Statistics
```http
GET /api/notifications/stats
```

## Database Schema

```sql
notifications:
├── id (bigint, primary key)
├── tenant_id (uuid, nullable)
├── user_id (bigint, foreign key)
├── type (string) - success, warning, error, info
├── title (string, nullable)
├── message (text)
├── action_url (string, nullable)
├── action_text (string, nullable)
├── metadata (json, nullable)
├── read_at (timestamp, nullable)
├── created_at (timestamp)
└── updated_at (timestamp)
```

## Model Scopes

```php
// Query scopes
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

## Service Methods

### Create Notifications
```php
// Single user
$service->createForUser($user, 'success', 'Message');

// Multiple users
$service->createForUsers($users, 'info', 'Message');

// All tenant users
$service->createForTenant($tenantId, 'warning', 'Message');

// Users with specific role
$service->createForUsersWithRole($tenantId, 'admin', 'error', 'Message');

// Users with specific permission
$service->createForUsersWithPermission($tenantId, 'manage_users', 'info', 'Message');
```

### Convenience Methods
```php
$service->success($user, 'Message');
$service->error($user, 'Message');
$service->warning($user, 'Message');
$service->info($user, 'Message');
```

### Management Methods
```php
$service->markAllAsRead($user);
$service->getUnreadCount($user);
$service->getRecentNotifications($user, 10);
$service->deleteOldNotifications(30);
```

## Notification Types & Styling

| Type | Color | Icon | Use Case |
|------|-------|------|----------|
| `success` | Green | ✓ | Completed operations, confirmations |
| `error` | Red | ⚠ | Errors, failures, critical issues |
| `warning` | Yellow | ⚠ | Warnings, important notices |
| `info` | Blue | ℹ | General information, updates |

## Toast Positions

```jsx
'top-right'     // Default
'top-left'
'bottom-right'
'bottom-left'
'top-center'
'bottom-center'
```

## Common Patterns

### Form Submission Feedback
```jsx
const handleSubmit = async (formData) => {
    try {
        await submitForm(formData);
        success('Form submitted successfully!');
    } catch (error) {
        error('Failed to submit form. Please try again.');
    }
};
```

### Bulk Operations
```jsx
const handleBulkDelete = async (ids) => {
    try {
        await deleteItems(ids);
        success(`${ids.length} items deleted successfully`);
    } catch (error) {
        error('Some items could not be deleted');
    }
};
```

### System Notifications
```php
// Maintenance notice
$service->createForTenant($tenantId, 'warning', 'System maintenance scheduled for 2:00 AM');

// Feature announcement
$service->createForTenant($tenantId, 'info', 'New dashboard features are now available', 'New Features', '/dashboard');

// Security alert
$service->createForUsersWithPermission($tenantId, 'manage_security', 'error', 'Suspicious login detected', 'Security Alert', '/security');
```

## Testing

### Demo Page
Visit `/notification-demo` to test all notification features.

### Manual Testing Commands
```bash
# Check notifications in database
./vendor/bin/sail artisan tinker
>>> App\Models\Notification::count()

# Create test notification
>>> $user = App\Models\User::first();
>>> app(App\Services\NotificationService::class)->success($user, 'Test notification');

# Clear old notifications
>>> app(App\Services\NotificationService::class)->deleteOldNotifications(30);
```

## Troubleshooting

### Notifications Not Appearing
1. Check if `NotificationProvider` wraps your app
2. Verify API endpoints are accessible
3. Check browser console for errors
4. Ensure user is authenticated

### Toast Notifications Not Working
1. Import `useNotifications` hook
2. Ensure component is within `NotificationProvider`
3. Verify notification type is valid
4. Check for JavaScript errors

### Database Issues
1. Run migrations: `./vendor/bin/sail artisan migrate`
2. Check notification table exists
3. Verify foreign key constraints
4. Check tenant scoping

## Best Practices

### Frontend
- Use appropriate notification types
- Keep messages concise and actionable
- Provide action URLs when relevant
- Handle loading states properly

### Backend
- Always use `NotificationService`
- Properly scope to tenants
- Use role/permission-based targeting
- Implement cleanup for old notifications

### Performance
- Use database indexes
- Implement pagination for large lists
- Clean up old notifications regularly
- Consider caching for frequently accessed data 