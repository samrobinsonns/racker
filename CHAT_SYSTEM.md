# Chat System Documentation

## Overview
The chat system is a real-time messaging feature built using Laravel's broadcasting system with Soketi as the WebSocket server. It supports tenant-isolated conversations, real-time message updates, typing indicators, conversation management, and conversation deletion.

## Architecture

### Backend Components

#### Models
- `Conversation`: Manages chat conversations
  - Has many `Message` models
  - Has many `ConversationParticipant` models
  - Belongs to a `Tenant`
  - Supports soft deletes for data retention
  - Includes helper methods for participant management

- `Message`: Represents individual chat messages
  - Belongs to a `Conversation`
  - Belongs to a `User` (sender)
  - Supports metadata for special message types

- `ConversationParticipant`: Links users to conversations
  - Belongs to a `Conversation`
  - Belongs to a `User`
  - Tracks last read time and role

#### Events
- `MessageSent`: Broadcast when a new message is sent
  - Uses private channels
  - Channel format: `tenant.{tenantId}.conversation.{conversationId}`
  - Broadcasts with event name: `.message.sent`

- `UserTyping`: Broadcast when a user is typing
  - Uses private channels
  - Channel format: `tenant.{tenantId}.conversation.{conversationId}`
  - Broadcasts with event name: `typing`
  - Payload includes user info and typing status

- `ConversationUpdated`: Broadcast when conversation details change
  - Uses private channels
  - Channel format: `tenant.{tenantId}.notifications`
  - Broadcasts with event name: `.conversation.updated`
  - Includes unread counts and last message details

#### Controllers
- `MessageController`: Handles message CRUD operations
- `ConversationController`: Manages conversations and deletion
- `TypingController`: Handles typing indicators
  - Supports both typing start and stop events
  - Validates participant access
  - Includes error handling and logging

### Frontend Components

#### React Components
- `ChatInterface`: Main chat component
  - Manages WebSocket connections
  - Handles conversation selection
  - Coordinates message sending/receiving
  - Manages typing indicator state

- `MessageArea`: Displays messages and input
  - Renders message bubbles
  - Handles message input
  - Shows typing indicators
  - Debounces typing events

- `ConversationList`: Shows available conversations
  - Lists all conversations
  - Shows unread message counts
  - Displays last message preview
  - Provides conversation deletion
  - Updates in real-time with new messages

#### Conversation Management
The system includes full conversation lifecycle management:
- Creation: Users can start new conversations
- Updates: Real-time updates for messages and status
- Deletion: Users can delete conversations they participate in
- Cleanup: Automatically removes associated messages and participants
- Typing: Real-time typing indicators with debouncing

#### WebSocket Integration
The frontend uses Laravel Echo with Pusher client to handle WebSocket connections:

```javascript
// bootstrap.js configuration
window.Echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_SOKETI_APP_KEY,
    wsHost: import.meta.env.VITE_SOKETI_HOST,
    wsPort: import.meta.env.VITE_SOKETI_PORT,
    wssPort: import.meta.env.VITE_SOKETI_PORT,
    forceTLS: false,
    encrypted: false,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
    cluster: import.meta.env.VITE_SOKETI_APP_CLUSTER,
    authEndpoint: '/broadcasting/auth',
    auth: {
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    }
});
```

## Environment Configuration

### Required Environment Variables
```env
BROADCAST_DRIVER=soketi

SOKETI_APP_ID=app-id
SOKETI_APP_KEY=app-key
SOKETI_APP_SECRET=app-secret
SOKETI_DEBUG=1
SOKETI_HOST=soketi
SOKETI_PORT=6001
SOKETI_SCHEME=http
SOKETI_APP_CLUSTER=mt1

# Frontend Configuration (Vite)
VITE_SOKETI_APP_KEY=app-key
VITE_SOKETI_HOST=localhost
VITE_SOKETI_PORT=6001
VITE_SOKETI_SCHEME=http
VITE_SOKETI_APP_CLUSTER=mt1
```

## Common Issues and Troubleshooting

### Message Updates Not Appearing
1. Check browser console for WebSocket connection errors
2. Verify channel authorization is working:
   - Check Laravel logs for auth failures
   - Ensure CSRF token is being sent
   - Verify user has access to the conversation

### WebSocket Connection Issues
1. Verify Soketi server is running:
   ```bash
   docker ps | grep soketi
   ```
2. Check WebSocket connection in browser Network tab
3. Verify environment variables match between frontend and backend

### Typing Indicator Issues
1. Check request payload contains `is_typing` boolean
2. Verify user is a conversation participant
3. Check Laravel logs for validation errors
4. Ensure proper channel subscription

### Message Order Issues
1. Backend returns messages in ascending order (oldest first)
2. Frontend should maintain this order when displaying
3. New messages should be appended to the end of the list

## Security Considerations

### Channel Authorization
- All chat channels are private channels
- Channel authorization happens through Laravel's built-in broadcasting auth
- Users can only access conversations they're participants in
- Tenant isolation is enforced at the channel level
- Deletion is restricted to conversation participants

### Data Privacy
- Messages are tenant-isolated
- Users can only see conversations they're part of
- Users can only delete conversations they participate in
- All WebSocket connections are authenticated
- Soft deletes preserve data for audit purposes

## Future Improvements
1. Message read receipts
2. File attachments
3. Message reactions
4. Message threading
5. Message search
6. Message deletion
7. Online presence indicators
8. Group chat management
9. Message pagination
10. Message editing

## API Endpoints

### Conversations
- `GET /api/messaging/conversations`: List user's conversations
- `POST /api/messaging/conversations`: Create new conversation
- `GET /api/messaging/conversations/{id}`: Get conversation details
- `DELETE /api/messaging/conversations/{id}`: Delete conversation and associated data

### Messages
- `GET /api/messaging/conversations/{id}/messages`: Get conversation messages
- `POST /api/messaging/conversations/{id}/messages`: Send new message
- `PUT /api/messaging/conversations/{id}/messages/{messageId}`: Edit message
- `DELETE /api/messaging/conversations/{id}/messages/{messageId}`: Delete message

### Typing Indicators
- `POST /api/messaging/conversations/{id}/typing`: Update typing status
  - Requires `is_typing` boolean in request body
  - Returns 403 if user is not a participant
  - Returns 404 if conversation not found
  - Returns 400 if tenant context is missing 