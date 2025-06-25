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

### ✅ Recently Completed
- **Unified AuthenticatedLayout System**
  - **Context-Aware Layout**: Single layout that adapts based on user type
  - **Dynamic Admin Sidebars**: Conditional admin features appear for admin users
  - **Consistent Navigation**: Persistent admin sidebars across Dashboard → Profile → Users → Settings
  - **Progressive Enhancement**: Regular users get clean interface, admins get rich features
  - **Role-Based Theming**: Indigo theme for central admin, emerald for tenant admin
  - **Mobile Responsive**: All user types supported across screen sizes
  - **Smart Route Detection**: Automatic highlighting of current pages
  - **Unified Dashboard**: Single `/dashboard` endpoint serving all user types with appropriate data

- **Complete Roles & Permissions Management System**
  - **Visual Permission Management**: Organized permissions by category with descriptions
  - **Comprehensive Role CRUD**: Create, edit, delete roles with full validation
  - **Permission Categories**: System Management, User Management, Tenant Operations, Content Management
  - **Role Type System**: Distinguish between Central (system-wide) and Tenant (tenant-specific) roles
  - **Permission Preview**: See assigned permissions at a glance with counters
  - **User Count Display**: Shows how many users have each role
  - **Safety Protections**: Core roles protected, user assignments checked before deletion
  - **Modern Modal UI**: Compact, user-friendly modals with proper sizing and responsive design
  - **Real-time Validation**: Form validation with immediate feedback
  - **Loading States**: Animated loading indicators for better UX
  - **Error Handling**: Comprehensive validation and user feedback
  - **Security Features**: Protected routes, permission checking, role assignment validation

- **Enhanced Modal System**
  - **Optimal Sizing**: Roles modal (2xl), delete confirmation (sm) for better UX
  - **Improved Layout**: Sectioned forms with clear visual hierarchy
  - **Close Controls**: Multiple ways to close (X button, cancel, overlay click)
  - **Loading Animations**: Spinning indicators during form submission
  - **Responsive Design**: Works perfectly on all screen sizes
  - **Keyboard Navigation**: Proper focus management and accessibility

### 🔄 Current System Architecture

#### **Unified Layout System**
The application now uses a single `AuthenticatedLayout` that dynamically adapts:

```jsx
// User Type Detection
const isCentralAdmin = user?.is_central_admin;
const isTenantAdmin = user?.roles?.some(role => role.name === 'tenant_admin');

// Theme Configuration
const themeConfig = {
  central_admin: { 
    sidebarBg: 'bg-indigo-900', 
    accent: 'indigo',
    textColor: 'text-indigo-100' 
  },
  tenant_admin: { 
    sidebarBg: 'bg-emerald-900', 
    accent: 'emerald',
    textColor: 'text-emerald-100' 
  }
};
```

#### **Permission System Architecture**
Granular permissions organized by functional areas:

- **System Management**: `manage_tenants`, `manage_system_settings`, `view_system_analytics`, `impersonate_users`, `view_all_data`
- **User Management**: `manage_central_users`, `manage_tenant_users`, `invite_users`, `manage_some_users`
- **Tenant Operations**: `create_tenants`, `delete_tenants`, `manage_tenant_settings`, `manage_tenant_roles`, `view_tenant_analytics`, `view_tenant_data`, `export_tenant_data`
- **Content Management**: `view_dashboard`, `manage_own_profile`, `create_content`, `edit_content`, `edit_own_content`, `delete_content`, `view_reports`

#### **Role Management Backend**
New controller methods in `CentralAdminController`:
- `storeRole()`: Create roles with comprehensive validation
- `updateRole()`: Edit existing roles with permission updates
- `destroyRole()`: Safe deletion with user assignment checks

Routes added:
```php
Route::post('/roles', [CentralAdminController::class, 'storeRole'])->name('roles.store');
Route::patch('/roles/{role}', [CentralAdminController::class, 'updateRole'])->name('roles.update');
Route::delete('/roles/{role}', [CentralAdminController::class, 'destroyRole'])->name('roles.destroy');
```

### 🔄 Current Issues
**System is now stable** - Major architectural improvements completed:
- ✅ **Tenant Name Display**: Fixed using direct property access (`tenant.name`)
- ✅ **Layout Unification**: Single layout supporting all user types
- ✅ **Admin Experience**: Consistent navigation across all admin pages
- ✅ **Roles & Permissions**: Complete management system implemented

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
  - Advanced search functionality (by name/email)
  - Multi-level filtering (user type, tenant, status)
  - Modal-based user editing with form validation
  - Confirmation modals for user deletion
  - Real-time search with debouncing
  - Comprehensive user statistics dashboard
- **System Settings Page**
  - Application configuration management
  - Permission toggles (tenant creation, user registration, etc.)
  - Tenant limit settings
  - Role management overview
  - System status monitoring
- **Enhanced Modal System**
  - Reusable Modal component with proper animations
  - Form handling within modals
  - Error handling and validation display 