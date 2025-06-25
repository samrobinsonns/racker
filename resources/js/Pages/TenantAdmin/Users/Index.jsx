import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    PlusIcon, 
    PencilIcon, 
    TrashIcon, 
    MagnifyingGlassIcon,
    UsersIcon,
    UserIcon,
    EnvelopeIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function Index({ users, availableRoles, tenantId }) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleDelete = (user) => {
        if (confirm(`Are you sure you want to delete "${user.name}"? This action cannot be undone.`)) {
            router.delete(route('tenant-admin.users.destroy', user.id));
        }
    };

    const getRoleBadgeColor = (roleName) => {
        const colors = {
            tenant_admin: 'bg-emerald-100 text-emerald-800',
            tenant_manager: 'bg-blue-100 text-blue-800',
            tenant_user: 'bg-gray-100 text-gray-800',
        };
        return colors[roleName] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold leading-tight text-gray-900">
                        User Management
                    </h2>
                    <Link
                        href={route('tenant-admin.users.create')}
                        className="inline-flex items-center px-4 py-2 bg-emerald-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-emerald-700 transition ease-in-out duration-150"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add User
                    </Link>
                </div>
            }
        >
            <Head title="User Management" />

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
                                placeholder="Search users..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500">
                            <option>All Roles</option>
                            {availableRoles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.display_name}
                                </option>
                            ))}
                        </select>
                        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500">
                            <option>All Status</option>
                            <option>Active</option>
                            <option>Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        Organization Users
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
                                    Role
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
                                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-emerald-700">
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
                                        {user.roles && user.roles.length > 0 ? (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.roles[0].name)}`}>
                                                {user.roles[0].display_name}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-500">No role assigned</span>
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
                                            <Link
                                                href={route('tenant-admin.users.edit', user.id)}
                                                className="text-emerald-600 hover:text-emerald-900 p-1"
                                                title="Edit User"
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                className="text-red-600 hover:text-red-900 p-1"
                                                title="Delete User"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
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
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by adding your first user.</p>
                        <div className="mt-6">
                            <Link
                                href={route('tenant-admin.users.create')}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
                            >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Add User
                            </Link>
                        </div>
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
                                                ? 'z-10 bg-emerald-50 border-emerald-500 text-emerald-600'
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

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <UsersIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                                    <dd className="text-lg font-medium text-gray-900">{users.total}</dd>
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
                                    <dd className="text-lg font-medium text-gray-900">
                                        {users.data.filter(user => user.email_verified_at).length}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <PlusIcon className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">New This Month</dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {users.data.filter(user => {
                                            const created = new Date(user.created_at);
                                            const now = new Date();
                                            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                                        }).length}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 