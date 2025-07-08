# Laravel Chatify Implementation Plan

## Overview
This document outlines the plan to replace the current custom messaging system with Laravel Chatify, ensuring proper multi-tenancy support and integration with the existing Racker system.

## Current System
Currently, we have a custom messaging implementation:
- `Messages.jsx` (Inertia page)
- `Components/Messaging/` directory with components:
  - ChatInterface.jsx
  - ConversationList.jsx
  - MessageArea.jsx
  - MessageBubble.jsx
  - NewConversationModal.jsx
  - TypingIndicator.jsx

## Implementation Phases

### Phase 1: Preparation & Backup

#### 1.1 Backup Current System
- Create backup branch of current messaging implementation
- Document current messaging routes and features
- Archive current implementation for reference

#### 1.2 Remove Current Implementation
- Remove `resources/js/Components/Messaging/*` components
- Remove `resources/js/Pages/Messages.jsx`
- Remove associated routes and controllers
- Clean up messaging-related database tables

### Phase 2: Chatify Installation & Configuration

#### 2.1 Package Installation
```bash
./vendor/bin/sail composer require munafio/chatify
./vendor/bin/sail artisan chatify:install
```

#### 2.2 Pusher Configuration (PUSHER IS DONE AND USED IN THE APP ALREADY)
```env
PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=your_app_cluster
```

#### 2.3 Database Setup
```bash
./vendor/bin/sail artisan migrate
```

#### 2.4 Asset Integration
- Publish Chatify assets
- Configure with Laravel Mix/Vite
- Ensure proper asset compilation

### Phase 3: Multi-Tenancy Integration

#### 3.1 Model Modifications
- Extend Chatify's ChMessage model:
  ```php
  class ChMessage extends \Chatify\Models\Message
  {
      protected $fillable = [
          'tenant_id',
          // ... existing fillable fields
      ];
      
      protected static function boot()
      {
          parent::boot();
          static::addGlobalScope(new TenantScope);
      }
  }
  ```

#### 3.2 Middleware Updates
- Add tenant middleware to Chatify routes
- Implement proper authentication checks
- Ensure tenant context preservation

#### 3.3 Storage Configuration
- Configure tenant-specific storage:
  ```php
  // config/chatify.php
  'storage_disk_name' => 'tenant_uploads',
  ```
- Implement tenant isolation for uploads

### Phase 4: UI Integration

#### 4.1 Inertia Integration
- Create new Messages page
- Integrate with AuthenticatedLayout
- Maintain consistent styling with Racker theme

#### 4.2 Navigation Updates
- Update navigation configuration
- Ensure proper routing setup
- Add necessary permissions

### Phase 5: Testing & Deployment

#### 5.1 Testing Requirements
- Multi-tenant message isolation
- File uploads and storageInternal Server Error

Illuminate\Contracts\Container\BindingResolutionException
Target class [MessagesController] does not exist.
GET localhost
PHP 8.4.7 — Laravel 12.19.3

Expand
vendor frames
39 vendor frames collapsed

public/index.php
:20
require_once
1 vendor frame collapsed
public/index.php :20
 
// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';
 
$app->handleRequest(Request::capture());
- Real-time messaging functionality
- User-to-user messaging
- Group conversations
- Cross-tenant security

#### 5.2 Security Checklist
- [ ] Verify tenant data isolation
- [ ] Review file upload security
- [ ] Check authentication/authorization
- [ ] Test real-time event isolation
- [ ] Verify storage isolation

## Technical Considerations

### Multi-Tenancy
- Add `tenant_id` to Chatify tables
- Scope all queries by tenant
- Isolate file storage by tenant
- Prevent cross-tenant access

### Authentication Integration
- Integrate with existing auth system
- Maintain tenant context
- Handle user sessions properly

### Real-time Communication
- Configure Pusher with tenant isolation
- Ensure events are tenant-scoped
- Prevent cross-tenant event leakage

### Storage Configuration
- Implement tenant-specific storage
- Secure file handling
- Proper cleanup procedures

## Potential Challenges

### 1. Multi-tenancy Integration
- Chatify isn't built for multi-tenancy by default
- Need to extend core models and controllers
- Ensure proper data isolation

### 2. UI Consistency
- Chatify has its own UI
- May need styling adjustments
- Ensure consistent user experience

### 3. Real-time Events
- Ensure proper tenant isolation in broadcasts
- Handle cross-tenant communication prevention
- Manage websocket connections properly

## Expected Benefits

### 1. Feature Rich
- Built-in file sharing
- Emoji support
- Read receipts
- User presence indicators

### 2. Maintained Package
- Regular updates
- Security patches
- Community support

### 3. Time Saving
- Pre-built functionality
- Tested codebase
- Documentation available

## Implementation Checklist

### Preparation
- [ ] Create backup branch
- [ ] Document current routes
- [ ] Remove current implementation
- [ ] Clean database tables

### Chatify Setup
- [ ] Install package
- [ ] Run migrations
- [ ] Configure Pusher
- [ ] Publish assets

### Multi-tenancy
- [ ] Extend ChMessage model
- [ ] Add tenant scoping
- [ ] Configure storage
- [ ] Update middleware

### UI Integration
- [ ] Create Inertia wrapper
- [ ] Style consistency
- [ ] Navigation updates

### Testing
- [ ] Multi-tenant isolation
- [ ] Real-time messaging
- [ ] File handling
- [ ] Security review

## Rollback Plan

In case of implementation issues:

1. **Quick Rollback**
   - Revert to backup branch
   - Restore database state
   - Re-enable old routes

2. **Gradual Rollback**
   - Keep both systems temporarily
   - Migrate users gradually
   - Remove Chatify when complete

## Support and Maintenance

### Documentation
- Update internal documentation
- Document custom modifications
- Create user guides

### Monitoring
- Set up error tracking
- Monitor real-time events
- Track storage usage

### Updates
- Plan regular updates
- Test updates in staging
- Maintain modification documentation

## Timeline

1. **Phase 1**: 1-2 days
2. **Phase 2**: 2-3 days
3. **Phase 3**: 3-4 days
4. **Phase 4**: 2-3 days
5. **Phase 5**: 2-3 days

Total estimated time: 10-15 days

## Conclusion

This implementation plan provides a structured approach to replacing the current messaging system with Laravel Chatify while ensuring proper multi-tenancy support and integration with the existing Racker system. The plan accounts for potential challenges and includes necessary testing and security measures.