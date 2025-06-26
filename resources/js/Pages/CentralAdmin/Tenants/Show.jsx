import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    BuildingOfficeIcon, 
    UserIcon, 
    GlobeAltIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function Show({ tenant, users }) {
    const getStatusBadge = (status) => {
        const badges = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-yellow-100 text-yellow-800',
            suspended: 'bg-red-100 text-red-800'
        };
        return badges[status] || badges.active;
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Tenant: {tenant.data?.name || tenant.id}
                </h2>
            }
        >
            <Head title={`Tenant - ${tenant.data?.name || 'Unnamed Tenant'}`} />

            <div className="space-y-6">
                {/* Tenant Overview */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <BuildingOfficeIcon className="h-5 w-5 mr-2 text-indigo-600" />
                            Tenant Information
                        </h3>
                    </div>
                    <div className="px-6 py-4">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Name</dt>
                                <dd className="mt-1 text-sm text-gray-900">{tenant.data?.name || 'Unnamed Tenant'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(tenant.data?.status)}`}>
                                        {tenant.data?.status || 'active'}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Plan</dt>
                                <dd className="mt-1 text-sm text-gray-900">{tenant.data?.plan || 'basic'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Created</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {new Date(tenant.data?.created_at).toLocaleDateString()}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Tenant ID</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-mono">{tenant.data?.id}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Domain</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {tenant.data?.domains && tenant.data?.domains.length > 0 ? (
                                        <div className="flex items-center">
                                            <GlobeAltIcon className="h-4 w-4 mr-1 text-gray-400" />
                                            {tenant.data?.domains[0].domain}
                                        </div>
                                    ) : (
                                        'No domain configured'
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Users */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <UserIcon className="h-5 w-5 mr-2 text-emerald-600" />
                            Users ({users.total})
                        </h3>
                    </div>
                    <div className="overflow-hidden">
                        {users.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Roles
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Joined
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.data.map((user) => (
                                            <tr key={user.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {user.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {user.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {user.roles && user.roles.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.roles.map((role) => (
                                                                <span key={role.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    {role.display_name || role.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        'No roles assigned'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="px-6 py-12 text-center">
                                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    This tenant doesn't have any users yet.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                    <Link
                        href={route('central-admin.tenants.edit', tenant.data?.id)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Edit Tenant
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 