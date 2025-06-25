import { Head } from '@inertiajs/react';
import TenantAdminLayout from '@/Layouts/TenantAdminLayout';
import { 
    UsersIcon, 
    CheckCircleIcon,
    UserPlusIcon,
    ChartBarIcon,
    PlusIcon,
    EyeIcon,
    ClockIcon,
    BellIcon,
    ShieldCheckIcon,
    EnvelopeIcon 
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function Dashboard({ stats, tenantId }) {
    const statCards = [
        {
            name: 'Total Users',
            stat: stats.total_users,
            icon: UsersIcon,
            change: stats.user_growth?.growth_percentage ? `${stats.user_growth.growth_percentage > 0 ? '+' : ''}${stats.user_growth.growth_percentage}%` : '0%',
            changeType: stats.user_growth?.trend === 'up' ? 'increase' : stats.user_growth?.trend === 'down' ? 'decrease' : 'neutral',
            color: 'emerald',
        },
        {
            name: 'Active Users',
            stat: stats.active_users,
            icon: CheckCircleIcon,
            change: `${Math.round((stats.active_users / stats.total_users) * 100) || 0}%`,
            changeType: 'neutral',
            color: 'blue',
        },
        {
            name: 'This Month',
            stat: stats.user_growth?.this_month || 0,
            icon: UserPlusIcon,
            change: stats.user_growth?.growth_percentage ? `${stats.user_growth.growth_percentage > 0 ? '+' : ''}${stats.user_growth.growth_percentage}%` : '0%',
            changeType: stats.user_growth?.trend === 'up' ? 'increase' : stats.user_growth?.trend === 'down' ? 'decrease' : 'neutral',
            color: 'purple',
        },
        {
            name: 'Roles',
            stat: stats.role_distribution ? stats.role_distribution.length : 0,
            icon: ChartBarIcon,
            change: 'Active',
            changeType: 'neutral',
            color: 'indigo',
        },
    ];

    const getStatColor = (color) => {
        const colors = {
            emerald: 'bg-emerald-500',
            blue: 'bg-blue-500',
            purple: 'bg-purple-500',
            indigo: 'bg-indigo-500',
        };
        return colors[color] || 'bg-gray-500';
    };

    return (
        <TenantAdminLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold leading-tight text-gray-900">
                            Tenant Dashboard
                        </h2>
                        <p className="text-sm text-gray-600">
                            Welcome to {stats.tenant_name}
                        </p>
                    </div>
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
            <Head title="Tenant Admin Dashboard" />

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
                                    <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500">
                                        View details
                                    </a>
                                </div>
                            </div>
                        </dd>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Recent Activity - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                                    <ClockIcon className="h-5 w-5 mr-2 text-emerald-600" />
                                    Recent Activity
                                </h3>
                                <span className="text-sm text-gray-500">Last 7 days</span>
                            </div>
                            
                            {stats.recent_activity && stats.recent_activity.length > 0 ? (
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
                                    <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h4 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h4>
                                    <p className="mt-1 text-sm text-gray-500">Activity from the last 7 days will appear here.</p>
                                </div>
                            )}
                            
                            <div className="mt-6">
                                <Link
                                    href={route('tenant-admin.users.index')}
                                    className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    View all users
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Takes 1 column */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <Link
                                    href={route('tenant-admin.users.create')}
                                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition-colors duration-200"
                                >
                                    <UserPlusIcon className="h-5 w-5 mr-2" />
                                    Add New User
                                </Link>
                                
                                <Link
                                    href={route('tenant-admin.users.index')}
                                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                                >
                                    <UsersIcon className="h-5 w-5 mr-2" />
                                    Manage Users
                                </Link>

                                <Link
                                    href={route('tenant-admin.settings')}
                                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                                >
                                    <ChartBarIcon className="h-5 w-5 mr-2" />
                                    Settings
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Recent Users */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Users</h3>
                            <div className="space-y-3">
                                {stats.recent_users && stats.recent_users.length > 0 ? (
                                    stats.recent_users.slice(0, 3).map((user) => (
                                        <div key={user.id} className="flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-emerald-700">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No users yet</p>
                                )}
                                <div className="pt-2 border-t border-gray-200">
                                    <Link
                                        href={route('tenant-admin.users.index')}
                                        className="text-sm text-emerald-600 hover:text-emerald-500"
                                    >
                                        View all →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Role Distribution */}
                    {stats.role_distribution && stats.role_distribution.length > 0 && (
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Role Distribution</h3>
                                <div className="space-y-3">
                                    {stats.role_distribution.map((role, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <div className={`h-3 w-3 rounded-full ${
                                                    role.color === 'emerald' ? 'bg-emerald-500' :
                                                    role.color === 'blue' ? 'bg-blue-500' :
                                                    role.color === 'gray' ? 'bg-gray-500' :
                                                    'bg-purple-500'
                                                }`}></div>
                                                <span className="text-sm text-gray-900">{role.name}</span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-600">{role.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </TenantAdminLayout>
    );
} 