# 🏢 Multi-Tenancy System Guide - Racker

## 📋 System Overview

We've successfully implemented a **single-database multi-tenancy system** with dual admin panels:

### ✅ What's Been Implemented

1. **Central Admin Panel** - For system-wide management
2. **Tenant Admin Panel** - For tenant-specific management  
3. **Role & Permission System** - Granular access control
4. **Single Database Architecture** - Using `stancl/tenancy` package
5. **Automatic User Routing** - Users are redirected based on their roles

---

## 🎯 User Types & Access Levels

### 1. Central Admin (You)
- **Email**: `admin@racker.com`
- **Password**: `password` (⚠️ Change in production!)
- **Access**: Full system control
- **Routes**: `/central-admin/*`
- **Can**: Manage all tenants, create tenants, manage all users

### 2. Tenant Admin
- **Access**: Tenant-specific admin panel
- **Routes**: `/tenant-admin/*`
- **Can**: Manage users within their tenant only

### 3. Tenant Users
- **Access**: Regular dashboard
- **Routes**: `/dashboard`
- **Can**: View their tenant's data, manage own profile

---

## 🗄️ Database Structure

```
tenants
├── id (UUID)
├── data (JSON) - stores tenant info
└── timestamps

users
├── id
├── tenant_id (nullable, FK to tenants)
├── is_central_admin (boolean)
├── name, email, password
└── timestamps

roles
├── id
├── name (e.g., 'tenant_admin', 'tenant_user')
├── type ('central' or 'tenant')
├── tenant_id (nullable)
├── permissions (JSON array)
└── timestamps

user_roles (pivot)
├── user_id, role_id, tenant_id
└── timestamps

domains
├── id
├── domain
├── tenant_id
└── timestamps
```

---

## 🚀 Testing the System

### Step 1: Login as Central Admin
1. Visit: `http://localhost/login`
2. Email: `admin@racker.com`
3. Password: `password`
4. You'll be redirected to: `/central-admin/dashboard`

### Step 2: Create Your First Tenant
1. Go to: `/central-admin/tenants/create`
2. Fill in:
   - **Tenant Name**: "Acme Corp"
   - **Domain**: "acme.localhost" 
   - **Admin Name**: "John Doe"
   - **Admin Email**: "john@acme.com"
3. Submit - This creates:
   - ✅ New tenant
   - ✅ Tenant domain
   - ✅ Tenant-specific roles
   - ✅ Tenant admin user

### Step 3: Test Tenant Admin Access
1. Logout from central admin
2. Login as: `john@acme.com` / `password`
3. You'll be redirected to: `/tenant-admin/dashboard`
4. Can manage users within "Acme Corp" tenant only

### Step 4: Test User Creation
1. In tenant admin: `/tenant-admin/users/create`
2. Create regular tenant users
3. Assign roles: tenant_user, tenant_manager, etc.

---

## 🔐 Permission System

### Central Admin Permissions
```php
[
    'manage_tenants',
    'manage_central_users', 
    'manage_tenant_users',
    'view_system_analytics',
    'manage_system_settings',
    'create_tenants',
    'delete_tenants',
    'impersonate_users',
    'view_all_data'
]
```

### Tenant Admin Permissions
```php
[
    'manage_tenant_users',
    'invite_users',
    'manage_tenant_settings', 
    'view_tenant_analytics',
    'manage_tenant_roles',
    'view_tenant_data',
    'export_tenant_data'
]
```

### Tenant User Permissions
```php
[
    'view_dashboard',
    'manage_own_profile',
    'view_tenant_data',
    'create_content',
    'edit_own_content'
]
```

---

## 🛠️ Available Routes

### Central Admin Routes
- `GET /central-admin/dashboard` - Main dashboard
- `GET /central-admin/tenants` - List all tenants
- `POST /central-admin/tenants` - Create tenant
- `GET /central-admin/tenants/{id}` - View tenant details
- `PUT /central-admin/tenants/{id}` - Update tenant
- `DELETE /central-admin/tenants/{id}` - Delete tenant
- `GET /central-admin/users` - List all users
- `GET /central-admin/settings` - System settings

### Tenant Admin Routes
- `GET /tenant-admin/dashboard` - Tenant dashboard
- `GET /tenant-admin/users` - List tenant users
- `POST /tenant-admin/users` - Create tenant user
- `PUT /tenant-admin/users/{id}` - Update tenant user
- `DELETE /tenant-admin/users/{id}` - Delete tenant user
- `GET /tenant-admin/settings` - Tenant settings

---

## 🔧 Key Features

### ✅ Data Isolation
- Each tenant's data is completely isolated
- Cross-tenant data access is prevented by middleware
- Role-based permissions are tenant-scoped

### ✅ Automatic User Routing
- Central admins → `/central-admin/dashboard`
- Tenant admins → `/tenant-admin/dashboard`  
- Regular users → `/dashboard`

### ✅ Security
- Middleware protection on all admin routes
- Role verification before data access
- Foreign key constraints prevent orphaned data

### ✅ Scalability
- Single database approach for cost efficiency
- Can easily add new tenant features
- Role system allows granular permissions

---

## 🎨 Next Steps for UI

You'll need to create React components for:

1. **Central Admin Pages**:
   - `resources/js/Pages/CentralAdmin/Dashboard.jsx`
   - `resources/js/Pages/CentralAdmin/Tenants/Index.jsx`
   - `resources/js/Pages/CentralAdmin/Tenants/Create.jsx`
   - `resources/js/Pages/CentralAdmin/Users/Index.jsx`

2. **Tenant Admin Pages**:
   - `resources/js/Pages/TenantAdmin/Dashboard.jsx`
   - `resources/js/Pages/TenantAdmin/Users/Index.jsx`
   - `resources/js/Pages/TenantAdmin/Users/Create.jsx`

3. **Layouts**:
   - `resources/js/Layouts/CentralAdminLayout.jsx`
   - `resources/js/Layouts/TenantAdminLayout.jsx`

---

## 🚨 Important Notes

1. **Change Default Passwords**: All default passwords are `password`
2. **Environment**: This is configured for local development
3. **Production**: Remember to update APP_ENV, database credentials, etc.
4. **Domains**: Currently using localhost domains for testing

---

## 🧪 Quick Test Commands

```bash
# Create additional roles
./vendor/bin/sail artisan tinker
>>> App\Models\Role::create(['name' => 'custom_role', 'type' => 'tenant', 'permissions' => ['custom_permission']])

# Check user permissions  
>>> $user = App\Models\User::find(1)
>>> $user->hasPermission('manage_tenants')

# Create test tenant programmatically
>>> $tenant = App\Models\Tenant::create(['data' => ['name' => 'Test Corp']])
>>> $tenant->domains()->create(['domain' => 'test.localhost'])
```

The multi-tenancy system is now fully functional and ready for frontend development! 🎉 