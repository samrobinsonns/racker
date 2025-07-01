# Contact Management Implementation Plan

## Overview
This document outlines the implementation plan for the Contact Management feature and its integration with the existing ticket system. The feature will be tenant-isolated and follow our existing multi-tenant architecture.

## Implementation Status

### Completed Features ✅
1. Core Contact Management
   - Database tables and migrations
   - Basic CRUD operations
   - Custom fields system
   - Tenant isolation
   - Search functionality

2. Enhanced Features
   - Tagging system
   - Address management with types and primary address
   - Notes system with activity logging
   - Communication preferences

### In Progress 🚧
1. Import/Export System
   - CSV import/export functionality
   - Data mapping and validation
   - Background job processing

### Pending Features ⏳
1. Ticket Integration
   - Contact-ticket relationships
   - UI integration
   - Quick ticket creation

2. Advanced Features
   - Contact merging
   - API endpoints
   - Webhook system

## Database Schema

### Contact Management Tables

```sql
-- Contacts table
CREATE TABLE contacts (
    id bigint unsigned NOT NULL AUTO_INCREMENT,
    tenant_id uuid NOT NULL,
    first_name varchar(255) NOT NULL,
    last_name varchar(255) NOT NULL,
    email varchar(255),
    phone varchar(50),
    mobile varchar(50),
    job_title varchar(255),
    company varchar(255),
    department varchar(255),
    status enum('active', 'inactive', 'archived') DEFAULT 'active',
    type enum('customer', 'lead', 'vendor', 'partner') DEFAULT 'customer',
    source varchar(255),
    owner_id bigint unsigned,
    created_at timestamp NULL DEFAULT NULL,
    updated_at timestamp NULL DEFAULT NULL,
    deleted_at timestamp NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY contacts_tenant_id_index (tenant_id),
    KEY contacts_email_index (email),
    KEY contacts_owner_id_foreign (owner_id)
);

-- Contact custom fields
CREATE TABLE contact_custom_fields (
    id bigint unsigned NOT NULL AUTO_INCREMENT,
    tenant_id uuid NOT NULL,
    field_name varchar(255) NOT NULL,
    field_type enum('text', 'number', 'date', 'select', 'multiselect', 'checkbox') NOT NULL,
    field_options json,
    is_required boolean DEFAULT false,
    sort_order int,
    created_at timestamp NULL DEFAULT NULL,
    updated_at timestamp NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY custom_fields_tenant_id_index (tenant_id)
);

-- Contact custom field values
CREATE TABLE contact_custom_field_values (
    id bigint unsigned NOT NULL AUTO_INCREMENT,
    contact_id bigint unsigned NOT NULL,
    field_id bigint unsigned NOT NULL,
    field_value text,
    created_at timestamp NULL DEFAULT NULL,
    updated_at timestamp NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY custom_field_values_contact_id_index (contact_id),
    KEY custom_field_values_field_id_index (field_id)
);

-- Contact addresses
CREATE TABLE contact_addresses (
    id bigint unsigned NOT NULL AUTO_INCREMENT,
    contact_id bigint unsigned NOT NULL,
    type enum('billing', 'shipping', 'other') DEFAULT 'billing',
    street_1 varchar(255),
    street_2 varchar(255),
    city varchar(255),
    state varchar(255),
    postal_code varchar(20),
    country varchar(255),
    is_primary boolean DEFAULT false,
    created_at timestamp NULL DEFAULT NULL,
    updated_at timestamp NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY addresses_contact_id_index (contact_id)
);

-- Contact notes
CREATE TABLE contact_notes (
    id bigint unsigned NOT NULL AUTO_INCREMENT,
    contact_id bigint unsigned NOT NULL,
    user_id bigint unsigned NOT NULL,
    note text NOT NULL,
    created_at timestamp NULL DEFAULT NULL,
    updated_at timestamp NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY notes_contact_id_index (contact_id),
    KEY notes_user_id_index (user_id)
);

-- Contact tags
CREATE TABLE contact_tags (
    id bigint unsigned NOT NULL AUTO_INCREMENT,
    tenant_id uuid NOT NULL,
    name varchar(255) NOT NULL,
    created_at timestamp NULL DEFAULT NULL,
    updated_at timestamp NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY tags_tenant_id_index (tenant_id)
);

-- Contact tag relationships
CREATE TABLE contact_tag_relationships (
    contact_id bigint unsigned NOT NULL,
    tag_id bigint unsigned NOT NULL,
    PRIMARY KEY (contact_id, tag_id)
);
```

### Ticket System Integration Tables

```sql
-- Add contact_id to existing tickets table
ALTER TABLE support_tickets
ADD COLUMN contact_id bigint unsigned NULL,
ADD KEY tickets_contact_id_foreign (contact_id);

-- Contact communication preferences
CREATE TABLE contact_communication_preferences (
    id bigint unsigned NOT NULL AUTO_INCREMENT,
    contact_id bigint unsigned NOT NULL,
    email_notifications boolean DEFAULT true,
    sms_notifications boolean DEFAULT false,
    marketing_emails boolean DEFAULT true,
    created_at timestamp NULL DEFAULT NULL,
    updated_at timestamp NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY comm_prefs_contact_id_index (contact_id)
);
```

## Models

### Contact Model
```php
class Contact extends Model
{
    use HasTenant, SoftDeletes;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'mobile',
        'job_title',
        'company',
        'department',
        'status',
        'type',
        'source',
        'owner_id'
    ];

    // Relationships
    public function customFields()
    public function addresses()
    public function notes()
    public function tags()
    public function tickets()
    public function communicationPreferences()
    public function owner()
}
```

### Supporting Models
```php
class ContactCustomField extends Model
class ContactCustomFieldValue extends Model
class ContactAddress extends Model
class ContactNote extends Model
class ContactTag extends Model
class ContactCommunicationPreference extends Model
```

## Controllers

### Contact Management Controllers

```php
// Main contact controller
class ContactController extends Controller
{
    public function index()
    public function create()
    public function store(StoreContactRequest $request)
    public function show(Contact $contact)
    public function edit(Contact $contact)
    public function update(UpdateContactRequest $request, Contact $contact)
    public function destroy(Contact $contact)
    public function import()
    public function export()
}

// Custom fields controller
class ContactCustomFieldController extends Controller
{
    public function index()
    public function store(StoreCustomFieldRequest $request)
    public function update(UpdateCustomFieldRequest $request, ContactCustomField $field)
    public function destroy(ContactCustomField $field)
}

// Tags controller
class ContactTagController extends Controller
{
    public function index()
    public function store(StoreTagRequest $request)
    public function update(UpdateTagRequest $request, ContactTag $tag)
    public function destroy(ContactTag $tag)
}
```

## Frontend Components

### React Components Structure
```
contacts/
├── Index.jsx                 # Main contacts list
├── Show.jsx                  # Contact details view
├── Form/
│   ├── CreateForm.jsx       # Create contact form
│   ├── EditForm.jsx         # Edit contact form
│   ├── CustomFieldForm.jsx  # Custom field form
│   └── AddressForm.jsx      # Address form
├── List/
│   ├── ContactList.jsx      # Contacts table/grid
│   ├── ContactFilters.jsx   # Filter components
│   └── ContactSearch.jsx    # Search component
├── Details/
│   ├── ContactInfo.jsx      # Basic info display
│   ├── CustomFields.jsx     # Custom fields display
│   ├── AddressList.jsx      # Addresses display
│   ├── NotesList.jsx        # Notes display
│   └── TagList.jsx          # Tags display
└── Tickets/
    ├── TicketList.jsx       # Related tickets
    └── CreateTicket.jsx     # Create ticket form
```

## Integration Points

### Ticket System Integration

1. **Contact-Ticket Relationship**
   ```php
   // In Contact model
   public function tickets()
   {
       return $this->hasMany(SupportTicket::class);
   }

   // In SupportTicket model
   public function contact()
   {
       return $this->belongsTo(Contact::class);
   }
   ```

2. **Ticket Creation Flow**
   - Add contact selector to ticket creation form
   - Auto-fill contact details when selected
   - Link ticket to contact on creation

3. **Contact View Integration**
   - Display related tickets in contact details
   - Quick ticket creation from contact view
   - Ticket history and statistics

## Implementation Phases

### Phase 1: Core Contact Management (✅ Completed)
1. **Database Setup**
   - ✅ Create all necessary tables
   - ✅ Set up indexes and foreign keys
   - ✅ Add tenant isolation

2. **Basic CRUD**
   - ✅ Contact creation
   - ✅ Contact editing
   - ✅ Contact listing
   - ✅ Contact deletion
   - ✅ Basic search

3. **Custom Fields**
   - ✅ Custom field definition
   - ✅ Field value storage
   - ✅ Field type validation

### Phase 2: Enhanced Features (✅ Completed)
1. **Contact Organization**
   - ✅ Tagging system
   - ✅ Categories
   - ✅ Status management
   - ✅ Owner assignment

2. **Address Management**
   - ✅ Multiple addresses
   - ✅ Address types
   - ✅ Primary address

3. **Notes & Activities**
   - ✅ Note creation
   - ✅ Activity logging
   - ✅ Timeline view

### Phase 3: Ticket Integration (⏳ Pending)
1. **Database Updates**
   - ✅ Add contact relationships
   - ✅ Migration for existing tickets

2. **UI Integration**
   - ✅ Contact selector in ticket form 
   - ✅ Ticket list in contact view
   - ✅ Quick ticket creation

3. **Business Logic**
   - Reply to Customer
   - Contact-ticket linking
   - Notification preferences
   - Communication history

### Phase 4: Advanced Features (🚧 In Progress)
1. **Import/Export** (🚧 In Progress)
   - 🚧 CSV import
   - 🚧 CSV export
   - 🚧 Data mapping

2. **Communication Preferences** (✅ Completed)
   - ✅ Email preferences
   - ✅ Notification settings
   - ✅ Marketing opt-in/out

3. **API Integration** (⏳ Pending)
   - RESTful API endpoints
   - GraphQL support
   - Webhook system

## Testing Strategy

### Unit Tests
```php
class ContactTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_creates_a_contact()
    /** @test */
    public function it_requires_tenant_id()
    /** @test */
    public function it_handles_custom_fields()
    /** @test */
    public function it_manages_tags()
}
```

### Feature Tests
```php
class ContactManagementTest extends TestCase
{
    /** @test */
    public function authorized_user_can_create_contact()
    /** @test */
    public function contact_links_to_tickets()
    /** @test */
    public function it_handles_duplicate_contacts()
}
```

## Security Considerations

1. **Tenant Isolation**
   - Enforce tenant boundaries
   - Validate all queries
   - Prevent cross-tenant access

2. **Permission System**
   ```php
   // Contact permissions
   const PERMISSIONS = [
       'view_contacts',
       'create_contacts',
       'edit_contacts',
       'delete_contacts',
       'manage_contact_fields',
       'import_contacts',
       'export_contacts'
   ];
   ```

3. **Data Protection**
   - GDPR compliance
   - Data encryption
   - Audit logging

## Performance Optimization

1. **Database Optimization**
   - Proper indexing
   - Query optimization
   - Eager loading

2. **Caching Strategy**
   ```php
   // Contact caching
   Cache::tags(['contacts', "tenant-{$tenantId}"])->remember(
       "contact-{$contactId}",
       now()->addHours(24),
       fn() => Contact::with(['customFields', 'tags'])->find($contactId)
   );
   ```

3. **Batch Processing**
   - Bulk imports
   - Queue processing
   - Background jobs

## Deployment Plan

1. **Database Migrations**
   ```bash
   php artisan make:migration create_contacts_tables
   php artisan make:migration add_contact_id_to_tickets
   ```

2. **Seeding**
   ```bash
   php artisan make:seeder ContactsTableSeeder
   php artisan make:seeder ContactCustomFieldsSeeder
   ```

3. **Rollout Strategy**
   - Feature flag implementation
   - Gradual tenant rollout
   - Monitoring plan

## Documentation

1. **API Documentation**
   - Endpoint specifications
   - Request/response examples
   - Authentication details

2. **User Documentation**
   - Feature guides
   - Best practices
   - Tutorial videos

3. **Developer Documentation**
   - Code examples
   - Integration guides
   - Customization docs

## Monitoring & Maintenance

1. **Error Tracking**
   - Exception monitoring
   - Error logging
   - Alert system

2. **Performance Monitoring**
   - Query performance
   - API response times
   - Resource usage

3. **Usage Analytics**
   - Feature adoption
   - User engagement
   - System health

## Success Metrics

1. **User Adoption**
   - Contact creation rate
   - Feature usage statistics
   - User engagement

2. **System Performance**
   - Response times
   - Error rates
   - Resource utilization

3. **Business Impact**
   - Ticket resolution time
   - Customer satisfaction
   - Support efficiency 