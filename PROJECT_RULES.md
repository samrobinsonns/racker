# Racker Project Rules and Documentation

## System Overview
This is a **Laravel Breeze React application** called "racker" using **Laravel Sail** for development environment management with a **complete multi-tenancy system**.

**Development Environment**: This project uses Laravel Sail for development. All artisan commands should be run using `./vendor/bin/sail artisan` instead of `php artisan`.

## Project Setup
- **Project Name**: racker
- **Framework**: Laravel (latest version)
- **Authentication**: Laravel Breeze
- **Frontend**: React with Inertia.js
- **Development Environment**: Laravel Sail (Docker-based)
- **Database**: MySQL (via Sail)
- **Build Tool**: Vite
- **Multi-Tenancy**: Single database with tenant_id using stancl/tenancy package

## Multi-Tenancy Architecture

### Overview
The system implements **single-database multi-tenancy** where all tenants share the same database but data is isolated using `tenant_id` columns. This approach provides:
- Cost-effective scaling
- Simplified backup and maintenance
- Shared application logic
- Secure data isolation

### User Types & Access Levels

1. **Central Admin**
   - Full system access across all tenants
   - Can create, manage, and delete tenants
   - Can manage all users in the system
   - Access to system-wide settings and analytics
   - Routes: `/central-admin/*`

2. **Tenant Admin**
   - Full access within their specific tenant
   - Can manage users within their tenant
   - Can configure tenant-specific settings
   - Cannot access other tenants' data
   - Routes: `/tenant-admin/*`

3. **Tenant Users**
   - Access to tenant-specific features
   - Can view and interact with tenant data
   - Role-based permissions within tenant

### Database Structure

#### Core Tables
- **tenants**: Stores tenant organizations (UUID-based)
- **domains**: Maps domains/subdomains to tenants
- **users**: All users with `tenant_id` and `is_central_admin` fields
- **roles**: Scoped roles (central vs tenant-specific)
- **user_roles**: User-role assignments with tenant scoping

#### Key Fields
- `tenant_id` (nullable): Links records to specific tenants
- `is_central_admin` (boolean): Identifies central administrators
- `type` (enum): Distinguishes central vs tenant roles

### Frontend Architecture

#### Layouts
- **CentralAdminLayout**: Indigo theme for central admin interface
- **TenantAdminLayout**: Emerald theme for tenant admin interface
- **AuthenticatedLayout**: Standard user interface
- **GuestLayout**: Public pages

#### Admin Dashboards
- **Central Admin Dashboard**: System-wide statistics, tenant management, quick actions
- **Tenant Admin Dashboard**: Tenant-specific stats, user management, tenant info

### Backend Implementation

#### Controllers
- **CentralAdminController**: System-wide admin operations
- **TenantController**: Tenant CRUD operations with automatic setup
- **TenantAdminController**: Tenant-scoped user management

#### Middleware
- **EnsureCentralAdmin**: Protects central admin routes
- **EnsureTenantAdmin**: Protects tenant admin routes (allows central admin access)

#### Models
- **Tenant**: Extended with domain relationships and custom logic
- **User**: Enhanced with role management and tenant scoping
- **Role**: Permission-based with tenant/central scoping

### Routing System

#### Smart Dashboard Routing
The system automatically redirects users to appropriate dashboards:
- Central Admins → `/central-admin/dashboard`
- Tenant Admins → `/tenant-admin/dashboard`
- Regular Users → `/dashboard`

#### Route Structure
```
/central-admin/*     - Central admin routes (central.admin middleware)
/tenant-admin/*      - Tenant admin routes (tenant.admin middleware)
/                    - Public and authenticated user routes
```

### Security Features

#### Data Isolation
- Automatic tenant scoping on queries
- Middleware-based access control
- Cross-tenant access prevention
- Role-based permission system

#### Access Control
- Central admins can access any tenant's data
- Tenant admins restricted to their tenant only
- Users see only their tenant's data
- Proper authentication and authorization

## Important Development Notes

### Always use Sail
- Use `./vendor/bin/sail` prefix for all commands (artisan, composer, npm)
- Docker Required: Ensure Docker Desktop is running before starting Sail

### Multi-Tenancy Considerations
- Always consider tenant context when writing queries
- Use appropriate middleware for route protection
- Test cross-tenant access prevention
- Maintain data isolation in all features

### Frontend Development
- Use appropriate layout for user type
- Implement responsive design
- Follow established color schemes (indigo/emerald)
- Include proper navigation and breadcrumbs

## Testing the System

### Initial Setup
1. Run migrations: `./vendor/bin/sail artisan migrate`
2. Seed database: `./vendor/bin/sail artisan db:seed`
3. Build assets: `./vendor/bin/sail npm run build`

### Test Accounts
- **Central Admin**: admin@racker.com / password
- **Tenant Admins**: Created when tenants are created (default password: password)

### Testing Flow
1. Login as central admin
2. Create new tenants via dashboard
3. Test tenant admin access
4. Verify data isolation
5. Test user management within tenants

## Current Features Implemented

### ✅ Backend
- **Multi-Tenancy Core**
  - Complete tenant management system with stancl/tenancy package
  - Single database architecture with tenant isolation
  - Role-based access control with central/tenant scoping
  - Secure data isolation and middleware protection
  - Automatic tenant setup with role creation
- **User Management**
  - Advanced user management with scoping
  - Role assignment and permission checking
  - Central admin and tenant admin distinction
  - Search and filtering capabilities
  - CRUD operations with proper validation
- **Controllers & Routes**
  - CentralAdminController with full system access
  - TenantController for tenant CRUD operations
  - TenantAdminController for tenant-scoped operations
  - Secure routing with middleware protection

### ✅ Frontend
- **Admin Dashboards**
  - Modern responsive central admin dashboard with statistics
  - Tenant admin dashboard with scoped data
  - Beautiful color-coded layouts (indigo/emerald themes)
  - Quick action panels and navigation
- **User Management Interface**
  - Advanced search with real-time filtering
  - Multi-level filters (type, tenant, status)
  - Modal-based editing with form validation
  - Delete confirmation modals
  - Comprehensive statistics display
- **Tenant Management**
  - Tenant creation workflow with admin setup
  - Beautiful grid layout with search/filter
  - Tenant cards with statistics and actions
  - Status indicators and domain management
- **Component System**
  - Reusable Modal component with animations
  - Professional form components
  - Responsive navigation layouts
  - Error handling and validation display

### 🆕 Email Configuration & Reply System

#### **System Overview**
The Email Configuration & Reply System provides a complete email management solution for the Support Ticket system, enabling:
- Tenant-specific SMTP configuration
- Outbound email processing
- Inbound email processing
- Email threading and ticket updates
- Attachment handling

#### **Architecture Components**

##### **1. Email Configuration System**
- **Database Structure**:
  ```sql
  email_settings:
    - tenant_id
    - smtp_host
    - smtp_port
    - smtp_username
    - smtp_password (encrypted)
    - from_email
    - from_name
    - use_ssl
    - created_at
    - updated_at
  ```

- **Configuration Management**:
  - `EmailSettingsService`: Handles SMTP configuration
  - Dynamic config switching per tenant
  - Encryption for sensitive data
  - Configuration validation system

##### **2. Email Processing System**

###### **Outbound Email**
- **Core Components**:
  - `EmailService`: Handles email sending
  - Template system for formatting
  - Attachment processing
  - Tenant-specific configuration loading

###### **Inbound Email**
- **Processing Components**:
  - Email pipe system
  - Email parsing service
  - Thread ID tracking
  - Attachment extraction

##### **3. Integration Points**

###### **Ticket System Integration**
- Email-to-ticket threading
- Status updates on reply
- Notification system
- Activity logging

###### **User Interface**
- Email preview
- Reply tracking
- Delivery confirmation
- Failure handling

#### **Implementation Phases**

##### **Phase 1: Email Configuration**
- Database migrations
- Settings UI
- SMTP configuration
- Test connection
- Credential encryption

##### **Phase 2: Outbound Email**
- EmailService creation
- Template system
- Attachment handling
- Configuration loading
- Email queuing

##### **Phase 3: Inbound Processing**
- Email receiving
- Parsing service
- Thread matching
- Attachment handling
- Ticket updates

##### **Phase 4: Testing & Integration**
- Unit testing
- Integration testing
- Security testing
- Performance testing
- User acceptance

#### **Technical Considerations**

##### **Security**
- SMTP credential encryption
- Email header validation
- Attachment scanning
- Rate limiting
- Access control

##### **Performance**
- Email queuing
- Attachment limits
- Concurrent processing
- Database optimization

##### **Scalability**
- Queue workers
- Storage management
- Database indexing
- Caching strategy

#### **Required Packages**
- `symfony/mailer`: Email handling
- `league/flysystem`: Attachment storage
- `laravel-queue`: Background processing
- `intervention/image`: Image processing

#### **Development Guidelines**

##### **Email Configuration**
- Always use tenant-specific settings
- Validate SMTP credentials
- Encrypt sensitive data
- Implement connection testing
- Handle configuration updates

##### **Email Processing**
- Use queued processing
- Implement retry logic
- Handle bounces
- Track delivery status
- Manage attachments properly

##### **Security Best Practices**
- Validate email addresses
- Scan attachments
- Rate limit sending
- Monitor for abuse
- Log all activities

### 🔄 Current System Status
**System is now stable** - Major architectural improvements completed:
- ✅ **Tenant Name Display**: Fixed using direct property access (`tenant.name`)
- ✅ **Layout Unification**: Single layout supporting all user types  
- ✅ **Admin Experience**: Consistent navigation across all admin pages
- ✅ **Roles & Permissions**: Complete management system implemented
- ✅ **Custom Navigation**: Complete navigation builder system with real-time integration
- ✅ **External Links & Dividers**: Custom navigation item types implemented
- ✅ **Configuration Deduplication**: Prevents duplicate configurations on save
- ✅ **Content Page Layouts**: Analytics, Reports, and Content pages wrapped in proper layouts
- ✅ **Dashboard Separation**: Complete user/admin dashboard separation implemented
- ✅ **Route Discovery**: Automatic route detection and navigation item generation
- ✅ **Page Cleanup**: Complete file lifecycle management for custom pages

### 🎯 Next Development Priorities
1. **User Experience Enhancements**
   - User invitation system with email notifications
   - Bulk user operations (import/export)
   - Advanced search and filtering across all modules
   - User activity logging and audit trails

2. **Advanced Tenant Features**
   - Tenant details view with comprehensive statistics
   - Tenant-specific settings and customization
   - Tenant analytics and reporting dashboard
   - Bulk tenant operations and management tools

3. **System Administration**
   - Email configuration and testing interface
   - System backup and maintenance tools
   - Advanced analytics and reporting
   - Performance monitoring and optimization

4. **Security & Compliance**
   - Two-factor authentication implementation
   - Session management and security
   - API rate limiting and protection
   - Security audit logs and compliance reporting

5. **Developer Experience**
   - API documentation and testing tools
   - Database backup and migration tools
   - Development environment improvements
   - Automated testing and deployment pipelines

## Troubleshooting Common Issues

### Tenant Name Displays as "Unnamed Tenant" or "Unknown Tenant"

**Problem**: Tenants showing as "Unnamed Tenant" or "Unknown Tenant" in various parts of the application (tenant lists, user management, dashboards).

**Root Cause**: The Stancl\Tenancy package uses a different approach for accessing tenant data. Instead of using `tenant.data.name`, individual properties are accessible directly on the tenant model (e.g., `tenant.name`).

**Solution Steps**:

1. **Backend - Fix Controller Data Access**:
   ```php
   // ❌ WRONG - Using nested data object
   'tenant_name' => optional($user->tenant)->data['name'] ?? 'Unknown Tenant'
   
   // ✅ CORRECT - Direct property access
   'tenant_name' => optional($user->tenant)->name ?? 'Unknown Tenant'
   ```

2. **Backend - Fix Tenant Data Queries**:
   ```php
   // ❌ WRONG - Selecting only specific data fields
   'tenants' => Tenant::select(['id', 'data'])->get()
   
   // ✅ CORRECT - Select all fields for proper model hydration
   'tenants' => Tenant::all()
   ```

3. **Frontend - Fix Display References**:
   ```jsx
   // ❌ WRONG - Accessing nested data property
   {tenant.data?.name || 'Unnamed Tenant'}
   
   // ✅ CORRECT - Direct property access
   {tenant.name || 'Unnamed Tenant'}
   ```

4. **Model Updates - Ensure Proper Data Handling**:
   ```php
   // ✅ CORRECT - Setting tenant properties directly
   $tenant->name = $request->name;
   $tenant->status = 'active';
   $tenant->plan = 'basic';
   $tenant->save();
   ```

**Files Commonly Affected**:
- `app/Http/Controllers/Admin/TenantAdminController.php`
- `app/Http/Controllers/Admin/CentralAdminController.php`
- `resources/js/Pages/CentralAdmin/Users/Index.jsx`
- `resources/js/Pages/CentralAdmin/Tenants/Index.jsx`
- `resources/js/Pages/TenantAdmin/Dashboard.jsx`
- `resources/js/Layouts/TenantAdminLayout.jsx`

**Prevention**: Always use direct property access (`tenant.name`) instead of nested data access (`tenant.data.name`) when working with the Stancl\Tenancy package.

### Navigation Builder System Issues

**Problem**: Custom navigation not appearing or falling back to defaults.

**Common Causes & Solutions**:

1. **NavigationService Cache Issues**:
   ```php
   // Clear navigation cache for specific user
   Cache::forget("navigation.user.{$userId}.tenant.{$tenantId}");
   
   // Or clear all navigation caches
   Cache::flush(); // Use sparingly in production
   ```

2. **Permission Filtering Too Restrictive**:
   ```php
   // Check user permissions
   $user = User::find($userId);
   $permissions = $user->getAllPermissions($tenantId);
   dd($permissions); // Debug available permissions
   ```

3. **Navigation Configuration Not Active**:
   ```php
   // Ensure configuration is activated
   $config = NavigationConfiguration::find($configId);
   $config->activate(); // Sets is_active = true and deactivates others
   ```

4. **Frontend Icon Mapping Missing**:
   ```jsx
   // Add missing icons to icon map in layouts
   const iconMap = {
       'HomeIcon': HomeIcon,
       'UsersIcon': UsersIcon,
       'NewIconName': NewIconComponent, // Add missing icons here
   };
   ```

5. **Database Migration Issues**:
   ```bash
   # Ensure navigation tables exist
   ./vendor/bin/sail artisan migrate
   
   # Seed navigation items library
   ./vendor/bin/sail artisan db:seed --class=NavigationItemsSeeder
   ```

**Debugging Navigation Issues**:
```php
// Test navigation service directly
$user = User::find($userId);
$navigationService = app(App\Services\NavigationService::class);
$navigation = $navigationService->getNavigationForUser($user);
dd($navigation); // Check returned navigation structure

// Test user navigation items
$items = $user->getNavigationItems();
dd($items); // Check transformed navigation items
```

**Files to Check**:
- `app/Services/NavigationService.php` - Core navigation logic
- `app/Traits/HasPermissions.php` - User navigation method
- `app/Http/Middleware/HandleInertiaRequests.php` - Frontend data passing
- `resources/js/Layouts/AuthenticatedLayout.jsx` - Layout integration
- `resources/js/Layouts/TenantAdminLayout.jsx` - Tenant admin layout

## 🎯 Dashboard Separation & User Experience Architecture

### **Dashboard Philosophy & Architecture**

**Core Principle**: Clear separation between **user experience** and **administrative tools** while maintaining role flexibility.

**System Design**:
- **Single Landing Point**: ALL users (including admins) land on `/dashboard` as their default home
- **User-Focused Main Dashboard**: Personal, welcoming experience for everyone
- **Separate Admin Tools**: Administrative functionality available as separate tools via navigation
- **Navigation Builder Control**: What users see is controlled by the Navigation Builder system

### **Dashboard Implementation**

#### **1. Main Dashboard (`/dashboard`)** - Universal User Experience
```php
// Route: /dashboard - FOR ALL USERS
Route::get('/dashboard', function () {
    $user = auth()->user();
    $tenant = $user->tenant;
    
    // Same experience for ALL users, including admins
    return Inertia::render('Dashboard', [
        'pageTitle' => 'Dashboard',
        'stats' => [
            'tenant_id' => $user->tenant_id,
            'tenant_name' => $tenant?->name ?? 'Your Organization',
            'user_metrics' => [
                'tasks_completed' => 12,
                'projects_active' => 3,
                'team_members' => 8,
                'notifications' => 5
            ]
        ],
    ]);
});
```

**Features**:
- 👤 **Personal Welcome**: "Welcome back, [Name]!"
- 📊 **User Metrics**: Personal productivity stats, activity feed
- 🎯 **Quick Actions**: User-relevant shortcuts
- 📱 **Responsive Design**: Mobile-friendly personal dashboard
- ⚡ **Fast Loading**: Focused on user's immediate needs

#### **2. Admin Dashboard (`/tenant-admin/dashboard`)** - Administrative Tools
```php
// Route: /tenant-admin/dashboard - FOR TENANT ADMINS ONLY
Route::get('/tenant-admin/dashboard', [TenantAdminController::class, 'dashboard'])
    ->middleware('permission:' . Permission::MANAGE_TENANT_USERS)
    ->name('tenant-admin.dashboard');
```

**Features**:
- 👥 **User Management Metrics**: Active users, recent signups, role distribution
- 🏢 **Organization Overview**: Tenant stats, settings summary
- ⚙️ **Admin Quick Actions**: Add User, Manage Users, Settings links
- 📈 **Administrative Analytics**: System usage, performance metrics
- 🔧 **Management Tools**: Focused on administrative tasks

#### **3. Navigation Integration**
```php
// app/Traits/HasPermissions.php - Default Navigation for Tenant Admins
protected function getDefaultNavigation(): array
{
    $items = [
        ['name' => 'Dashboard', 'route' => 'dashboard'], // ← All users land here
        ['name' => 'Admin Dashboard', 'route' => 'tenant-admin.dashboard'], // ← Admin tool
        ['name' => 'Manage Users', 'route' => 'tenant-admin.users.index'],
        ['name' => 'Settings', 'route' => 'tenant-admin.settings'],
    ];
}
```

### **Route Discovery & Auto-Navigation System**

#### **Automatic Route Discovery**
```php
// app/Services/RouteDiscoveryService.php
class RouteDiscoveryService
{
    public function discoverRoutes(): array
    {
        // Scans Laravel's registered routes
        $routes = Route::getRoutes();
        
        // Filters and categorizes automatically
        foreach ($routes as $route) {
            if ($this->shouldInclude($route)) {
                $items[] = $this->analyzeRoute($route);
            }
        }
    }
}
```

**Smart Analysis**:
- 🎯 **Icon Suggestions**: `users` → `UsersIcon`, `analytics` → `ChartPieIcon`
- 🔐 **Permission Mapping**: Admin routes → `MANAGE_TENANT_USERS`
- 📂 **Auto-Categorization**: Core, Admin, Content, Custom
- 🚫 **Intelligent Filtering**: Excludes auth, API, form submission routes

**Configuration**:
```php
// config/navigation.php
return [
    'enable_route_discovery' => env('NAVIGATION_ENABLE_ROUTE_DISCOVERY', false),
    'discovery_exclude_patterns' => ['auth.*', '*.store', '*.api.*'],
    'icon_mapping' => ['dashboard' => 'HomeIcon', 'users' => 'UsersIcon'],
    'permission_mapping' => ['admin' => 'MANAGE_TENANT_USERS'],
];
```

**Commands**:
```bash
# Test discovery without enabling
./vendor/bin/sail artisan navigation:discovery test

# Enable route discovery
./vendor/bin/sail artisan navigation:discovery enable

# View discovered routes
./vendor/bin/sail artisan navigation:discovery list
```

### **Page Cleanup & File Management System**

#### **Problem Solved**: Custom page deletion previously left orphaned files
- ❌ **Before**: Only removed database records
- ✅ **Now**: Complete cleanup of files, routes, and database records

#### **Enhanced Deletion Process**
```php
// app/Http/Controllers/Admin/NavigationItemsController.php
public function destroy(NavigationItem $item)
{
    $generatedPage = GeneratedPage::where('navigation_item_key', $item->key)->first();
    
    if ($generatedPage) {
        $this->cleanupGeneratedPage($generatedPage, $item);
    }
    
    $item->delete();
}

protected function cleanupGeneratedPage(GeneratedPage $page, NavigationItem $item): void
{
    // 1. Delete React component file
    $componentPath = resource_path('js/Pages/' . $page->file_path);
    if (file_exists($componentPath)) {
        unlink($componentPath);
        
        // Remove empty directory
        $directory = dirname($componentPath);
        if ($this->isDirectoryEmpty($directory)) {
            rmdir($directory);
        }
    }
    
    // 2. Remove route from dynamic.php
    $this->removeRouteFromDynamicFile($item->route_name, $item->label);
    
    // 3. Delete database record
    $page->delete();
}
```

#### **Page Cleanup Service**
```php
// app/Services/PageCleanupService.php
class PageCleanupService
{
    public function cleanupOrphanedFiles(): array
    {
        // Find orphaned database records
        $orphanedPages = GeneratedPage::whereDoesntHave('navigationItem')->get();
        
        // Find orphaned component files
        $this->cleanupUnreferencedFiles($report);
        
        // Clean up dynamic routes
        $this->cleanupDynamicRoutes($report);
    }
}
```

**Cleanup Commands**:
```bash
# Check status
./vendor/bin/sail artisan pages:cleanup status

# Perform cleanup
./vendor/bin/sail artisan pages:cleanup clean

# Validate integrity
./vendor/bin/sail artisan pages:cleanup validate
```

#### **Enhanced User Experience**
```jsx
// resources/js/Components/NavigationBuilder/CustomPagesModal.jsx
const handleDeletePage = async (pageId) => {
    const confirmed = confirm(
        'Delete this custom page?\n\n' +
        '⚠️ This will permanently remove:\n' +
        '• The navigation item from the database\n' +
        '• The React component file from disk\n' +
        '• The route from dynamic.php\n' +
        '• The page directory (if empty)\n\n' +
        'This action cannot be undone!'
    );
    
    // Complete cleanup process...
};
```

### **Navigation Builder Enhancements**

#### **Auto-Discovery Integration**
```jsx
// resources/js/Pages/CentralAdmin/Navigation/Builder.jsx
{category.items.map(item => (
    <button onClick={() => addItemFromLibrary(item)}>
        <span>{item.label}</span>
        {item.is_discovered && (
            <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-xs">
                Auto
            </span>
        )}
    </button>
))}
```

**Features**:
- 🏷️ **Auto-Discovery Indicators**: Items marked with "Auto" badge
- 🔄 **Refresh Button**: Reload available items to pick up new routes
- 📊 **Discovery Statistics**: Shows seeded vs discovered items
- ⚙️ **Configurable**: Enable/disable via environment variables

### **System Integration Points**

#### **NavigationService Enhancement**
```php
// app/Services/NavigationService.php
public function getAvailableItems(bool $includeDiscovered = false): array
{
    if ($includeDiscovered) {
        $routeDiscovery = app(RouteDiscoveryService::class);
        return $routeDiscovery->getMergedAvailableItems();
    }
    
    // Default: only seeded items
    return NavigationItem::active()->ordered()->get()->groupBy('category');
}
```

#### **NavigationController Integration**
```php
// app/Http/Controllers/Admin/NavigationController.php
public function builder(Request $request)
{
    $includeDiscovered = config('navigation.enable_route_discovery', false);
    $availableItems = $this->navigationService->getAvailableItems($includeDiscovered);
    
    return Inertia::render('CentralAdmin/Navigation/Builder', [
        'availableItems' => $availableItems,
    ]);
}
```

### **Key Benefits Achieved**

#### **Dashboard Separation**
- ✅ **Clear User Experience**: All users get welcoming, personal dashboard
- ✅ **Separated Admin Tools**: Administrative functionality isolated as tools
- ✅ **Flexible Role Management**: Navigation Builder controls what users see
- ✅ **Single Entry Point**: Universal `/dashboard` landing for all users

#### **Route Discovery**
- ✅ **Automatic Detection**: New routes automatically available in Navigation Builder
- ✅ **Smart Categorization**: Intelligent analysis of route purpose and permissions
- ✅ **Production Ready**: Configurable, safe, with comprehensive filtering
- ✅ **Development Friendly**: Easy to discover new functionality

#### **Page Cleanup**
- ✅ **Complete Cleanup**: No orphaned files when deleting custom pages
- ✅ **File System Integrity**: Automatic removal of empty directories
- ✅ **Route Management**: Dynamic route cleanup from `dynamic.php`
- ✅ **Audit Capabilities**: Status checking and validation commands

### **Commands Summary**

```bash
# Navigation Discovery
./vendor/bin/sail artisan navigation:discovery test      # Test & show stats
./vendor/bin/sail artisan navigation:discovery list      # List discovered routes
./vendor/bin/sail artisan navigation:discovery enable    # Enable auto-discovery
./vendor/bin/sail artisan navigation:discovery disable   # Disable auto-discovery

# Page Cleanup
./vendor/bin/sail artisan pages:cleanup status          # Show cleanup status
./vendor/bin/sail artisan pages:cleanup clean           # Perform cleanup
./vendor/bin/sail artisan pages:cleanup validate        # Validate integrity
./vendor/bin/sail artisan pages:cleanup clean --force   # Force cleanup without confirmation

# Navigation Items
./vendor/bin/sail artisan db:seed --class=NavigationItemsSeeder  # Seed navigation items
```

This architecture provides a scalable, maintainable system for dashboard management, automatic route discovery, and complete file lifecycle management while maintaining a clear separation between user experience and administrative tools.

### 🎯 Navigation Builder Styling & User Experience Guide

All navigation icons should display correctly by checking Heroicons package and ensuring proper mapping.

**Navigation Styling Principles:**

- **Icon Mapping**: Always check if new icons exist in @heroicons/react/24/outline and map correctly
- **Consistent Spacing**: Navigation items should use consistent padding and spacing
- **Status Indicators**: Active states should be visually clear for all navigation items
- **Responsive Behavior**: Navigation should collapse appropriately on mobile devices
- **Permission-Based Display**: Items should only show when user has appropriate permissions

**🚨 Critical Implementation Notes:**

- **AuthenticatedLayout**: Updated NavigationItem component with external link and divider support
- **TenantAdminLayout**: Same enhancements for consistency across all layouts
- **Proper URL Handling**: Fixed URL field processing from database through backend to frontend rendering
- **Icon Consistency**: Both layouts use same external link indicators and divider styling

**Key Technical Details:**
```php
// Backend: URL field processing in HasPermissions trait
$navItem = [
    'name' => $item['label'] ?? $item['name'] ?? 'Unknown',
    'route' => $item['route'] ?? '#',
    'url' => $item['url'], // ✅ Added URL field support
    'icon' => $item['icon'] ?? 'QuestionMarkCircleIcon',
    'type' => $item['type'] ?? 'link',
];
```

```jsx
// Frontend: External link rendering
{item.type === 'external' && (
    <a href={item.url || item.href || '#'} target="_blank" rel="noopener noreferrer">
        {/* Link content with external icon */}
    </a>
)}
```

**🔧 Configuration Deduplication Fix:**
- **Problem**: Builder created new configuration every time "Save & Activate" was clicked
- **Solution**: Added check for existing configurations with same name/role combination
- **Behavior**: Now updates existing configuration instead of creating duplicates
- **Scope**: Configurations scoped by tenant + name + target (role/user)

### 🔄 Current System Status
**System is now stable** - Major architectural improvements completed:
- ✅ **Tenant Name Display**: Fixed using direct property access (`tenant.name`)
- ✅ **Layout Unification**: Single layout supporting all user types  
- ✅ **Admin Experience**: Consistent navigation across all admin pages
- ✅ **Roles & Permissions**: Complete management system implemented
- ✅ **Custom Navigation**: Complete navigation builder system with real-time integration
- ✅ **External Links & Dividers**: Custom navigation item types implemented
- ✅ **Configuration Deduplication**: Prevents duplicate configurations on save
- ✅ **Content Page Layouts**: Analytics, Reports, and Content pages wrapped in proper layouts
- ✅ **Dashboard Separation**: Complete user/admin dashboard separation implemented
- ✅ **Route Discovery**: Automatic route detection and navigation item generation
- ✅ **Page Cleanup**: Complete file lifecycle management for custom pages

### 🎯 Next Development Priorities
1. **User Experience Enhancements**
   - User invitation system with email notifications
   - Bulk user operations (import/export)
   - Advanced search and filtering across all modules
   - User activity logging and audit trails

2. **Advanced Tenant Features**
   - Tenant details view with comprehensive statistics
   - Tenant-specific settings and customization
   - Tenant analytics and reporting dashboard
   - Bulk tenant operations and management tools

3. **System Administration**
   - Email configuration and testing interface
   - System backup and maintenance tools
   - Advanced analytics and reporting
   - Performance monitoring and optimization

4. **Security & Compliance**
   - Two-factor authentication implementation
   - Session management and security
   - API rate limiting and protection
   - Security audit logs and compliance reporting

5. **Developer Experience**
   - API documentation and testing tools
   - Database backup and migration tools
   - Development environment improvements
   - Automated testing and deployment pipelines

## Troubleshooting Common Issues

### Tenant Name Displays as "Unnamed Tenant" or "Unknown Tenant"

**Problem**: Tenants showing as "Unnamed Tenant" or "Unknown Tenant" in various parts of the application (tenant lists, user management, dashboards).

**Root Cause**: The Stancl\Tenancy package uses a different approach for accessing tenant data. Instead of using `tenant.data.name`, individual properties are accessible directly on the tenant model (e.g., `tenant.name`).

**Solution Steps**:

1. **Backend - Fix Controller Data Access**:
   ```php
   // ❌ WRONG - Using nested data object
   'tenant_name' => optional($user->tenant)->data['name'] ?? 'Unknown Tenant'
   
   // ✅ CORRECT - Direct property access
   'tenant_name' => optional($user->tenant)->name ?? 'Unknown Tenant'
   ```

2. **Backend - Fix Tenant Data Queries**:
   ```php
   // ❌ WRONG - Selecting only specific data fields
   'tenants' => Tenant::select(['id', 'data'])->get()
   
   // ✅ CORRECT - Select all fields for proper model hydration
   'tenants' => Tenant::all()
   ```

3. **Frontend - Fix Display References**:
   ```jsx
   // ❌ WRONG - Accessing nested data property
   {tenant.data?.name || 'Unnamed Tenant'}
   
   // ✅ CORRECT - Direct property access
   {tenant.name || 'Unnamed Tenant'}
   ```

4. **Model Updates - Ensure Proper Data Handling**:
   ```php
   // ✅ CORRECT - Setting tenant properties directly
   $tenant->name = $request->name;
   $tenant->status = 'active';
   $tenant->plan = 'basic';
   $tenant->save();
   ```

**Files Commonly Affected**:
- `app/Http/Controllers/Admin/TenantAdminController.php`
- `app/Http/Controllers/Admin/CentralAdminController.php`
- `resources/js/Pages/CentralAdmin/Users/Index.jsx`
- `resources/js/Pages/CentralAdmin/Tenants/Index.jsx`
- `resources/js/Pages/TenantAdmin/Dashboard.jsx`
- `resources/js/Layouts/TenantAdminLayout.jsx`

**Prevention**: Always use direct property access (`tenant.name`) instead of nested data access (`tenant.data.name`) when working with the Stancl\Tenancy package.

### Navigation Builder System Issues

**Problem**: Custom navigation not appearing or falling back to defaults.

**Common Causes & Solutions**:

1. **NavigationService Cache Issues**:
   ```php
   // Clear navigation cache for specific user
   Cache::forget("navigation.user.{$userId}.tenant.{$tenantId}");
   
   // Or clear all navigation caches
   Cache::flush(); // Use sparingly in production
   ```

2. **Permission Filtering Too Restrictive**:
   ```php
   // Check user permissions
   $user = User::find($userId);
   $permissions = $user->getAllPermissions($tenantId);
   dd($permissions); // Debug available permissions
   ```

3. **Navigation Configuration Not Active**:
   ```php
   // Ensure configuration is activated
   $config = NavigationConfiguration::find($configId);
   $config->activate(); // Sets is_active = true and deactivates others
   ```

4. **Frontend Icon Mapping Missing**:
   ```jsx
   // Add missing icons to icon map in layouts
   const iconMap = {
       'HomeIcon': HomeIcon,
       'UsersIcon': UsersIcon,
       'NewIconName': NewIconComponent, // Add missing icons here
   };
   ```

5. **Database Migration Issues**:
   ```bash
   # Ensure navigation tables exist
   ./vendor/bin/sail artisan migrate
   
   # Seed navigation items library
   ./vendor/bin/sail artisan db:seed --class=NavigationItemsSeeder
   ```

**Debugging Navigation Issues**:
```php
// Test navigation service directly
$user = User::find($userId);
$navigationService = app(App\Services\NavigationService::class);
$navigation = $navigationService->getNavigationForUser($user);
dd($navigation); // Check returned navigation structure

// Test user navigation items
$items = $user->getNavigationItems();
dd($items); // Check transformed navigation items
```

**Files to Check**:
- `app/Services/NavigationService.php` - Core navigation logic
- `app/Traits/HasPermissions.php` - User navigation method
- `app/Http/Middleware/HandleInertiaRequests.php` - Frontend data passing
- `resources/js/Layouts/AuthenticatedLayout.jsx` - Layout integration
- `resources/js/Layouts/TenantAdminLayout.jsx` - Tenant admin layout

## 🎯 Dashboard Separation & User Experience Architecture

### **Dashboard Philosophy & Architecture**

**Core Principle**: Clear separation between **user experience** and **administrative tools** while maintaining role flexibility.

**System Design**:
- **Single Landing Point**: ALL users (including admins) land on `/dashboard` as their default home
- **User-Focused Main Dashboard**: Personal, welcoming experience for everyone
- **Separate Admin Tools**: Administrative functionality available as separate tools via navigation
- **Navigation Builder Control**: What users see is controlled by the Navigation Builder system

### **Dashboard Implementation**

#### **1. Main Dashboard (`/dashboard`)** - Universal User Experience
```php
// Route: /dashboard - FOR ALL USERS
Route::get('/dashboard', function () {
    $user = auth()->user();
    $tenant = $user->tenant;
    
    // Same experience for ALL users, including admins
    return Inertia::render('Dashboard', [
        'pageTitle' => 'Dashboard',
        'stats' => [
            'tenant_id' => $user->tenant_id,
            'tenant_name' => $tenant?->name ?? 'Your Organization',
            'user_metrics' => [
                'tasks_completed' => 12,
                'projects_active' => 3,
                'team_members' => 8,
                'notifications' => 5
            ]
        ],
    ]);
});
```

**Features**:
- 👤 **Personal Welcome**: "Welcome back, [Name]!"
- 📊 **User Metrics**: Personal productivity stats, activity feed
- 🎯 **Quick Actions**: User-relevant shortcuts
- 📱 **Responsive Design**: Mobile-friendly personal dashboard
- ⚡ **Fast Loading**: Focused on user's immediate needs

#### **2. Admin Dashboard (`/tenant-admin/dashboard`)** - Administrative Tools
```php
// Route: /tenant-admin/dashboard - FOR TENANT ADMINS ONLY
Route::get('/tenant-admin/dashboard', [TenantAdminController::class, 'dashboard'])
    ->middleware('permission:' . Permission::MANAGE_TENANT_USERS)
    ->name('tenant-admin.dashboard');
```

**Features**:
- 👥 **User Management Metrics**: Active users, recent signups, role distribution
- 🏢 **Organization Overview**: Tenant stats, settings summary
- ⚙️ **Admin Quick Actions**: Add User, Manage Users, Settings links
- 📈 **Administrative Analytics**: System usage, performance metrics
- 🔧 **Management Tools**: Focused on administrative tasks

#### **3. Navigation Integration**
```php
// app/Traits/HasPermissions.php - Default Navigation for Tenant Admins
protected function getDefaultNavigation(): array
{
    $items = [
        ['name' => 'Dashboard', 'route' => 'dashboard'], // ← All users land here
        ['name' => 'Admin Dashboard', 'route' => 'tenant-admin.dashboard'], // ← Admin tool
        ['name' => 'Manage Users', 'route' => 'tenant-admin.users.index'],
        ['name' => 'Settings', 'route' => 'tenant-admin.settings'],
    ];
}
```

### **Route Discovery & Auto-Navigation System**

#### **Automatic Route Discovery**
```php
// app/Services/RouteDiscoveryService.php
class RouteDiscoveryService
{
    public function discoverRoutes(): array
    {
        // Scans Laravel's registered routes
        $routes = Route::getRoutes();
        
        // Filters and categorizes automatically
        foreach ($routes as $route) {
            if ($this->shouldInclude($route)) {
                $items[] = $this->analyzeRoute($route);
            }
        }
    }
}
```

**Smart Analysis**:
- 🎯 **Icon Suggestions**: `users` → `UsersIcon`, `analytics` → `ChartPieIcon`
- 🔐 **Permission Mapping**: Admin routes → `MANAGE_TENANT_USERS`
- 📂 **Auto-Categorization**: Core, Admin, Content, Custom
- 🚫 **Intelligent Filtering**: Excludes auth, API, form submission routes

**Configuration**:
```php
// config/navigation.php
return [
    'enable_route_discovery' => env('NAVIGATION_ENABLE_ROUTE_DISCOVERY', false),
    'discovery_exclude_patterns' => ['auth.*', '*.store', '*.api.*'],
    'icon_mapping' => ['dashboard' => 'HomeIcon', 'users' => 'UsersIcon'],
    'permission_mapping' => ['admin' => 'MANAGE_TENANT_USERS'],
];
```

**Commands**:
```bash
# Test discovery without enabling
./vendor/bin/sail artisan navigation:discovery test

# Enable route discovery
./vendor/bin/sail artisan navigation:discovery enable

# View discovered routes
./vendor/bin/sail artisan navigation:discovery list
```

### **Page Cleanup & File Management System**

#### **Problem Solved**: Custom page deletion previously left orphaned files
- ❌ **Before**: Only removed database records
- ✅ **Now**: Complete cleanup of files, routes, and database records

#### **Enhanced Deletion Process**
```php
// app/Http/Controllers/Admin/NavigationItemsController.php
public function destroy(NavigationItem $item)
{
    $generatedPage = GeneratedPage::where('navigation_item_key', $item->key)->first();
    
    if ($generatedPage) {
        $this->cleanupGeneratedPage($generatedPage, $item);
    }
    
    $item->delete();
}

protected function cleanupGeneratedPage(GeneratedPage $page, NavigationItem $item): void
{
    // 1. Delete React component file
    $componentPath = resource_path('js/Pages/' . $page->file_path);
    if (file_exists($componentPath)) {
        unlink($componentPath);
        
        // Remove empty directory
        $directory = dirname($componentPath);
        if ($this->isDirectoryEmpty($directory)) {
            rmdir($directory);
        }
    }
    
    // 2. Remove route from dynamic.php
    $this->removeRouteFromDynamicFile($item->route_name, $item->label);
    
    // 3. Delete database record
    $page->delete();
}
```

#### **Page Cleanup Service**
```php
// app/Services/PageCleanupService.php
class PageCleanupService
{
    public function cleanupOrphanedFiles(): array
    {
        // Find orphaned database records
        $orphanedPages = GeneratedPage::whereDoesntHave('navigationItem')->get();
        
        // Find orphaned component files
        $this->cleanupUnreferencedFiles($report);
        
        // Clean up dynamic routes
        $this->cleanupDynamicRoutes($report);
    }
}
```

**Cleanup Commands**:
```bash
# Check status
./vendor/bin/sail artisan pages:cleanup status

# Perform cleanup
./vendor/bin/sail artisan pages:cleanup clean

# Validate integrity
./vendor/bin/sail artisan pages:cleanup validate
```

#### **Enhanced User Experience**
```jsx
// resources/js/Components/NavigationBuilder/CustomPagesModal.jsx
const handleDeletePage = async (pageId) => {
    const confirmed = confirm(
        'Delete this custom page?\n\n' +
        '⚠️ This will permanently remove:\n' +
        '• The navigation item from the database\n' +
        '• The React component file from disk\n' +
        '• The route from dynamic.php\n' +
        '• The page directory (if empty)\n\n' +
        'This action cannot be undone!'
    );
    
    // Complete cleanup process...
};
```

### **Navigation Builder Enhancements**

#### **Auto-Discovery Integration**
```jsx
// resources/js/Pages/CentralAdmin/Navigation/Builder.jsx
{category.items.map(item => (
    <button onClick={() => addItemFromLibrary(item)}>
        <span>{item.label}</span>
        {item.is_discovered && (
            <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-xs">
                Auto
            </span>
        )}
    </button>
))}
```

**Features**:
- 🏷️ **Auto-Discovery Indicators**: Items marked with "Auto" badge
- 🔄 **Refresh Button**: Reload available items to pick up new routes
- 📊 **Discovery Statistics**: Shows seeded vs discovered items
- ⚙️ **Configurable**: Enable/disable via environment variables

### **System Integration Points**

#### **NavigationService Enhancement**
```php
// app/Services/NavigationService.php
public function getAvailableItems(bool $includeDiscovered = false): array
{
    if ($includeDiscovered) {
        $routeDiscovery = app(RouteDiscoveryService::class);
        return $routeDiscovery->getMergedAvailableItems();
    }
    
    // Default: only seeded items
    return NavigationItem::active()->ordered()->get()->groupBy('category');
}
```

#### **NavigationController Integration**
```php
// app/Http/Controllers/Admin/NavigationController.php
public function builder(Request $request)
{
    $includeDiscovered = config('navigation.enable_route_discovery', false);
    $availableItems = $this->navigationService->getAvailableItems($includeDiscovered);
    
    return Inertia::render('CentralAdmin/Navigation/Builder', [
        'availableItems' => $availableItems,
    ]);
}
```

### **Key Benefits Achieved**

#### **Dashboard Separation**
- ✅ **Clear User Experience**: All users get welcoming, personal dashboard
- ✅ **Separated Admin Tools**: Administrative functionality isolated as tools
- ✅ **Flexible Role Management**: Navigation Builder controls what users see
- ✅ **Single Entry Point**: Universal `/dashboard` landing for all users

#### **Route Discovery**
- ✅ **Automatic Detection**: New routes automatically available in Navigation Builder
- ✅ **Smart Categorization**: Intelligent analysis of route purpose and permissions
- ✅ **Production Ready**: Configurable, safe, with comprehensive filtering
- ✅ **Development Friendly**: Easy to discover new functionality

#### **Page Cleanup**
- ✅ **Complete Cleanup**: No orphaned files when deleting custom pages
- ✅ **File System Integrity**: Automatic removal of empty directories
- ✅ **Route Management**: Dynamic route cleanup from `dynamic.php`
- ✅ **Audit Capabilities**: Status checking and validation commands

### **Commands Summary**

```bash
# Navigation Discovery
./vendor/bin/sail artisan navigation:discovery test      # Test & show stats
./vendor/bin/sail artisan navigation:discovery list      # List discovered routes
./vendor/bin/sail artisan navigation:discovery enable    # Enable auto-discovery
./vendor/bin/sail artisan navigation:discovery disable   # Disable auto-discovery

# Page Cleanup
./vendor/bin/sail artisan pages:cleanup status          # Show cleanup status
./vendor/bin/sail artisan pages:cleanup clean           # Perform cleanup
./vendor/bin/sail artisan pages:cleanup validate        # Validate integrity
./vendor/bin/sail artisan pages:cleanup clean --force   # Force cleanup without confirmation

# Navigation Items
./vendor/bin/sail artisan db:seed --class=NavigationItemsSeeder  # Seed navigation items
```

This architecture provides a scalable, maintainable system for dashboard management, automatic route discovery, and complete file lifecycle management while maintaining a clear separation between user experience and administrative tools. 