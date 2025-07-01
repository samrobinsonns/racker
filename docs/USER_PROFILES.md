# User Profile System

## Overview
The user profile system provides functionality for both viewing and managing user profiles within the application. It consists of two main interfaces:
1. **Profile Management** - Where users can edit their own profile
2. **Profile Viewing** - Where users can view other users' profiles

## Features

### Profile Management
Users can manage their own profile through the following features:
- Update personal information (name, email, title, location)
- Change profile picture (avatar)
- Set background image
- Manage security settings
- Configure preferences
- View personal activity feed

### Profile Viewing
Users can view other users' profiles with the following information:
- Basic information (name, email)
- Professional details (title, role, location)
- Profile picture and background image
- Biography
- Professional information
- Organization affiliation

## Routes

| Method | URI | Name | Description |
|--------|-----|------|-------------|
| GET | `/profile` | `profile.edit` | Edit own profile |
| GET | `/profile/{user}` | `profile.show` | View another user's profile |
| PATCH | `/profile` | `profile.update` | Update profile information |
| DELETE | `/profile` | `profile.destroy` | Delete profile |
| GET | `/profile/activities` | `profile.activities` | Get user activities |
| POST | `/profile/avatar` | `profile.avatar.store` | Upload avatar |
| DELETE | `/profile/avatar` | `profile.avatar.destroy` | Remove avatar |
| POST | `/profile/background` | `profile.background.store` | Upload background |
| DELETE | `/profile/background` | `profile.background.destroy` | Remove background |

## Components

### Profile Header
The profile header component (`ProfileHeader.jsx`) displays:
- User's background image
- Profile picture
- Basic information
- Navigation tabs (in edit mode only)

```jsx
<ProfileHeader 
    user={user}
    activeTab="overview"
    onTabChange={setActiveTab}
/>
```

### Profile Overview
The profile overview component (`ProfileOverview.jsx`) shows:
- Biography
- Professional information
- Recent activity (in edit mode only)
- Projects (in edit mode only)

```jsx
<ProfileOverview 
    user={user}
    readOnly={true} // Set to true for view mode
/>
```

## Integration

### Linking to Profiles
You can link to user profiles from anywhere in the application using the `route()` helper:

```jsx
<Link
    href={route('profile.show', { user: userId })}
    className="font-medium text-gray-900 hover:text-violet-600"
>
    {userName}
</Link>
```

### Activity Logs
The profile system is integrated with the activity logging system. When viewing tickets or other activities, user names are automatically linked to their profiles:

```jsx
{log.user ? (
    <Link
        href={route('profile.show', { user: log.user.id })}
        className="font-medium text-gray-900 hover:text-violet-600"
    >
        {log.user.name}
    </Link>
) : (
    <span className="font-medium text-gray-900">System</span>
)}
```

## Security Considerations

### Authorization
- Users can only edit their own profiles
- Profile viewing is restricted to authenticated users
- Sensitive information is filtered out in view mode
- Role and permission information is appropriately restricted

### Data Protection
- Email addresses are only shown to authenticated users
- Avatar and background images are stored securely
- Personal information is properly sanitized before display

## Customization

### Adding New Profile Fields
1. Add the field to the User model
2. Update the ProfileController's update method
3. Add the field to the profile form component
4. Update the profile view component

Example:
```php
// In ProfileController
public function update(Request $request): RedirectResponse
{
    $validated = $request->validate([
        'new_field' => ['nullable', 'string', 'max:255'],
        // ... other fields
    ]);
    
    $request->user()->fill($validated);
    $request->user()->save();
    
    return Redirect::route('profile.edit');
}
```

### Styling
The profile system uses Tailwind CSS classes for styling. You can customize the appearance by:
1. Modifying the existing classes
2. Adding new CSS classes
3. Updating the color scheme in the Tailwind configuration

## Testing

### Feature Tests
Test the profile system functionality:
```php
public function test_users_can_view_other_profiles()
{
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    
    $response = $this->actingAs($user)
        ->get(route('profile.show', $otherUser));
    
    $response->assertStatus(200)
        ->assertSee($otherUser->name)
        ->assertSee($otherUser->email);
}
```

### Component Tests
Test the React components:
```javascript
import { render, screen } from '@testing-library/react';
import ProfileOverview from './ProfileOverview';

test('renders profile overview in readonly mode', () => {
    const user = {
        name: 'Test User',
        email: 'test@example.com',
    };
    
    render(<ProfileOverview user={user} readOnly={true} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
});
```

## Best Practices

1. **Performance**
   - Lazy load images
   - Cache user data where appropriate
   - Optimize database queries

2. **Accessibility**
   - Use semantic HTML
   - Include proper ARIA labels
   - Ensure keyboard navigation

3. **Maintenance**
   - Keep components modular
   - Document changes
   - Follow consistent naming conventions

## Troubleshooting

### Common Issues

1. **Profile Images Not Loading**
   - Check storage permissions
   - Verify image paths
   - Ensure proper image formats

2. **Activity Feed Not Updating**
   - Check WebSocket connection
   - Verify event listeners
   - Review database queries

3. **Permission Issues**
   - Verify user roles
   - Check route middleware
   - Review authorization policies 