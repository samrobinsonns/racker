import { Head } from '@inertiajs/react';
import CentralAdminLayout from '@/Layouts/CentralAdminLayout';
import { 
    BuildingOfficeIcon, 
    UsersIcon, 
    UserGroupIcon,
    ChartBarIcon,
    PlusIcon,
    EyeIcon 
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function Dashboard({ stats }) {
    const statCards = [
        {
            name: 'Total Tenants',
            stat: stats.total_tenants,
            icon: BuildingOfficeIcon,
            change: '+12%',
            changeType: 'increase',
            color: 'indigo',
        },
        {
            name: 'Total Users',
            stat: stats.total_users,
            icon: UsersIcon,
            change: '+8%',
            changeType: 'increase',
            color: 'emerald',
        },
        {
            name: 'Central Admins',
            stat: stats.central_admins,
            icon: UserGroupIcon,
            change: '0%',
            changeType: 'neutral',
            color: 'purple',
        },
        {
            name: 'Tenant Users',
            stat: stats.tenant_users,
            icon: ChartBarIcon,
            change: '+15%',
            changeType: 'increase',
            color: 'blue',
        },
    ];

    const getStatColor = (color) => {
        const colors = {
            indigo: 'bg-indigo-500',
            emerald: 'bg-emerald-500',
            purple: 'bg-purple-500',
            blue: 'bg-blue-500',
        };
        return colors[color] || 'bg-gray-500';
    };

    return (
        <CentralAdminLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold leading-tight text-gray-900">
                        Central Admin Dashboard
                    </h2>
                    <Link
                        href={route('central-admin.tenants.create')}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 transition ease-in-out duration-150"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Tenant
                    </Link>
                </div>
            }
        >
            <Head title="Central Admin Dashboard" />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card) => (
                    <div
                        key={card.name}
                        className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow hover:shadow-lg transition-shadow duration-200"
                    >
                        <dt>
                            <div className={`absolute rounded-md p-3 ${getStatColor(card.color)}`}>
                                <card.icon className="h-6 w-6 text-white" aria-hidden="true" />
                            </div>
                            <p className="ml-16 truncate text-sm font-medium text-gray-500">{card.name}</p>
                        </dt>
                        <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                            <p className="text-2xl font-semibold text-gray-900">{card.stat}</p>
                            <p
                                className={`ml-2 flex items-baseline text-sm font-semibold ${
                                    card.changeType === 'increase'
                                        ? 'text-green-600'
                                        : card.changeType === 'decrease'
                                        ? 'text-red-600'
                                        : 'text-gray-600'
                                }`}
                            >
                                {card.change}
                            </p>
                            <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                                <div className="text-sm">
                                    <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                                        View all
                                    </a>
                                </div>
                            </div>
                        </dd>
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Recent Tenants */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Tenants</h3>
                        <div className="flow-root">
                            <ul className="-my-3 divide-y divide-gray-200">
                                {stats.recent_tenants.map((tenant) => (
                                    <li key={tenant.id} className="py-3 flex justify-between items-center">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {tenant.data?.name || 'Unnamed Tenant'}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {tenant.users_count} users • Created {new Date(tenant.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Link
                                            href={route('central-admin.tenants.show', tenant.id)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            <EyeIcon className="h-5 w-5" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="mt-6">
                            <Link
                                href={route('central-admin.tenants.index')}
                                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                View all tenants
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Recent Users */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Users</h3>
                        <div className="flow-root">
                            <ul className="-my-3 divide-y divide-gray-200">
                                {stats.recent_users.map((user) => (
                                    <li key={user.id} className="py-3 flex justify-between items-center">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {user.tenant?.data?.name || 'Central Admin'} • {user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {user.is_central_admin && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    Admin
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-500">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="mt-6">
                            <Link
                                href={route('central-admin.users.index')}
                                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                View all users
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Link
                                href={route('central-admin.tenants.create')}
                                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors duration-200"
                            >
                                <div>
                                    <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100">
                                        <PlusIcon className="h-6 w-6" />
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-lg font-medium">
                                        <span className="absolute inset-0" aria-hidden="true" />
                                        Create Tenant
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Add a new tenant organization to the system.
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href={route('central-admin.tenants.index')}
                                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-emerald-500 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors duration-200"
                            >
                                <div>
                                    <span className="rounded-lg inline-flex p-3 bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100">
                                        <BuildingOfficeIcon className="h-6 w-6" />
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-lg font-medium">
                                        <span className="absolute inset-0" aria-hidden="true" />
                                        Manage Tenants
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        View and manage all tenant organizations.
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href={route('central-admin.users.index')}
                                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-purple-500 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors duration-200"
                            >
                                <div>
                                    <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-600 group-hover:bg-purple-100">
                                        <UsersIcon className="h-6 w-6" />
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-lg font-medium">
                                        <span className="absolute inset-0" aria-hidden="true" />
                                        Manage Users
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        View and manage all system users.
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href={route('central-admin.settings')}
                                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors duration-200"
                            >
                                <div>
                                    <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                                        <ChartBarIcon className="h-6 w-6" />
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-lg font-medium">
                                        <span className="absolute inset-0" aria-hidden="true" />
                                        System Settings
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Configure system-wide settings and roles.
                                    </p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </CentralAdminLayout>
    );
} 