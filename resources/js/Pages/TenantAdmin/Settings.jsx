import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import Modal from '@/Components/Modal';
import { 
    BuildingOfficeIcon, 
    CogIcon, 
    ShieldCheckIcon, 
    UsersIcon, 
    KeyIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function Settings({ tenant, roles, tenantId }) {
    const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);

    // Tenant Information Form
    const { data: tenantData, setData: setTenantData, put: updateTenant, processing: updatingTenant, errors: tenantErrors } = useForm({
        name: tenant?.name || '',
        description: tenant?.description || '',
    });

    // Role Management Form
    const { data: roleData, setData: setRoleData, post: createRole, put: updateRole, delete: deleteRole, processing: roleProcessing, errors: roleErrors, reset: resetRole } = useForm({
        name: '',
        display_name: '',
        description: '',
    });

    const handleTenantUpdate = (e) => {
        e.preventDefault();
        updateTenant(route('tenant-admin.settings.update-tenant'), {
            onSuccess: () => {
                // Handle success
            }
        });
    };

    const handleCreateRole = (e) => {
        e.preventDefault();
        createRole(route('tenant-admin.settings.create-role'), {
            onSuccess: () => {
                setShowCreateRoleModal(false);
                resetRole();
            }
        });
    };

    const handleEditRole = (role) => {
        setEditingRole(role.id);
        setRoleData({
            name: role.name,
            display_name: role.display_name,
            description: role.description || '',
        });
    };

    const handleUpdateRole = (e) => {
        e.preventDefault();
        updateRole(route('tenant-admin.settings.update-role', editingRole), {
            onSuccess: () => {
                setEditingRole(null);
                resetRole();
            }
        });
    };

    const handleDeleteRole = (roleId) => {
        if (confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
            deleteRole(route('tenant-admin.settings.delete-role', roleId));
        }
    };

    const openCreateRoleModal = () => {
        resetRole();
        setShowCreateRoleModal(true);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-4">
                    <CogIcon className="h-6 w-6 text-emerald-600" />
                    <h2 className="text-2xl font-bold leading-tight text-gray-900">
                        Settings
                    </h2>
                </div>
            }
        >
            <Head title="Settings" />

            <div className="space-y-6">
                {/* Organization Information */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                            <BuildingOfficeIcon className="h-5 w-5 text-emerald-600" />
                            <h3 className="text-lg font-medium text-gray-900">
                                Organization Information
                            </h3>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage your organization's basic information and settings.
                        </p>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel value="Organization Name" />
                                <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                                    {tenant?.name || 'Unnamed Organization'}
                                </div>
                            </div>

                            <div>
                                <InputLabel value="Organization ID" />
                                <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm font-mono">
                                    {tenantId}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">This ID cannot be changed</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <InputLabel value="Created" />
                            <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                                {tenant?.created_at ? new Date(tenant.created_at).toLocaleDateString() : 'Unknown'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Role Management */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <ShieldCheckIcon className="h-5 w-5 text-emerald-600" />
                                <h3 className="text-lg font-medium text-gray-900">
                                    Role Management
                                </h3>
                            </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                            Current roles defined for your organization.
                        </p>
                    </div>

                    <div className="p-6">
                        <div className="grid gap-4">
                            {roles && roles.length > 0 ? roles.map((role) => (
                                <div key={role.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900">{role.display_name}</h4>
                                            <p className="text-sm text-gray-500">{role.name}</p>
                                            {role.description && (
                                                <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8">
                                    <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h4 className="mt-2 text-sm font-medium text-gray-900">No roles defined</h4>
                                    <p className="mt-1 text-sm text-gray-500">Contact your system administrator to set up roles.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* User Statistics */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                            <UsersIcon className="h-5 w-5 text-emerald-600" />
                            <h3 className="text-lg font-medium text-gray-900">
                                User Statistics
                            </h3>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                            Overview of users in your organization.
                        </p>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-emerald-600">
                                    {roles ? roles.length : 0}
                                </div>
                                <div className="text-sm text-gray-500">Active Roles</div>
                            </div>
                            
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    -
                                </div>
                                <div className="text-sm text-gray-500">Total Users</div>
                            </div>
                            
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    -
                                </div>
                                <div className="text-sm text-gray-500">Active Sessions</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                            <KeyIcon className="h-5 w-5 text-emerald-600" />
                            <h3 className="text-lg font-medium text-gray-900">
                                Security Settings
                            </h3>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                            Security policies for your organization.
                        </p>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Email Verification Required</h4>
                                    <p className="text-sm text-gray-500">Users must verify their email before accessing the system</p>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Enabled
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Password Requirements</h4>
                                    <p className="text-sm text-gray-500">Minimum 8 characters with mixed case and numbers</p>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Active
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                                    <p className="text-sm text-gray-500">Enhanced security with 2FA (Coming Soon)</p>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Planned
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Session Management</h4>
                                    <p className="text-sm text-gray-500">Automatic logout after 2 hours of inactivity</p>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Role Modal */}
            <Modal show={showCreateRoleModal} onClose={() => setShowCreateRoleModal(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Create New Role
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                        Define a new role for users in your organization.
                    </p>

                    <form onSubmit={handleCreateRole} className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="role_name" value="Role Name" />
                                <TextInput
                                    id="role_name"
                                    value={roleData.name}
                                    onChange={(e) => setRoleData('name', e.target.value)}
                                    className="mt-1 block w-full"
                                    isFocused
                                    placeholder="e.g., manager"
                                />
                                <InputError message={roleErrors.name} className="mt-2" />
                                <p className="mt-1 text-xs text-gray-500">Lowercase, no spaces (used internally)</p>
                            </div>

                            <div>
                                <InputLabel htmlFor="role_display_name" value="Display Name" />
                                <TextInput
                                    id="role_display_name"
                                    value={roleData.display_name}
                                    onChange={(e) => setRoleData('display_name', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="e.g., Manager"
                                />
                                <InputError message={roleErrors.display_name} className="mt-2" />
                                <p className="mt-1 text-xs text-gray-500">Human-friendly name</p>
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="role_description" value="Description" />
                            <textarea
                                id="role_description"
                                value={roleData.description}
                                onChange={(e) => setRoleData('description', e.target.value)}
                                rows={3}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                placeholder="Describe what this role can do..."
                            />
                            <InputError message={roleErrors.description} className="mt-2" />
                        </div>

                        <div className="flex items-center justify-end mt-6 space-x-3">
                            <SecondaryButton onClick={() => setShowCreateRoleModal(false)}>
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton disabled={roleProcessing} className="bg-emerald-600 hover:bg-emerald-700">
                                {roleProcessing ? 'Creating...' : 'Create Role'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
} 