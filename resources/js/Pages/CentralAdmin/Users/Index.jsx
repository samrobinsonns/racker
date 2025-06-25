import { Head, Link, router, useForm } from '@inertiajs/react';
import CentralAdminLayout from '@/Layouts/CentralAdminLayout';
import Modal from '@/Components/Modal';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import { 
    PlusIcon, 
    PencilIcon, 
    TrashIcon, 
    MagnifyingGlassIcon,
    UsersIcon,
    UserIcon,
    EnvelopeIcon,
    BuildingOfficeIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function Index({ users, stats, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedUserType, setSelectedUserType] = useState(filters?.user_type || '');
    const [selectedTenant, setSelectedTenant] = useState(filters?.tenant_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');
    const [editingUser, setEditingUser] = useState(null);
    const [deletingUser, setDeletingUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Edit user form
    const { data: editData, setData: setEditData, put, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        name: '',
        email: '',
        tenant_id: '',
        is_central_admin: false,
        password: '',
        password_confirmation: '',
    });

    // Apply filters and search
    const applyFilters = () => {
        const params = {};
        if (searchTerm) params.search = searchTerm;
        if (selectedUserType) params.user_type = selectedUserType;
        if (selectedTenant) params.tenant_id = selectedTenant;
        if (selectedStatus) params.status = selectedStatus;
        
        router.get(route('central-admin.users.index'), params, {
            preserveState: true,
            replace: true,
        });
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== (filters?.search || '')) {
                applyFilters();
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Apply filters when select values change
    useEffect(() => {
        if (selectedUserType !== (filters?.user_type || '') || 
            selectedTenant !== (filters?.tenant_id || '') || 
            selectedStatus !== (filters?.status || '')) {
            applyFilters();
        }
    }, [selectedUserType, selectedTenant, selectedStatus]);

    const handleEditUser = (user) => {
        setEditingUser(user);
        setEditData({
            name: user.name,
            email: user.email,
            tenant_id: user.tenant_id || '',
            is_central_admin: user.is_central_admin,
            password: '',
            password_confirmation: '',
        });
        setShowEditModal(true);
    };

    const handleDeleteUser = (user) => {
        setDeletingUser(user);
        setShowDeleteModal(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        put(route('central-admin.users.update', editingUser.id), {
            onSuccess: () => {
                setShowEditModal(false);
                resetEdit();
                setEditingUser(null);
            },
        });
    };

    const confirmDelete = () => {
        router.delete(route('central-admin.users.destroy', deletingUser.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setDeletingUser(null);
            },
        });
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        resetEdit();
        setEditingUser(null);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeletingUser(null);
    };

    const getUserTypeBadge = (user) => {
        if (user.is_central_admin) {
            return 'bg-purple-100 text-purple-800';
        }
        return 'bg-blue-100 text-blue-800';
    };

    const getUserTypeLabel = (user) => {
        if (user.is_central_admin) {
            return 'Central Admin';
        }
        return 'Tenant User';
    };

    return (
        <CentralAdminLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold leading-tight text-gray-900">
                        User Management
                    </h2>
                    <Link
                        href={route('central-admin.users.create')}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 transition ease-in-out duration-150"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add User
                    </Link>
                </div>
            }
        >
            <Head title="User Management" />

            {/* Stats Overview */}
            <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <UsersIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats.total_users}</dd>
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
                                    <dt className="text-sm font-medium text-gray-500 truncate">Central Admins</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats.central_admins}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <BuildingOfficeIcon className="h-6 w-6 text-blue-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Tenant Users</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats.tenant_users}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <UserIcon className="h-6 w-6 text-green-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats.active_users}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 bg-white shadow rounded-lg p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <select 
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            value={selectedUserType}
                            onChange={(e) => setSelectedUserType(e.target.value)}
                        >
                            <option value="">All User Types</option>
                            <option value="central_admin">Central Admins</option>
                            <option value="tenant_user">Tenant Users</option>
                        </select>
                        <select 
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            value={selectedTenant}
                            onChange={(e) => setSelectedTenant(e.target.value)}
                        >
                            <option value="">All Tenants</option>
                            {stats.tenants.map((tenant) => (
                                <option key={tenant.id} value={tenant.id}>
                                    {tenant.name || 'Unnamed Tenant'}
                                </option>
                            ))}
                        </select>
                        <select 
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        All System Users
                        <span className="ml-2 text-sm font-normal text-gray-500">
                            ({users.total} total)
                        </span>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tenant
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.data.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                                    user.is_central_admin ? 'bg-purple-100' : 'bg-blue-100'
                                                }`}>
                                                    <span className={`text-sm font-medium ${
                                                        user.is_central_admin ? 'text-purple-700' : 'text-blue-700'
                                                    }`}>
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.name}
                                                </div>
                                                <div className="text-sm text-gray-500 flex items-center">
                                                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeBadge(user)}`}>
                                            {getUserTypeLabel(user)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {user.tenant ? (
                                            <div className="flex items-center">
                                                <BuildingOfficeIcon className="h-4 w-4 mr-1 text-gray-400" />
                                                {user.tenant.name || 'Unnamed Tenant'}
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            user.email_verified_at 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {user.email_verified_at ? 'Active' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => handleEditUser(user)}
                                                className="text-indigo-600 hover:text-indigo-900 p-1"
                                                title="Edit User"
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            {!user.is_central_admin && (
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="text-red-600 hover:text-red-900 p-1"
                                                    title="Delete User"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {users.data.length === 0 && (
                    <div className="text-center py-12">
                        <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                        <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {users.data.length > 0 && (
                <div className="mt-6 flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                        {users.prev_page_url && (
                            <Link
                                href={users.prev_page_url}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Previous
                            </Link>
                        )}
                        {users.next_page_url && (
                            <Link
                                href={users.next_page_url}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Next
                            </Link>
                        )}
                    </div>
                    
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{users.from}</span> to{' '}
                                <span className="font-medium">{users.to}</span> of{' '}
                                <span className="font-medium">{users.total}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                {users.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                            link.active
                                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                        } ${index === 0 ? 'rounded-l-md' : ''} ${
                                            index === users.links.length - 1 ? 'rounded-r-md' : ''
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            <Modal show={showEditModal} onClose={closeEditModal} maxWidth="2xl">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
                </div>
                
                <form onSubmit={submitEdit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="edit_name" value="Name" />
                            <TextInput
                                id="edit_name"
                                value={editData.name}
                                onChange={(e) => setEditData('name', e.target.value)}
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError message={editErrors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_email" value="Email" />
                            <TextInput
                                id="edit_email"
                                type="email"
                                value={editData.email}
                                onChange={(e) => setEditData('email', e.target.value)}
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError message={editErrors.email} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_tenant" value="Tenant" />
                            <select
                                id="edit_tenant"
                                value={editData.tenant_id}
                                onChange={(e) => setEditData('tenant_id', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="">No Tenant (Central Admin)</option>
                                {stats.tenants.map((tenant) => (
                                    <option key={tenant.id} value={tenant.id}>
                                        {tenant.name || 'Unnamed Tenant'}
                                    </option>
                                ))}
                            </select>
                            <InputError message={editErrors.tenant_id} className="mt-2" />
                        </div>

                        <div className="flex items-center">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={editData.is_central_admin}
                                    onChange={(e) => setEditData('is_central_admin', e.target.checked)}
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">Central Administrator</span>
                            </label>
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_password" value="New Password (optional)" />
                            <TextInput
                                id="edit_password"
                                type="password"
                                value={editData.password}
                                onChange={(e) => setEditData('password', e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={editErrors.password} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_password_confirmation" value="Confirm Password" />
                            <TextInput
                                id="edit_password_confirmation"
                                type="password"
                                value={editData.password_confirmation}
                                onChange={(e) => setEditData('password_confirmation', e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={editErrors.password_confirmation} className="mt-2" />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <SecondaryButton type="button" onClick={closeEditModal}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton disabled={editProcessing}>
                            {editProcessing ? 'Updating...' : 'Update User'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onClose={closeDeleteModal} maxWidth="md">
                <div className="px-6 py-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Delete User</h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Are you sure you want to delete <strong>{deletingUser?.name}</strong>? 
                        This action cannot be undone and will permanently remove the user and all associated data.
                    </p>
                    
                    <div className="flex justify-end space-x-3">
                        <SecondaryButton onClick={closeDeleteModal}>
                            Cancel
                        </SecondaryButton>
                        <DangerButton onClick={confirmDelete}>
                            Delete User
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </CentralAdminLayout>
    );
} 