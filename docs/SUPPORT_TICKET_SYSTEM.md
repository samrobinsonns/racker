# Support Ticket System Documentation

## Overview

The Support Ticket System is a comprehensive, enterprise-ready ticketing solution integrated into the Laravel multi-tenant application "racker". It provides complete ticket lifecycle management with Microsoft 365 email integration, file attachments, activity logging, and role-based permissions.

## Implementation Progress

### ✅ Phase 1: Foundation (Completed)
- Database schema design
- Models with relationships
- Permission system extension
- Configuration structure
- Security measures

### ✅ Phase 2: Services Layer (Completed)
- TicketService for core business logic
- ReplyService for communication management
- AttachmentService for file handling
- Microsoft365EmailService for email integration
- NotificationService for alerts

### ✅ Phase 3: Database Setup (Completed)
All necessary tables created and migrated with full multi-tenant support:

#### Core Tables with Schema
- **support_ticket_priorities**
  - System-wide and tenant-specific priorities
  - Fields: id, tenant_id (nullable), name, slug, description, level, color, response_time_hours, resolution_time_hours, is_active, is_system, sort_order
  - Default priorities: Critical, High, Medium, Low
  - Indexes: [tenant_id, is_active], [level], [tenant_id, slug]

- **support_ticket_statuses**
  - System-wide and tenant-specific statuses
  - Fields: id, tenant_id (nullable), name, slug, description, color, type, is_active, is_system, is_closed, is_resolved, sort_order, next_statuses
  - Default statuses: New, Open, In Progress, Waiting, Resolved, Closed
  - Indexes: [tenant_id, is_active], [type], [tenant_id, slug]

- **support_ticket_categories**
  - Tenant-specific categorization
  - Fields: id, tenant_id, name, description, color, is_active, sort_order
  - Indexes: [tenant_id, name] (unique)

- **support_tickets**
  - Core ticket records
  - Fields: id, tenant_id, ticket_number, subject, description, category_id, status_id, priority_id, created_by, assigned_to, due_date, closed_at, closed_by, source, metadata
  - Indexes: [tenant_id, ticket_number], [tenant_id, status_id], [tenant_id, created_by], [tenant_id, assigned_to]

- **support_ticket_replies**
  - Communication thread
  - Fields: id, tenant_id, ticket_id, content, created_by, source, is_internal, metadata
  - Indexes: [tenant_id, ticket_id], [tenant_id, created_by]

- **support_ticket_attachments**
  - File management
  - Fields: id, tenant_id, ticket_id, reply_id, filename, original_filename, mime_type, file_size, storage_path, storage_disk, uploaded_by
  - Indexes: [tenant_id, ticket_id], [tenant_id, reply_id]

- **microsoft365_email_connections**
  - Email integration configuration
  - Fields: id, tenant_id, email_address, display_name, access_token, refresh_token, token_expires_at, is_active, settings
  - Indexes: [tenant_id, email_address], [tenant_id, is_active]

- **support_ticket_activity_logs**
  - Complete audit trail
  - Fields: id, tenant_id, ticket_id, user_id, event_type, description, old_values, new_values, ip_address, user_agent

#### Multi-Tenant Design
- All tables include `tenant_id` with foreign key to tenants table
- System-wide configurations (priorities, statuses) allow nullable tenant_id
- Proper indexing for tenant-specific queries
- Cascading deletes for tenant data cleanup

#### Security Features
- Foreign key constraints for data integrity
- Indexed fields for performance
- Proper null handling for optional relationships
- Metadata JSON fields for extensibility

### ✅ Phase 4: API Endpoints & Controllers (Completed)
- Ticket management endpoints
- Reply and communication endpoints
- File attachment handling
- Microsoft 365 integration endpoints
- Configuration endpoints

### ✅ Phase 5: Frontend Implementation (Completed)
Components created and integrated:
- **Dashboard** - Main entry point with integrated components
- **TicketList** - Advanced table with sorting and actions
- **TicketFilters** - Comprehensive filtering and search
- **TicketStats** - Real-time statistics dashboard
- **CreateTicketModal** - Rich ticket creation form
Features implemented:
- Real-time search with debouncing
- Status and priority color coding
- File attachment handling
- Permission-based actions
- Loading states and error handling

### ✅ Phase 6: Microsoft 365 Integration (Completed)
- Email webhook setup
- Email parsing and ticket creation
- Reply synchronization
- Attachment handling
- OAuth configuration
- Email templates

### ✅ Phase 7: Navigation & Routing (Completed)
- Added navigation items for all user roles
- Central Admin navigation items:
  - Support Tickets (Overview)
  - Analytics & Reports
- Tenant Admin navigation items:
  - All Tickets
  - Create Ticket
  - Categories
  - Settings
  - Analytics
- Regular User navigation items:
  - My Tickets
  - Create Ticket
- Implemented proper routing and permissions

### 📅 Phase 8: Testing & Quality Assurance (Planned)
- Unit tests for services
- Integration tests for API endpoints
- Frontend component testing
- End-to-end testing
- Performance optimization
- Security auditing

### 📅 Phase 9: Documentation & Deployment (Planned)
- API documentation
- User guides
- Deployment guides
- Monitoring setup
- Backup strategies
- Maintenance procedures

## Key Features

### ✅ Core Functionality
- **Complete Ticket Lifecycle Management** - Create, assign, update, resolve, and close tickets
- **Multi-Tenant Architecture** - Full isolation between tenants with shared application logic
- **Role-Based Permissions** - Granular access control with tenant and central admin scoping
- **Microsoft 365 Email Integration** - OAuth authentication, auto-ticket creation, email replies
- **File Attachment System** - Secure uploads with virus scanning and type validation
- **Activity Logging** - Complete audit trail with customer visibility controls
- **Real-Time Notifications** - Email alerts for all stakeholders
- **Advanced Search & Filtering** - Full-text search with comprehensive filter options
- **SLA Tracking** - Response time monitoring and breach detection
- **Escalation Workflows** - Automatic and manual escalation processes
- **Status Workflow Management** - Configurable status transitions and validations

### ✅ Security Features
- **File Upload Security** - MIME type validation, file signature checking, size limits
- **Multi-Factor Validation** - Multiple layers of file security checks
- **Encrypted Token Storage** - OAuth tokens encrypted at rest
- **Permission-Based Access** - Every operation checked against user permissions
- **Activity Monitoring** - IP address and user agent tracking
- **Cross-Tenant Protection** - Prevents data leakage between tenants

### ✅ Email Integration
- **Microsoft 365 OAuth** - Secure authentication with Microsoft Graph API
- **Auto-Ticket Creation** - Convert emails to tickets automatically
- **Email Reply Processing** - Handle replies to existing tickets
- **Attachment Processing** - Extract and store email attachments securely
- **Anti-Spam Protection** - Auto-reply and out-of-office detection
- **Email Notifications** - Send updates to all stakeholders

## Architecture

### Database Schema

#### Core Tables
```sql
support_ticket_priorities          # Priority levels (High, Medium, Low) with SLA times
support_ticket_statuses           # Workflow statuses (New, In Progress, Resolved, etc.)
support_ticket_categories         # Hierarchical categorization system
microsoft365_email_connections    # OAuth connections per tenant
support_tickets                   # Main tickets with full metadata
support_ticket_replies           # Public replies and internal notes
support_ticket_attachments       # File attachments with security metadata
support_ticket_activity_logs     # Complete audit trail
```

#### Key Relationships
- **Tickets** belong to priorities, statuses, categories, requesters, and assignees
- **Replies** belong to tickets and users, can have attachments
- **Attachments** belong to tickets and optionally to replies
- **Activity Logs** track all changes with user attribution
- **Email Connections** provide OAuth integration per tenant

### Services Architecture

#### Service Layer (app/Services/SupportTickets/)

**TicketService** - Core business logic
```php
- createTicket()     # Create new tickets with defaults
- updateTicket()     # Update with change logging
- assignTicket()     # Assign with validation
- changeStatus()     # Status transitions with workflow validation
- escalateTicket()   # Manual and automatic escalation
- getTickets()       # Advanced filtering and pagination
- searchTickets()    # Full-text search capabilities
- getTicketStats()   # Statistics and reporting
```

**ReplyService** - Communication management
```php
- createReply()           # Public replies with notifications
- createInternalNote()    # Internal agent notes
- createSystemMessage()   # Automated system messages
- createEmailReply()      # Process inbound emails
- getTicketReplies()      # Get replies with permission filtering
- updateReply()           # Edit existing replies
- deleteReply()           # Remove replies with logging
```

**AttachmentService** - File management
```php
- uploadAttachment()      # Secure file upload with validation
- createEmailAttachment() # Process email attachments
- downloadAttachment()    # Secure download with permission checks
- deleteAttachment()      # Remove files with cleanup
- validateFile()          # Security validation (private)
- performSecurityChecks() # MIME type and signature validation (private)
```

**Microsoft365EmailService** - Email integration
```php
- getAuthorizationUrl()   # OAuth setup
- handleCallback()        # OAuth token exchange
- refreshToken()          # Token refresh
- processIncomingEmails() # Parse and process emails
- sendReply()             # Send email replies
- testConnection()        # Validate email setup
```

**NotificationService** - Communication alerts
```php
- notifyTicketCreated()    # New ticket notifications
- notifyTicketAssigned()   # Assignment notifications
- notifyStatusChanged()    # Status change alerts
- notifyReplyAdded()       # Reply notifications
- notifyTicketEscalated()  # Escalation alerts
- notifyTicketOverdue()    # SLA breach warnings
- sendDailyDigest()        # Daily summary emails
```

### Models Architecture

#### Core Models with Key Methods

**SupportTicket** - Main ticket entity
```php
# Relationships
- requester()      # User who created the ticket
- assignee()       # Assigned agent
- priority()       # Priority level
- status()         # Current status
- category()       # Ticket category
- replies()        # All replies and notes
- attachments()    # File attachments
- activityLogs()   # Audit trail

# Scopes
- forTenant()      # Tenant isolation
- assignedTo()     # Filter by assignee
- open()           # Open tickets only
- overdue()        # SLA breaches
- escalated()      # Escalated tickets

# Methods
- generateTicketNumber()  # Auto-generate unique numbers
- assignTo()             # Assign with logging
- updateStatus()         # Change status with validation
- escalate()             # Escalate ticket
- isOverdue()            # Check SLA breach
- getTimeToResolution()  # Calculate resolution time
```

**SupportTicketReply** - Communications
```php
# Scopes
- public()         # Customer-visible replies
- internal()       # Agent-only notes
- byType()         # Filter by reply type

# Methods
- isFromAgent()    # Check if agent reply
- isFromCustomer() # Check if customer reply
- isFromEmail()    # Check if email-originated
```

**SupportTicketAttachment** - File management
```php
# Static Methods
- isAllowedFileType()    # Validate MIME types
- isAllowedFileSize()    # Check size limits

# Instance Methods
- fileExists()           # Check file existence
- getDownloadUrl()       # Generate secure download URLs
```

## Configuration

### config/support-tickets.php
```php
return [
    // Microsoft 365 Integration
    'microsoft365' => [
        'client_id' => env('MICROSOFT365_CLIENT_ID'),
        'client_secret' => env('MICROSOFT365_CLIENT_SECRET'),
        'redirect_uri' => env('MICROSOFT365_REDIRECT_URI'),
    ],

    // File Upload Settings
    'max_attachment_size' => 10 * 1024 * 1024, // 10MB
    'allowed_file_types' => [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'text/csv',
    ],

    // Ticket Settings
    'ticket_number_format' => 'TKT-{year}-{number}',
    'default_priority_level' => 3,
    'auto_close_resolved_after_days' => 7,

    // SLA Settings
    'sla_enabled' => true,
    'business_hours' => [
        'start' => '09:00',
        'end' => '17:00',
        'timezone' => 'UTC',
        'working_days' => [1, 2, 3, 4, 5], // Monday to Friday
    ],

    // Email Processing
    'email_processing' => [
        'enabled' => true,
        'ignore_auto_replies' => true,
        'ignore_out_of_office' => true,
        'minimum_body_length' => 10,
    ],

    // Notification Settings
    'notifications' => [
        'send_ticket_created' => true,
        'send_ticket_assigned' => true,
        'send_status_changed' => true,
        'send_reply_notifications' => true,
        'send_escalation_alerts' => true,
        'send_overdue_alerts' => true,
        'daily_digest_enabled' => true,
    ],
];
```

### Required Environment Variables
```env
# Microsoft 365 Integration
MICROSOFT365_CLIENT_ID=your_client_id
MICROSOFT365_CLIENT_SECRET=your_client_secret
MICROSOFT365_REDIRECT_URI=https://yourdomain.com/support-tickets/microsoft365/callback

# Mail Configuration (for notifications)
MAIL_MAILER=smtp
MAIL_HOST=your_smtp_host
MAIL_PORT=587
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=support@yourdomain.com
MAIL_FROM_NAME="Support Team"
```

## Permissions System

### Support Ticket Permissions
```php
enum Permission: string
{
    case VIEW_SUPPORT_TICKETS = 'view_support_tickets';
    case CREATE_SUPPORT_TICKETS = 'create_support_tickets';
    case MANAGE_SUPPORT_TICKETS = 'manage_support_tickets';
    case ASSIGN_SUPPORT_TICKETS = 'assign_support_tickets';
    case ESCALATE_SUPPORT_TICKETS = 'escalate_support_tickets';
    case CONFIGURE_SUPPORT_TICKETS = 'configure_support_tickets';
    case VIEW_SUPPORT_ANALYTICS = 'view_support_analytics';
}
```

### Permission Hierarchy
- **VIEW_SUPPORT_TICKETS** - Basic ticket viewing
- **CREATE_SUPPORT_TICKETS** - Create new tickets
- **MANAGE_SUPPORT_TICKETS** - Full ticket management (includes all above)
- **ASSIGN_SUPPORT_TICKETS** - Assign tickets to users
- **ESCALATE_SUPPORT_TICKETS** - Escalate tickets
- **CONFIGURE_SUPPORT_TICKETS** - Configure categories, priorities, statuses
- **VIEW_SUPPORT_ANALYTICS** - Access reporting and analytics

## Usage Examples

### Creating a Ticket
```php
use App\Services\SupportTickets\TicketService;

$ticketService = app(TicketService::class);

$ticket = $ticketService->createTicket([
    'subject' => 'Login Issues',
    'description' => 'Cannot log into the system',
    'priority_id' => 1, // High priority
    'category_id' => 2, // Technical Support
    'requester_email' => 'user@example.com',
    'requester_name' => 'John Doe',
], $tenantId, $userId);
```

### Adding a Reply
```php
use App\Services\SupportTickets\ReplyService;

$replyService = app(ReplyService::class);

$reply = $replyService->createReply($ticket, [
    'content' => 'We are investigating your login issue.',
    'is_internal' => false, // Public reply
], $agentUserId);
```

### Uploading Attachments
```php
use App\Services\SupportTickets\AttachmentService;

$attachmentService = app(AttachmentService::class);

foreach ($request->file('attachments') as $file) {
    $attachment = $attachmentService->uploadAttachment(
        $ticket,
        $file,
        $userId,
        $replyId, // Optional: attach to specific reply
        true      // Public attachment
    );
}
```

### Setting Up Microsoft 365 Integration
```php
use App\Services\SupportTickets\Microsoft365EmailService;

$emailService = app(Microsoft365EmailService::class);

// Get authorization URL
$authUrl = $emailService->getAuthorizationUrl($tenantId);

// After OAuth callback
$connection = $emailService->handleCallback($code, $state);

// Process incoming emails
$results = $emailService->processIncomingEmails($connection);
```

## API Endpoints (Planned)

### Ticket Management
```
GET    /api/support-tickets              # List tickets with filtering
POST   /api/support-tickets              # Create new ticket
GET    /api/support-tickets/{id}         # Get specific ticket
PUT    /api/support-tickets/{id}         # Update ticket
DELETE /api/support-tickets/{id}         # Delete ticket
POST   /api/support-tickets/{id}/assign  # Assign ticket
POST   /api/support-tickets/{id}/status  # Change status
POST   /api/support-tickets/{id}/escalate # Escalate ticket
```

### Replies and Communication
```
GET    /api/support-tickets/{id}/replies    # Get ticket replies
POST   /api/support-tickets/{id}/replies    # Add reply
PUT    /api/support-tickets/replies/{id}    # Update reply
DELETE /api/support-tickets/replies/{id}    # Delete reply
```

### Attachments
```
POST   /api/support-tickets/{id}/attachments     # Upload attachment
GET    /api/support-tickets/attachments/{id}     # Download attachment
DELETE /api/support-tickets/attachments/{id}     # Delete attachment
```

### Configuration
```
GET    /api/support-tickets/priorities     # Get priorities
GET    /api/support-tickets/statuses       # Get statuses
GET    /api/support-tickets/categories     # Get categories
GET    /api/support-tickets/stats          # Get statistics
```

## Frontend Components (Phase 3 - Next)

### Planned React Components
- **TicketList** - Advanced filtering and pagination
- **TicketCard** - Individual ticket display
- **TicketDetails** - Full ticket view with timeline
- **ReplyArea** - Communication interface
- **AttachmentUpload** - Drag-and-drop file upload
- **StatusWorkflow** - Visual status progression
- **TicketFilters** - Advanced search and filter UI
- **TicketStats** - Dashboard statistics
- **NotificationCenter** - Real-time alerts

## Testing Strategy

### Unit Tests
- Service layer methods
- Model relationships and scopes
- File upload validation
- Permission checking

### Feature Tests
- Complete ticket workflows
- Email integration
- File attachment handling
- Multi-tenant isolation
- API endpoints

### Integration Tests
- Microsoft 365 OAuth flow
- Email processing pipeline
- Notification delivery
- SLA tracking

## Deployment Considerations

### Prerequisites
- Laravel 10+
- PHP 8.1+
- MySQL 8.0+
- Redis (for queues)
- Storage for file attachments

### Queue Configuration
```php
# Recommended queue jobs for:
- Email processing
- File virus scanning
- Notification sending
- Daily digest generation
- SLA monitoring
```

### Monitoring
- Failed job monitoring
- Email delivery tracking
- File storage usage
- Response time metrics
- SLA breach alerts

## Next Development Phases

### Phase 3: Frontend Components ✅ (Starting Now)
- React components for ticket management
- Advanced filtering and search UI
- File upload interface
- Real-time notifications

### Phase 4: API Routes & Controllers
- RESTful API endpoints
- API authentication
- Rate limiting
- API documentation

### Phase 5: Authorization Policies
- Laravel Policy classes
- Permission-based route protection
- Resource-level authorization

### Phase 6: Background Jobs
- Email processing queues
- File virus scanning
- Notification delivery
- SLA monitoring jobs

### Phase 7: Commands & Automation
- Daily digest commands
- Cleanup old tickets
- SLA breach detection
- Email sync commands

### Phase 8: Analytics & Reporting
- Ticket metrics dashboard
- Agent performance reports
- SLA compliance reports
- Customer satisfaction tracking

## Support and Maintenance

### Regular Tasks
- Monitor email connections
- Review SLA performance
- Clean up old files
- Update security rules

### Troubleshooting
- Check email connection health
- Verify file permissions
- Monitor queue processing
- Review activity logs

---

**Last Updated:** Phase 2 Complete - Services Layer Implementation
**Next Phase:** Frontend React Components and UI 