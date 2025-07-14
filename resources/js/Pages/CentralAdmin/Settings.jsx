import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import Modal from '@/Components/Modal';
import { useState } from 'react';
import { 
    CogIcon, 
    ShieldCheckIcon, 
    UsersIcon, 
    BuildingOfficeIcon,
    EnvelopeIcon,
    GlobeAltIcon,
    CircleStackIcon,
    BellIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

export default function Settings({ settings, roles, stats, permissions, tenants }) {
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState(null);
    const [activeRoleTab, setActiveRoleTab] = useState('central');
    const [selectedTenantId, setSelectedTenantId] = useState('');
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [creatingCustomPermission, setCreatingCustomPermission] = useState(false);

    const { data, setData, patch, processing, errors } = useForm({
        app_name: settings?.app_name || 'Racker',
        app_url: settings?.app_url || 'http://localhost',
        admin_email: settings?.admin_email || 'admin@racker.com',
        tenant_creation_enabled: settings?.tenant_creation_enabled || true,
        user_registration_enabled: settings?.user_registration_enabled || true,
        email_verification_required: settings?.email_verification_required || true,
        max_tenants_per_admin: settings?.max_tenants_per_admin || 0,
        default_tenant_storage_limit: settings?.default_tenant_storage_limit || 1024,
        maintenance_mode: settings?.maintenance_mode || false,
    });

    const roleForm = useForm({
        name: '',
        display_name: '',
        description: '',
        type: 'tenant',
        tenant_id: '',
        permissions: [],
    });

    const permissionForm = useForm({
        key: '',
        label: '',
        description: '',
        category: 'Content Management',
    });

    // Available permissions organized by category - now using the Permission enum structure
    const availablePermissions = permissions || {
        'System Management': [
            { key: 'manage_tenants', label: 'Manage Tenants', description: 'Create, edit, and delete tenants' },
            { key: 'manage_system_settings', label: 'Manage System Settings', description: 'Access system configuration' },
            { key: 'view_system_analytics', label: 'View System Analytics', description: 'Access system-wide analytics' },
            { key: 'impersonate_users', label: 'Impersonate Users', description: 'Login as other users' },
            { key: 'view_all_data', label: 'View All Data', description: 'Access all system data' },
            { key: 'export_system_data', label: 'Export System Data', description: 'Export system-wide data' },
            { key: 'manage_system_backups', label: 'Manage System Backups', description: 'Create and restore system backups' },
        ],
        'User Management': [
            { key: 'manage_central_users', label: 'Manage Central Users', description: 'Manage system administrators' },
            { key: 'manage_tenant_users', label: 'Manage Tenant Users', description: 'Manage users within tenants' },
            { key: 'invite_users', label: 'Invite Users', description: 'Send user invitations' },
            { key: 'view_user_profiles', label: 'View User Profiles', description: 'Access user profile information' },
            { key: 'reset_user_passwords', label: 'Reset User Passwords', description: 'Reset passwords for other users' },
            { key: 'deactivate_users', label: 'Deactivate Users', description: 'Suspend or deactivate user accounts' },
            { key: 'manage_user_roles', label: 'Manage User Roles', description: 'Assign and remove user roles' },
        ],
        'Tenant Operations': [
            { key: 'create_tenants', label: 'Create Tenants', description: 'Create new tenant organizations' },
            { key: 'delete_tenants', label: 'Delete Tenants', description: 'Remove tenant organizations' },
            { key: 'manage_tenant_settings', label: 'Manage Tenant Settings', description: 'Configure tenant settings' },
            { key: 'manage_tenant_roles', label: 'Manage Tenant Roles', description: 'Manage roles within tenant' },
            { key: 'view_tenant_analytics', label: 'View Tenant Analytics', description: 'Access tenant analytics' },
            { key: 'view_tenant_data', label: 'View Tenant Data', description: 'Access tenant information' },
            { key: 'export_tenant_data', label: 'Export Tenant Data', description: 'Export tenant data' },
            { key: 'manage_tenant_billing', label: 'Manage Tenant Billing', description: 'Access billing and subscription settings' },
        ],
        'Content Management': [
            { key: 'view_dashboard', label: 'View Dashboard', description: 'Access dashboard interface' },
            { key: 'manage_own_profile', label: 'Manage Own Profile', description: 'Edit personal profile' },
            { key: 'create_content', label: 'Create Content', description: 'Create new content' },
            { key: 'edit_content', label: 'Edit Content', description: 'Edit existing content' },
            { key: 'edit_own_content', label: 'Edit Own Content', description: 'Edit only own content' },
            { key: 'delete_content', label: 'Delete Content', description: 'Remove content' },
            { key: 'publish_content', label: 'Publish Content', description: 'Publish and unpublish content' },
            { key: 'moderate_content', label: 'Moderate Content', description: 'Review and moderate user content' },
            { key: 'view_reports', label: 'View Reports', description: 'Access reporting features' },
            { key: 'manage_categories', label: 'Manage Categories', description: 'Create and manage content categories' },
            { key: 'manage_contacts', label: 'Manage Contacts', description: 'Create, edit, and manage contact information' },
        ],
        'Support Ticket Management': [
            { key: 'view_support_tickets', label: 'View Support Tickets', description: 'View support tickets within tenant' },
            { key: 'create_support_tickets', label: 'Create Support Tickets', description: 'Create new support tickets' },
            { key: 'manage_support_tickets', label: 'Manage Support Tickets', description: 'Full ticket management capabilities' },
            { key: 'view_all_support_tickets', label: 'View All Support Tickets', description: 'View all tickets across tenant regardless of assignment' },
            { key: 'assign_support_tickets', label: 'Assign Support Tickets', description: 'Assign tickets to team members' },
            { key: 'escalate_support_tickets', label: 'Escalate Support Tickets', description: 'Escalate tickets to higher priority or management' },
            { key: 'resolve_support_tickets', label: 'Resolve Support Tickets', description: 'Mark tickets as resolved or closed' },
            { key: 'delete_support_tickets', label: 'Delete Support Tickets', description: 'Delete support tickets' },
            { key: 'manage_ticket_categories', label: 'Manage Ticket Categories', description: 'Create and manage ticket categories' },
            { key: 'manage_ticket_workflows', label: 'Manage Ticket Workflows', description: 'Configure automated workflows and escalations' },
            { key: 'manage_ticket_sla', label: 'Manage Ticket SLA', description: 'Configure SLA policies and response times' },
            { key: 'view_ticket_reports', label: 'View Ticket Reports', description: 'Access ticket analytics and reporting' },
            { key: 'configure_support_tickets', label: 'Configure Support Tickets', description: 'Configure support ticket system settings' },
            { key: 'view_support_analytics', label: 'View Support Analytics', description: 'Access detailed support ticket analytics and metrics' },
            { key: 'manage_microsoft365_integration', label: 'Manage Microsoft 365 Integration', description: 'Configure Microsoft 365 email integration' },
        ],
        'Email Management': [
            { key: 'manage_email_providers', label: 'Manage Email Providers', description: 'Manage email provider integrations' },
            { key: 'manage_email_templates', label: 'Manage Email Templates', description: 'Manage email template designs' },
            { key: 'view_email_analytics', label: 'View Email Analytics', description: 'Access email analytics and reporting' },
            { key: 'send_email_campaigns', label: 'Send Email Campaigns', description: 'Send email campaigns to users' },
        ],
    };

    const submit = (e) => {
        e.preventDefault();
        patch(route('central-admin.settings.update'));
    };

    const openCreateRoleModal = () => {
        roleForm.reset();
        setEditingRole(null);
        setShowRoleModal(true);
    };

    const openEditRoleModal = (role) => {
        setEditingRole(role);
        roleForm.setData({
            name: role.name,
            display_name: role.display_name,
            description: role.description,
            type: role.type,
            tenant_id: role.tenant_id || '',
            permissions: role.permissions || [],
        });
        setShowRoleModal(true);
    };

    const handlePermissionToggle = (permissionKey) => {
        const currentPermissions = roleForm.data.permissions;
        const updatedPermissions = currentPermissions.includes(permissionKey)
            ? currentPermissions.filter(p => p !== permissionKey)
            : [...currentPermissions, permissionKey];
        
        roleForm.setData('permissions', updatedPermissions);
    };

    const submitRole = (e) => {
        e.preventDefault();
        
        if (editingRole) {
            roleForm.patch(route('central-admin.roles.update', editingRole.id), {
                onSuccess: () => {
                    setShowRoleModal(false);
                    setEditingRole(null);
                },
            });
        } else {
            roleForm.post(route('central-admin.roles.store'), {
                onSuccess: () => {
                    setShowRoleModal(false);
                },
            });
        }
    };

    const confirmDeleteRole = (role) => {
        setRoleToDelete(role);
        setShowDeleteModal(true);
    };

    const deleteRole = () => {
        if (roleToDelete) {
            roleForm.delete(route('central-admin.roles.destroy', roleToDelete.id), {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setRoleToDelete(null);
                },
            });
        }
    };

    // Filter roles based on active tab
    const getFilteredRoles = () => {
        if (!roles) return [];
        
        switch (activeRoleTab) {
            case 'central':
                return roles.filter(role => role.type === 'central');
            case 'template':
                return roles.filter(role => role.type === 'tenant' && !role.tenant_id);
            case 'tenant':
                // Only show roles if a specific tenant is selected
                if (!selectedTenantId) {
                    return [];
                }
                const tenantRoles = roles.filter(role => role.type === 'tenant' && role.tenant_id);
                return tenantRoles.filter(role => role.tenant_id === selectedTenantId);
            default:
                return roles;
        }
    };

    // Get unique tenants that have roles
    const getTenantsWithRoles = () => {
        const tenantRoles = roles?.filter(role => role.type === 'tenant' && role.tenant_id) || [];
        const tenants = [];
        const seenTenantIds = new Set();
        
        tenantRoles.forEach(role => {
            if (!seenTenantIds.has(role.tenant_id)) {
                seenTenantIds.add(role.tenant_id);
                tenants.push({
                    id: role.tenant_id,
                    name: role.tenant?.name || 'Unknown Tenant'
                });
            }
        });
        
        return tenants.sort((a, b) => a.name.localeCompare(b.name));
    };

    const openCreatePermissionModal = () => {
        permissionForm.reset();
        setShowPermissionModal(true);
    };

    const submitPermission = (e) => {
        e.preventDefault();
        setCreatingCustomPermission(true);
        
        permissionForm.post(route('central-admin.permissions.store'), {
            onSuccess: () => {
                setShowPermissionModal(false);
                setCreatingCustomPermission(false);
                // Reload the page to get updated permissions
                window.location.reload();
            },
            onError: () => {
                setCreatingCustomPermission(false);
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold leading-tight text-gray-900">
                    System Settings
                </h2>
            }
        >
            <Head title="System Settings" />

            {/* Stats Overview */}
            <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <BuildingOfficeIcon className="h-6 w-6 text-indigo-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Tenants</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats?.total_tenants || 0}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <UsersIcon className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats?.total_users || 0}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ShieldCheckIcon className="h-6 w-6 text-purple-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Active Roles</dt>
                                    <dd className="text-lg font-medium text-gray-900">{roles?.length || 0}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CircleStackIcon className="h-6 w-6 text-blue-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Storage Used</dt>
                                    <dd className="text-lg font-medium text-gray-900">2.4 GB</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* General Settings */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <CogIcon className="h-5 w-5 mr-2 text-indigo-600" />
                            General Settings
                        </h3>
                    </div>
                    
                    <form onSubmit={submit} className="p-6 space-y-6">
                        <div>
                            <InputLabel htmlFor="app_name" value="Application Name" />
                            <TextInput
                                id="app_name"
                                name="app_name"
                                value={data.app_name}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('app_name', e.target.value)}
                            />
                            <InputError message={errors.app_name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="app_url" value="Application URL" />
                            <TextInput
                                id="app_url"
                                name="app_url"
                                type="url"
                                value={data.app_url}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('app_url', e.target.value)}
                            />
                            <InputError message={errors.app_url} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="admin_email" value="Admin Email" />
                            <TextInput
                                id="admin_email"
                                name="admin_email"
                                type="email"
                                value={data.admin_email}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('admin_email', e.target.value)}
                            />
                            <InputError message={errors.admin_email} className="mt-2" />
                        </div>

                        <div className="flex justify-end">
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Saving...' : 'Save Changes'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>

                {/* System Permissions */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <ShieldCheckIcon className="h-5 w-5 mr-2 text-emerald-600" />
                            System Permissions
                        </h3>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-900">
                                    Tenant Creation
                                </label>
                                <p className="text-sm text-gray-500">
                                    Allow creation of new tenants
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={data.tenant_creation_enabled}
                                    onChange={(e) => setData('tenant_creation_enabled', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-900">
                                    User Registration
                                </label>
                                <p className="text-sm text-gray-500">
                                    Allow new user registration
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={data.user_registration_enabled}
                                    onChange={(e) => setData('user_registration_enabled', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-900">
                                    Email Verification
                                </label>
                                <p className="text-sm text-gray-500">
                                    Require email verification for new users
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={data.email_verification_required}
                                    onChange={(e) => setData('email_verification_required', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-900">
                                    Maintenance Mode
                                </label>
                                <p className="text-sm text-gray-500">
                                    Put system in maintenance mode
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={data.maintenance_mode}
                                    onChange={(e) => setData('maintenance_mode', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Tenant Limits */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-600" />
                            Tenant Limits
                        </h3>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div>
                            <InputLabel htmlFor="max_tenants_per_admin" value="Max Tenants per Admin (0 = unlimited)" />
                            <TextInput
                                id="max_tenants_per_admin"
                                name="max_tenants_per_admin"
                                type="number"
                                min="0"
                                value={data.max_tenants_per_admin}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('max_tenants_per_admin', parseInt(e.target.value))}
                            />
                            <InputError message={errors.max_tenants_per_admin} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="default_tenant_storage_limit" value="Default Storage Limit (MB)" />
                            <TextInput
                                id="default_tenant_storage_limit"
                                name="default_tenant_storage_limit"
                                type="number"
                                min="1"
                                value={data.default_tenant_storage_limit}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('default_tenant_storage_limit', parseInt(e.target.value))}
                            />
                            <InputError message={errors.default_tenant_storage_limit} className="mt-2" />
                        </div>
                    </div>
                </div>

                {/* Enhanced Role Management */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <UsersIcon className="h-5 w-5 mr-2 text-purple-600" />
                            Roles & Permissions
                        </h3>
                        <div className="flex items-center space-x-3">
                            <SecondaryButton onClick={openCreatePermissionModal}>
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Create Permission
                            </SecondaryButton>
                            <PrimaryButton onClick={openCreateRoleModal}>
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Create Role
                            </PrimaryButton>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        {/* Role System Info */}
                        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <ShieldCheckIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-medium text-blue-900">Role System Overview</h3>
                                    <div className="mt-1 text-sm text-blue-700">
                                        <p><strong>Central Roles:</strong> System-wide access across all tenants</p>
                                        <p><strong>Tenant Templates:</strong> Blueprint roles that get copied to new tenants</p>
                                        <p><strong>Tenant-Specific:</strong> Individual role instances for specific tenants</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Role Type Tabs */}
                        <div className="mb-6">
                            <div className="border-b border-gray-200">
                                <nav className="-mb-px flex space-x-8">
                                    <button
                                        onClick={() => setActiveRoleTab('central')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeRoleTab === 'central'
                                                ? 'border-purple-500 text-purple-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        Central Admin Roles ({roles?.filter(r => r.type === 'central').length || 0})
                                    </button>
                                    <button
                                        onClick={() => setActiveRoleTab('template')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeRoleTab === 'template'
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        Tenant Role Templates ({roles?.filter(r => r.type === 'tenant' && !r.tenant_id).length || 0})
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveRoleTab('tenant');
                                            setSelectedTenantId('');
                                        }}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeRoleTab === 'tenant'
                                                ? 'border-green-500 text-green-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        Tenant-Specific Roles ({roles?.filter(r => r.type === 'tenant' && r.tenant_id).length || 0})
                                    </button>
                                </nav>
                            </div>
                        </div>

                        {/* Tenant Selector for Tenant-Specific Roles */}
                        {activeRoleTab === 'tenant' && (
                            <div className="mb-6">
                                <div className="flex items-center space-x-4">
                                    <label className="text-sm font-medium text-gray-700">Select Tenant:</label>
                                    <select
                                        value={selectedTenantId}
                                        onChange={(e) => setSelectedTenantId(e.target.value)}
                                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="">Choose a tenant to view roles...</option>
                                        {getTenantsWithRoles().map((tenant) => {
                                            const roleCount = roles?.filter(r => r.tenant_id === tenant.id).length || 0;
                                            return (
                                                <option key={tenant.id} value={tenant.id}>
                                                    {tenant.name} ({roleCount} roles)
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                {selectedTenantId && (
                                    <div className="mt-2 text-sm text-gray-600">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Viewing roles for: {getTenantsWithRoles().find(t => t.id === selectedTenantId)?.name || 'Selected Tenant'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Role List */}
                        <div className="space-y-4">
                            {getFilteredRoles().map((role) => (
                                <div key={role.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <h4 className="text-sm font-medium text-gray-900">
                                                        {role.display_name}
                                                    </h4>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        role.type === 'central' 
                                                            ? 'bg-purple-100 text-purple-800' 
                                                            : role.tenant_id 
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {role.type === 'central' ? 'Central' : role.tenant_id ? 'Tenant-Specific' : 'Template'}
                                                    </span>
                                                    {role.tenant_id && (
                                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                            {role.tenant?.name || 'Unknown Tenant'}
                                                        </span>
                                                    )}
                                                    <span className="text-sm text-gray-500">
                                                        {role.users_count || 0} users
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {role.description}
                                                </p>
                                                <div className="mt-2">
                                                    <div className="flex flex-wrap gap-1">
                                                        {(role.permissions || []).slice(0, 5).map((permission) => (
                                                            <span key={permission} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                                                {permission.replace(/_/g, ' ')}
                                                            </span>
                                                        ))}
                                                        {(role.permissions || []).length > 5 && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                                                +{(role.permissions || []).length - 5} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <SecondaryButton 
                                                    onClick={() => openEditRoleModal(role)}
                                                    className="text-sm"
                                                >
                                                    <PencilIcon className="h-4 w-4 mr-1" />
                                                    Edit
                                                </SecondaryButton>
                                                {!['central_admin', 'tenant_admin'].includes(role.name) && (
                                                    <DangerButton 
                                                        onClick={() => confirmDeleteRole(role)}
                                                        className="text-sm"
                                                    >
                                                        <TrashIcon className="h-4 w-4 mr-1" />
                                                        Delete
                                                    </DangerButton>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {getFilteredRoles().length === 0 && (
                                <div className="text-center py-8">
                                    <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        {activeRoleTab === 'tenant' && !selectedTenantId ? 'Select a tenant to view roles' : 'No roles found'}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {activeRoleTab === 'central' && 'No central admin roles configured.'}
                                        {activeRoleTab === 'template' && 'No tenant role templates available.'}
                                        {activeRoleTab === 'tenant' && !selectedTenantId && 'Choose a tenant from the dropdown above to view and manage their specific roles.'}
                                        {activeRoleTab === 'tenant' && selectedTenantId && 'No roles found for the selected tenant.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* System Status */}
            <div className="mt-8 bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <BellIcon className="h-5 w-5 mr-2 text-yellow-600" />
                        System Status
                    </h3>
                </div>
                
                <div className="p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="flex items-center p-4 bg-green-50 rounded-lg">
                            <div className="flex-shrink-0">
                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">Database</p>
                                <p className="text-sm text-green-600">Connected</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center p-4 bg-green-50 rounded-lg">
                            <div className="flex-shrink-0">
                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">Cache</p>
                                <p className="text-sm text-green-600">Active</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
                            <div className="flex-shrink-0">
                                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-yellow-800">Email</p>
                                <p className="text-sm text-yellow-600">Not Configured</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Role Create/Edit Modal */}
            <Modal show={showRoleModal} onClose={() => setShowRoleModal(false)} maxWidth="2xl">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {editingRole ? 'Edit Role' : 'Create New Role'}
                        </h2>
                        <button
                            onClick={() => setShowRoleModal(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={submitRole} className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                            <h3 className="text-sm font-medium text-gray-900">Basic Information</h3>
                            
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="role_name" value="Role Name" />
                                    <TextInput
                                        id="role_name"
                                        type="text"
                                        value={roleForm.data.name}
                                        className="mt-1 block w-full text-sm"
                                        onChange={(e) => roleForm.setData('name', e.target.value)}
                                        placeholder="e.g. content_manager"
                                    />
                                    <InputError message={roleForm.errors.name} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="role_display_name" value="Display Name" />
                                    <TextInput
                                        id="role_display_name"
                                        type="text"
                                        value={roleForm.data.display_name}
                                        className="mt-1 block w-full text-sm"
                                        onChange={(e) => roleForm.setData('display_name', e.target.value)}
                                        placeholder="e.g. Content Manager"
                                    />
                                    <InputError message={roleForm.errors.display_name} className="mt-1" />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="role_description" value="Description" />
                                <textarea
                                    id="role_description"
                                    value={roleForm.data.description}
                                    onChange={(e) => roleForm.setData('description', e.target.value)}
                                    className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows={2}
                                    placeholder="Describe what this role can do..."
                                />
                                <InputError message={roleForm.errors.description} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Role Type" />
                                <div className="mt-2 flex space-x-6">
                                    <div className="flex items-center">
                                        <input
                                            id="type_central"
                                            name="type"
                                            type="radio"
                                            value="central"
                                            checked={roleForm.data.type === 'central'}
                                            onChange={(e) => {
                                                roleForm.setData('type', e.target.value);
                                                if (e.target.value === 'central') {
                                                    roleForm.setData('tenant_id', '');
                                                }
                                            }}
                                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                                        />
                                        <label htmlFor="type_central" className="ml-2 block text-sm text-gray-700">
                                            Central <span className="text-gray-500">(System-wide)</span>
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            id="type_tenant"
                                            name="type"
                                            type="radio"
                                            value="tenant"
                                            checked={roleForm.data.type === 'tenant'}
                                            onChange={(e) => roleForm.setData('type', e.target.value)}
                                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                                        />
                                        <label htmlFor="type_tenant" className="ml-2 block text-sm text-gray-700">
                                            Tenant <span className="text-gray-500">(Tenant-specific)</span>
                                        </label>
                                    </div>
                                </div>
                                <InputError message={roleForm.errors.type} className="mt-1" />
                            </div>

                            {/* Tenant Selection - only show when type is tenant */}
                            {roleForm.data.type === 'tenant' && (
                                <div>
                                    <InputLabel htmlFor="tenant_id" value="Assign to Tenant" />
                                    <select
                                        id="tenant_id"
                                        value={roleForm.data.tenant_id}
                                        onChange={(e) => roleForm.setData('tenant_id', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                    >
                                        <option value="">Select a tenant (or leave blank for template)</option>
                                        {tenants && tenants.map((tenant) => (
                                            <option key={tenant.id} value={tenant.id}>
                                                {tenant.data?.name || tenant.id}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={roleForm.errors.tenant_id} className="mt-1" />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Leave blank to create a tenant role template that can be copied to new tenants.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Permissions Section */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-gray-900">Permissions</h3>
                                <div className="flex items-center space-x-2">
                                    <button
                                        type="button"
                                        onClick={openCreatePermissionModal}
                                        className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
                                    >
                                        <PlusIcon className="h-3 w-3 inline mr-1" />
                                        Create Custom
                                    </button>
                                    <span className="text-xs text-gray-500">
                                        {roleForm.data.permissions.length} selected
                                    </span>
                                </div>
                            </div>
                            
                            <div className="max-h-64 overflow-y-auto space-y-3">
                                {Object.entries(availablePermissions).map(([category, permissions]) => (
                                    <div key={category} className="bg-white border border-gray-200 rounded-md p-3">
                                        <h4 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                                            {category}
                                        </h4>
                                        <div className="space-y-1">
                                            {permissions.map((permission) => (
                                                <div key={permission.key} className="flex items-start space-x-2">
                                                    <input
                                                        id={`permission_${permission.key}`}
                                                        type="checkbox"
                                                        checked={roleForm.data.permissions.includes(permission.key)}
                                                        onChange={() => handlePermissionToggle(permission.key)}
                                                        className="mt-0.5 focus:ring-indigo-500 h-3 w-3 text-indigo-600 border-gray-300 rounded"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <label htmlFor={`permission_${permission.key}`} className="text-xs font-medium text-gray-700 cursor-pointer">
                                                            {permission.label}
                                                        </label>
                                                        <p className="text-xs text-gray-500 leading-tight">
                                                            {permission.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <InputError message={roleForm.errors.permissions} className="mt-2" />
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                            <SecondaryButton onClick={() => setShowRoleModal(false)} className="text-sm">
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton disabled={roleForm.processing} className="text-sm">
                                {roleForm.processing ? (
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Saving...
                                    </div>
                                ) : (
                                    editingRole ? 'Update Role' : 'Create Role'
                                )}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="sm">
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
                            <TrashIcon className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                Delete Role
                            </h3>
                        </div>
                    </div>
                    
                    <div className="mb-6">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to delete the role <span className="font-medium">"{roleToDelete?.display_name}"</span>? 
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            This action cannot be undone and will remove this role from all users.
                        </p>
                    </div>
                    
                    <div className="flex space-x-3">
                        <DangerButton 
                            onClick={deleteRole} 
                            disabled={roleForm.processing}
                            className="flex-1 justify-center text-sm"
                        >
                            {roleForm.processing ? (
                                <div className="flex items-center">
                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Deleting...
                                </div>
                            ) : (
                                'Delete Role'
                            )}
                        </DangerButton>
                        <SecondaryButton 
                            onClick={() => setShowDeleteModal(false)}
                            className="flex-1 justify-center text-sm"
                        >
                            Cancel
                        </SecondaryButton>
                    </div>
                </div>
            </Modal>

            {/* Permission Creation Modal */}
            <Modal show={showPermissionModal} onClose={() => setShowPermissionModal(false)} maxWidth="lg">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Create Custom Permission
                        </h2>
                        <button
                            onClick={() => setShowPermissionModal(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={submitPermission} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="permission_key" value="Permission Key" />
                            <TextInput
                                id="permission_key"
                                type="text"
                                value={permissionForm.data.key}
                                className="mt-1 block w-full text-sm"
                                onChange={(e) => permissionForm.setData('key', e.target.value)}
                                placeholder="e.g. manage_custom_feature"
                            />
                            <InputError message={permissionForm.errors.key} className="mt-1" />
                            <p className="text-xs text-gray-500 mt-1">
                                Use lowercase letters, numbers, and underscores only
                            </p>
                        </div>

                        <div>
                            <InputLabel htmlFor="permission_label" value="Display Label" />
                            <TextInput
                                id="permission_label"
                                type="text"
                                value={permissionForm.data.label}
                                className="mt-1 block w-full text-sm"
                                onChange={(e) => permissionForm.setData('label', e.target.value)}
                                placeholder="e.g. Manage Custom Feature"
                            />
                            <InputError message={permissionForm.errors.label} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="permission_description" value="Description" />
                            <textarea
                                id="permission_description"
                                value={permissionForm.data.description}
                                onChange={(e) => permissionForm.setData('description', e.target.value)}
                                className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                rows={2}
                                placeholder="Describe what this permission allows..."
                            />
                            <InputError message={permissionForm.errors.description} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="permission_category" value="Category" />
                            <select
                                id="permission_category"
                                value={permissionForm.data.category}
                                onChange={(e) => permissionForm.setData('category', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                            >
                                {Object.keys(availablePermissions).map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                                <option value="Custom">Custom</option>
                            </select>
                            <InputError message={permissionForm.errors.category} className="mt-1" />
                        </div>

                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                            <SecondaryButton onClick={() => setShowPermissionModal(false)} className="text-sm">
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton disabled={creatingCustomPermission} className="text-sm">
                                {creatingCustomPermission ? (
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Creating...
                                    </div>
                                ) : (
                                    'Create Permission'
                                )}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
} 