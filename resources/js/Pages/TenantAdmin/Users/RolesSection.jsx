import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import { 
    UsersIcon, 
    PlusIcon, 
    PencilIcon, 
    TrashIcon,
    XMarkIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

// Default permissions if none are provided
const defaultPermissions = {
    'User Management': [
        { key: 'manage_tenant_users', label: 'Manage Tenant Users', description: 'Manage users within tenants' },
        { key: 'invite_users', label: 'Invite Users', description: 'Send user invitations' },
        { key: 'view_user_profiles', label: 'View User Profiles', description: 'Access user profile information' },
    ],
    'Tenant Operations': [
        { key: 'manage_tenant_settings', label: 'Manage Tenant Settings', description: 'Configure tenant settings' },
        { key: 'manage_tenant_roles', label: 'Manage Tenant Roles', description: 'Manage roles within tenant' },
    ],
    'Content Management': [
        { key: 'view_dashboard', label: 'View Dashboard', description: 'Access dashboard interface' },
        { key: 'manage_own_profile', label: 'Manage Own Profile', description: 'Edit personal profile' },
    ],
};

export default function RolesSection({ roles = [], stats = {}, permissions = null }) {
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState(null);

    // Debug logging
    console.log('RolesSection props:', {
        roles,
        stats,
        permissions,
    });

    // Get all available roles (both tenant-specific and templates)
    const getAvailableRoles = () => {
        if (!roles) return [];
        
        // Debug logging for role filtering
        console.log('Role filtering:', {
            tenantId: stats.tenant_id,
            allRoles: roles,
            filteredRoles: roles.filter(role => 
                role.type === 'tenant' && (role.tenant_id === null || role.tenant_id === stats.tenant_id)
            )
        });
        
        return roles.filter(role => 
            role.type === 'tenant' && (role.tenant_id === null || role.tenant_id === stats.tenant_id)
        );
    };

    // Use provided permissions or fall back to default
    const availablePermissions = permissions || defaultPermissions;

    const roleForm = useForm({
        name: '',
        display_name: '',
        description: '',
        permissions: [],
    });

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
            roleForm.patch(route('tenant-admin.roles.update', editingRole.id), {
                onSuccess: () => {
                    setShowRoleModal(false);
                    setEditingRole(null);
                },
            });
        } else {
            roleForm.post(route('tenant-admin.roles.store'), {
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
            roleForm.delete(route('tenant-admin.roles.destroy', roleToDelete.id), {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setRoleToDelete(null);
                },
            });
        }
    };

    // In the permissions section of the modal, add a check before mapping
    const renderPermissions = () => {
        if (!availablePermissions || typeof availablePermissions !== 'object') {
            return (
                <div className="text-sm text-gray-500 p-4">
                    No permissions available
                </div>
            );
        }

        return Object.entries(availablePermissions).map(([category, permissions]) => (
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
                                className="mt-0.5 focus:ring-emerald-500 h-3 w-3 text-emerald-600 border-gray-300 rounded"
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
        ));
    };

    const availableRoles = getAvailableRoles();

    return (
        <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <UsersIcon className="h-5 w-5 mr-2 text-emerald-600" />
                    Roles & Permissions
                </h3>
                <PrimaryButton onClick={openCreateRoleModal}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Role
                </PrimaryButton>
            </div>
            
            <div className="p-6">
                {/* Role System Info */}
                <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <ShieldCheckIcon className="h-5 w-5 text-emerald-600 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-medium text-emerald-900">Role Management</h3>
                            <div className="mt-1 text-sm text-emerald-700">
                                <p>Create and manage roles specific to your organization. Each role can have different permissions to control access to features and functionality.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Role List */}
                <div className="space-y-4">
                    {availableRoles.map((role) => (
                        <div key={role.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                            <h4 className="text-sm font-medium text-gray-900">
                                                {role.display_name}
                                            </h4>
                                            {!role.tenant_id && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    Template
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
                                        {!['tenant_admin'].includes(role.name) && role.tenant_id && (
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
                    
                    {(!availableRoles || availableRoles.length === 0) && (
                        <div className="text-center py-8">
                            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No roles found</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by creating your first role.</p>
                        </div>
                    )}
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
                                    className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    rows={2}
                                    placeholder="Describe what this role can do..."
                                />
                                <InputError message={roleForm.errors.description} className="mt-1" />
                            </div>
                        </div>

                        {/* Permissions Section */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-gray-900">Permissions</h3>
                                <span className="text-xs text-gray-500">
                                    {roleForm.data.permissions.length} selected
                                </span>
                            </div>
                            
                            <div className="max-h-64 overflow-y-auto space-y-3">
                                {renderPermissions()}
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
        </div>
    );
} 