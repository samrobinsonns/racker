# Notification System Integration Guide

## Overview

This guide helps developers integrate the notification system into their features and components. The notification system provides both immediate feedback (toasts) and persistent notifications stored in the database.

## Quick Integration Checklist

- [ ] Import `useNotifications` hook in your component
- [ ] Add toast notifications for user feedback
- [ ] Create persistent notifications for important events
- [ ] Test notifications in different scenarios
- [ ] Consider user permissions and tenant scoping

## Frontend Integration

### 1. Basic Toast Notifications

```jsx
import { useNotifications } from '@/Components/Notifications/NotificationProvider';

function MyComponent() {
    const { success, error, warning, info } = useNotifications();

    const handleSave = async () => {
        try {
            await saveData();
            success('Data saved successfully!');
        } catch (error) {
            error('Failed to save data. Please try again.');
        }
    };

    return <button onClick={handleSave}>Save</button>;
}
```

### 2. Form Validation Feedback

```jsx
function ContactForm() {
    const { error, success } = useNotifications();

    const handleSubmit = async (formData) => {
        // Validate form
        if (!formData.email) {
            error('Email address is required');
            return;
        }

        if (!formData.name) {
            error('Name is required');
            return;
        }

        try {
            await submitForm(formData);
            success('Contact created successfully!');
        } catch (error) {
            error('Failed to create contact. Please check your input.');
        }
    };
}
```

### 3. Bulk Operations

```jsx
function UserList() {
    const { success, error, warning } = useNotifications();

    const handleBulkDelete = async (userIds) => {
        if (userIds.length === 0) {
            warning('Please select users to delete');
            return;
        }

        const confirmed = confirm(`Delete ${userIds.length} users?`);
        if (!confirmed) return;

        try {
            await deleteUsers(userIds);
            success(`${userIds.length} users deleted successfully`);
        } catch (error) {
            error('Some users could not be deleted');
        }
    };
}
```

### 4. Persistent Notifications

```jsx
function SupportTicket() {
    const { addNotification } = useNotifications();

    const handleEscalate = async (ticketId) => {
        try {
            await escalateTicket(ticketId);
            
            // Create persistent notification for admins
            addNotification({
                type: 'warning',
                title: 'Ticket Escalated',
                message: `Support ticket #${ticketId} has been escalated and requires immediate attention.`,
                action_url: `/support-tickets/${ticketId}`,
                action_text: 'View Ticket'
            });

            success('Ticket escalated successfully');
        } catch (error) {
            error('Failed to escalate ticket');
        }
    };
}
```

## Backend Integration

### 1. Controller Integration

```php
use App\Services\NotificationService;

class UserController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function store(Request $request)
    {
        try {
            $user = User::create($request->validated());

            // Notify admins about new user
            $this->notificationService->createForUsersWithRole(
                $user->tenant_id,
                'admin',
                'info',
                "New user {$user->name} has been created",
                'New User Created',
                "/users/{$user->id}",
                'View User'
            );

            return redirect()->route('users.index')
                ->with('success', 'User created successfully');
        } catch (Exception $e) {
            return back()->with('error', 'Failed to create user');
        }
    }
}
```

### 2. Event-Driven Notifications

```php
// app/Events/UserRegistered.php
class UserRegistered
{
    public function __construct(public User $user) {}
}

// app/Listeners/SendWelcomeNotification.php
class SendWelcomeNotification
{
    public function __construct(protected NotificationService $notificationService) {}

    public function handle(UserRegistered $event): void
    {
        $this->notificationService->success(
            $event->user,
            'Welcome to our platform! Get started by completing your profile.',
            'Welcome!',
            '/profile',
            'Complete Profile'
        );
    }
}
```

### 3. Scheduled Notifications

```php
// app/Console/Commands/SendMaintenanceNotifications.php
class SendMaintenanceNotifications extends Command
{
    public function handle(NotificationService $notificationService): int
    {
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            $notificationService->createForTenant(
                $tenant->id,
                'warning',
                'Scheduled maintenance will begin in 1 hour. Please save your work.',
                'Maintenance Notice',
                '/maintenance',
                'View Details'
            );
        }

        return Command::SUCCESS;
    }
}
```

## Integration Patterns

### 1. CRUD Operations

```php
class ContactController extends Controller
{
    public function store(Request $request)
    {
        $contact = Contact::create($request->validated());

        // Notify relevant users
        $this->notificationService->createForUsersWithPermission(
            $contact->tenant_id,
            'manage_contacts',
            'info',
            "New contact {$contact->name} added",
            'New Contact',
            "/contacts/{$contact->id}",
            'View Contact'
        );

        return response()->json(['success' => true]);
    }

    public function update(Request $request, Contact $contact)
    {
        $contact->update($request->validated());

        // Notify contact owner
        if ($contact->owner_id) {
            $this->notificationService->info(
                $contact->owner,
                "Contact {$contact->name} has been updated",
                'Contact Updated',
                "/contacts/{$contact->id}",
                'View Contact'
            );
        }
    }
}
```

### 2. Status Changes

```php
class SupportTicketController extends Controller
{
    public function changeStatus(Request $request, SupportTicket $ticket)
    {
        $oldStatus = $ticket->status;
        $ticket->update(['status' => $request->status]);

        // Notify requester
        $this->notificationService->info(
            $ticket->requester,
            "Your ticket #{$ticket->ticket_number} status changed from {$oldStatus} to {$ticket->status}",
            'Ticket Status Updated',
            "/support-tickets/{$ticket->id}",
            'View Ticket'
        );

        // Notify assignee if different from requester
        if ($ticket->assignee && $ticket->assignee->id !== $ticket->requester->id) {
            $this->notificationService->info(
                $ticket->assignee,
                "Ticket #{$ticket->ticket_number} status changed to {$ticket->status}",
                'Ticket Status Updated',
                "/support-tickets/{$ticket->id}",
                'View Ticket'
            );
        }
    }
}
```

### 3. System Alerts

```php
class SystemHealthController extends Controller
{
    public function checkSystemHealth()
    {
        $issues = $this->detectIssues();

        if (!empty($issues)) {
            $this->notificationService->createForUsersWithPermission(
                auth()->user()->tenant_id,
                'manage_system',
                'error',
                'System health issues detected: ' . implode(', ', $issues),
                'System Alert',
                '/system/health',
                'View Details'
            );
        }
    }
}
```

## Testing Integration

### 1. Frontend Testing

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { useNotifications } from '@/Components/Notifications/NotificationProvider';

// Mock the notification hook
jest.mock('@/Components/Notifications/NotificationProvider');

function TestComponent() {
    const { success, error } = useNotifications();

    return (
        <div>
            <button onClick={() => success('Test success')}>Success</button>
            <button onClick={() => error('Test error')}>Error</button>
        </div>
    );
}

test('shows success notification', () => {
    const mockSuccess = jest.fn();
    useNotifications.mockReturnValue({ success: mockSuccess, error: jest.fn() });

    render(<TestComponent />);
    fireEvent.click(screen.getByText('Success'));

    expect(mockSuccess).toHaveBeenCalledWith('Test success');
});
```

### 2. Backend Testing

```php
class NotificationTest extends TestCase
{
    public function test_creates_notification_on_user_creation()
    {
        $user = User::factory()->create();
        $notificationService = app(NotificationService::class);

        $notificationService->success($user, 'Welcome!');

        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'type' => 'success',
            'message' => 'Welcome!'
        ]);
    }

    public function test_notification_scoped_to_tenant()
    {
        $tenant1 = Tenant::factory()->create();
        $tenant2 = Tenant::factory()->create();
        $user1 = User::factory()->create(['tenant_id' => $tenant1->id]);
        $user2 = User::factory()->create(['tenant_id' => $tenant2->id]);

        $notificationService = app(NotificationService::class);
        $notificationService->createForTenant($tenant1->id, 'info', 'Test message');

        $this->assertDatabaseHas('notifications', [
            'tenant_id' => $tenant1->id,
            'user_id' => $user1->id
        ]);

        $this->assertDatabaseMissing('notifications', [
            'tenant_id' => $tenant2->id,
            'user_id' => $user2->id
        ]);
    }
}
```

## Best Practices

### 1. Notification Timing

- **Immediate Feedback**: Use toasts for form submissions, button clicks
- **Important Events**: Use persistent notifications for status changes, assignments
- **System Events**: Use persistent notifications for maintenance, updates

### 2. Message Content

- Keep messages concise and actionable
- Include relevant context (IDs, names, etc.)
- Provide action URLs when appropriate
- Use appropriate notification types

### 3. User Targeting

- Target specific users for personal notifications
- Use role-based targeting for administrative notifications
- Use permission-based targeting for feature-specific notifications
- Consider user preferences and settings

### 4. Performance

- Batch notifications when possible
- Use database transactions for multiple notifications
- Implement cleanup for old notifications
- Consider caching for frequently accessed data

## Common Use Cases

### 1. User Management

```php
// New user registration
$notificationService->createForUsersWithRole($tenantId, 'admin', 'info', 'New user registered');

// User role change
$notificationService->info($user, 'Your role has been updated to Admin');

// User deactivation
$notificationService->warning($user, 'Your account has been temporarily suspended');
```

### 2. Content Management

```php
// New content published
$notificationService->createForTenant($tenantId, 'info', 'New article published: ' . $article->title);

// Content approval required
$notificationService->createForUsersWithPermission($tenantId, 'approve_content', 'warning', 'Content requires approval');
```

### 3. System Maintenance

```php
// Scheduled maintenance
$notificationService->createForTenant($tenantId, 'warning', 'Scheduled maintenance in 1 hour');

// Emergency maintenance
$notificationService->createForTenant($tenantId, 'error', 'Emergency maintenance in progress');
```

### 4. Security Alerts

```php
// Suspicious login
$notificationService->error($user, 'Suspicious login detected from new location');

// Password change
$notificationService->info($user, 'Your password was changed successfully');
```

## Troubleshooting

### Common Issues

1. **Notifications not appearing**
   - Check if NotificationProvider is properly wrapped
   - Verify API endpoints are accessible
   - Check browser console for errors

2. **Wrong tenant scoping**
   - Ensure tenant_id is properly set
   - Check user's tenant association
   - Verify notification service methods

3. **Permission issues**
   - Check user permissions
   - Verify role assignments
   - Test with different user types

### Debug Commands

```bash
# Check notification table
./vendor/bin/sail artisan tinker
>>> App\Models\Notification::count()

# Test notification creation
>>> $user = App\Models\User::first();
>>> app(App\Services\NotificationService::class)->success($user, 'Test');

# Check tenant scoping
>>> App\Models\Notification::forTenant($user->tenant_id)->get();
```

## Next Steps

1. **Review existing features** for notification opportunities
2. **Add notifications** to critical user actions
3. **Test notifications** in different scenarios
4. **Monitor notification usage** and user feedback
5. **Consider advanced features** like email notifications, push notifications 