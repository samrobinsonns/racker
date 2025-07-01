import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PermissionGate from '@/Components/PermissionGate';
import { usePermissions } from '@/Hooks/usePermissions';
import {
    UsersIcon,
    UserGroupIcon,
    ChartBarIcon,
    PlusIcon,
    ClockIcon,
    CheckCircleIcon,
    UserPlusIcon,
    ShieldCheckIcon,
    BuildingOffice2Icon,
    Cog6ToothIcon,
    EyeIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

export default function TenantAdminDashboard() {
    const { props } = usePage();
    const { auth, stats } = props;
    const { user } = auth;
    const { hasPermission } = usePermissions();

    // Helper function for stat colors
    const getStatColor = (color) => {
        const colors = {
            emerald: 'bg-emerald-500',
            blue: 'bg-blue-500',
            purple: 'bg-purple-500',
            indigo: 'bg-indigo-500',
            orange: 'bg-orange-500'
        };
        return colors[color] || 'bg-gray-500';
    };

    const statCards = [
        {
            name: 'Total Users',
            stat: stats?.total_users || 0,
            icon: UsersIcon,
            change: stats?.user_growth?.growth_percentage ? `${stats.user_growth.growth_percentage > 0 ? '+' : ''}${stats.user_growth.growth_percentage}%` : '0%',
            changeType: stats?.user_growth?.trend === 'up' ? 'increase' : stats?.user_growth?.trend === 'down' ? 'decrease' : 'neutral',
            color: 'emerald',
        },
        {
            name: 'Active Users',
            stat: stats?.active_users || 0,
            icon: CheckCircleIcon,
            change: `${Math.round(((stats?.active_users || 0) / (stats?.total_users || 1)) * 100)}%`,
            changeType: 'neutral',
            color: 'blue',
        },
        {
            name: 'New This Month',
            stat: stats?.user_growth?.this_month || 0,
            icon: UserPlusIcon,
            change: stats?.user_growth?.growth_percentage ? `${stats.user_growth.growth_percentage > 0 ? '+' : ''}${stats.user_growth.growth_percentage}%` : '0%',
            changeType: stats?.user_growth?.trend === 'up' ? 'increase' : stats?.user_growth?.trend === 'down' ? 'decrease' : 'neutral',
            color: 'purple',
        },
        {
            name: 'Active Roles',
            stat: stats?.role_distribution ? stats.role_distribution.length : 0,
            icon: ShieldCheckIcon,
            change: 'Configured',
            changeType: 'neutral',
            color: 'indigo',
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Admin Dashboard" />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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
                                    <span className="font-medium text-emerald-600">
                                        {card.changeType === 'increase' ? 'Growing' : card.changeType === 'decrease' ? 'Declining' : 'Stable'}
                                    </span>
                                </div>
                            </div>
                        </dd>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
                {/* Recent Activity - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                                    <ClockIcon className="h-5 w-5 mr-2 text-emerald-600" />
                                    Recent Administrative Activity
                                </h3>
                                <span className="text-sm text-gray-500">Last 7 days</span>
                            </div>
                            
                            {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                                <div className="flow-root">
                                    <ul className="-my-3 divide-y divide-gray-200">
                                        {stats.recent_activity.map((activity, index) => (
                                            <li key={index} className="py-3">
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0">
                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                                            activity.color === 'green' ? 'bg-green-100' :
                                                            activity.color === 'blue' ? 'bg-blue-100' :
                                                            activity.color === 'yellow' ? 'bg-yellow-100' :
                                                            'bg-gray-100'
                                                        }`}>
                                                            {activity.icon === 'user-plus' && (
                                                                <UserPlusIcon className={`h-4 w-4 ${
                                                                    activity.color === 'green' ? 'text-green-600' :
                                                                    activity.color === 'blue' ? 'text-blue-600' :
                                                                    activity.color === 'yellow' ? 'text-yellow-600' :
                                                                    'text-gray-600'
                                                                }`} />
                                                            )}
                                                            {activity.icon === 'check-circle' && (
                                                                <CheckCircleIcon className={`h-4 w-4 ${
                                                                    activity.color === 'green' ? 'text-green-600' :
                                                                    activity.color === 'blue' ? 'text-blue-600' :
                                                                    activity.color === 'yellow' ? 'text-yellow-600' :
                                                                    'text-gray-600'
                                                                }`} />
                                                            )}
                                                            {activity.icon === 'shield-check' && (
                                                                <ShieldCheckIcon className={`h-4 w-4 ${
                                                                    activity.color === 'green' ? 'text-green-600' :
                                                                    activity.color === 'blue' ? 'text-blue-600' :
                                                                    activity.color === 'yellow' ? 'text-yellow-600' :
                                                                    'text-gray-600'
                                                                }`} />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="ml-3 flex-1 min-w-0">
                                                        <p className="text-sm text-gray-900">{activity.description}</p>
                                                        <div className="flex items-center mt-1 space-x-2">
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(activity.date).toLocaleDateString()} at {new Date(activity.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </span>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                                activity.type === 'user_created' ? 'bg-green-100 text-green-800' :
                                                                activity.type === 'email_verified' ? 'bg-blue-100 text-blue-800' :
                                                                activity.type === 'role_assigned' ? 'bg-purple-100 text-purple-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {activity.type.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No recent administrative activity</p>
                                    <p className="text-sm text-gray-400 mt-1">User management activities will appear here</p>
                                </div>
                            )}

                            <div className="mt-6">
                                <PermissionGate permission="manage_tenant_users">
                                    <Link
                                        href={route('tenant-admin.users.index')}
                                        className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <EyeIcon className="h-4 w-4 mr-2" />
                                        View all users
                                    </Link>
                                </PermissionGate>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Content */}
                <div className="space-y-6">
                    {/* Tenant Overview */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                                <BuildingOffice2Icon className="h-5 w-5 mr-2 text-emerald-600" />
                                Organization Overview
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Organization</dt>
                                    <dd className="text-sm text-gray-900">{stats?.tenant_name || 'Unknown'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Plan</dt>
                                    <dd className="text-sm text-gray-900">{stats?.tenant_plan || 'Basic'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                                    <dd>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Active
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">User Growth</dt>
                                    <dd className="flex items-center text-sm text-gray-900">
                                        <ArrowTrendingUpIcon className="h-4 w-4 mr-1 text-green-500" />
                                        {stats?.user_growth?.growth_percentage || 0}% this month
                                    </dd>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Administrative Actions */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Administrative Actions</h3>
                            <div className="space-y-3">
                                <PermissionGate permission="manage_tenant_users">
                                    <Link
                                        href={route('tenant-admin.users.create')}
                                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-emerald-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-emerald-700 transition ease-in-out duration-150"
                                    >
                                        <PlusIcon className="h-4 w-4 mr-2" />
                                        Add User
                                    </Link>
                                </PermissionGate>
                                
                                <PermissionGate permission="manage_tenant_users">
                                    <Link
                                        href={route('tenant-admin.users.index')}
                                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest hover:bg-gray-50 transition ease-in-out duration-150"
                                    >
                                        <UsersIcon className="h-4 w-4 mr-2" />
                                        Manage Users
                                    </Link>
                                </PermissionGate>

                                <PermissionGate permission="manage_tenant_settings">
                                    <Link
                                        href={route('tenant-admin.settings')}
                                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest hover:bg-gray-50 transition ease-in-out duration-150"
                                    >
                                        <Cog6ToothIcon className="h-4 w-4 mr-2" />
                                        Settings
                                    </Link>
                                </PermissionGate>
                            </div>
                        </div>
                    </div>

                    {/* Role Distribution */}
                    {stats?.role_distribution && stats.role_distribution.length > 0 && (
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                                    <UserGroupIcon className="h-5 w-5 mr-2 text-emerald-600" />
                                    Role Distribution
                                </h3>
                                <div className="space-y-3">
                                    {stats.role_distribution.map((role, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">{role.display_name || role.name}</span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                {role.user_count || 0} users
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 