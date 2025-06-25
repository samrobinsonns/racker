import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CentralAdminLayout from '@/Layouts/CentralAdminLayout';
import TenantAdminLayout from '@/Layouts/TenantAdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { usePermissions } from '@/Hooks/usePermissions';
import PermissionGate from '@/Components/PermissionGate';
import { 
    BuildingOfficeIcon, 
    UsersIcon, 
    UserGroupIcon,
    CheckCircleIcon,
    UserPlusIcon,
    ChartBarIcon,
    PlusIcon,
    EyeIcon,
    ClockIcon,
    BellIcon,
    ShieldCheckIcon,
    EnvelopeIcon,
    BuildingOffice2Icon,
    Cog6ToothIcon,
    UserIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
    const user = usePage().props.auth.user;
    const { stats, tenantId, layoutType } = usePage().props;
    const { hasPermission, getAdminLevel } = usePermissions();

    // Determine user type
    const isCentralAdmin = user.is_central_admin;
    const isTenantAdmin = user.roles?.some(role => role.name === 'tenant_admin') || false;
    const isTenantUser = user.tenant_id && !isCentralAdmin && !isTenantAdmin;
    const adminLevel = getAdminLevel();

    // Determine which layout to use
    const getLayoutComponent = () => {
        const actualLayoutType = layoutType || user.layout_type;
        
        switch (actualLayoutType) {
            case 'central_admin':
                return CentralAdminLayout;
            case 'tenant_admin':
                return TenantAdminLayout;
            case 'tenant_user':
                return TenantAdminLayout; // Use the same tenant layout but with different navigation
            default:
                return AuthenticatedLayout;
        }
    };

    const LayoutComponent = getLayoutComponent();

    // Helper function for stat colors
    const getStatColor = (color) => {
        const colors = {
            indigo: 'bg-indigo-500',
            emerald: 'bg-emerald-500',
            purple: 'bg-purple-500',
            blue: 'bg-blue-500',
        };
        return colors[color] || 'bg-gray-500';
    };

    // Generate header based on user type
    const getHeader = () => {
        if (isCentralAdmin) {
            return (
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold leading-tight text-gray-900">
                        Central Admin Dashboard
                    </h2>
                    <PermissionGate permission="create_tenants">
                        <Link
                            href={route('central-admin.tenants.create')}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 transition ease-in-out duration-150"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Tenant
                        </Link>
                    </PermissionGate>
                </div>
            );
        } else if (isTenantAdmin) {
            return (
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold leading-tight text-gray-900">
                            Tenant Dashboard
                        </h2>
                        <p className="text-sm text-gray-600">
                            Welcome to {stats?.tenant_name || 'your organization'}
                        </p>
                    </div>
                    <PermissionGate permission="manage_tenant_users">
                        <Link
                            href={route('tenant-admin.users.create')}
                            className="inline-flex items-center px-4 py-2 bg-emerald-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-emerald-700 transition ease-in-out duration-150"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add User
                        </Link>
                    </PermissionGate>
                </div>
            );
        } else if (isTenantUser) {
            return (
                <div>
                    <h2 className="text-2xl font-bold leading-tight text-gray-900">
                        My Workspace
                    </h2>
                    <p className="text-sm text-gray-600">
                        {stats?.tenant_name || 'Your Organization'}
                    </p>
                </div>
            );
        } else {
            return (
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            );
        }
    };

    // Render Central Admin Dashboard Content
    const renderCentralAdminDashboard = () => {
        const statCards = [
            {
                name: 'Total Tenants',
                stat: stats?.total_tenants || 0,
                icon: BuildingOfficeIcon,
                change: '+12%',
                changeType: 'increase',
                color: 'indigo',
            },
            {
                name: 'Total Users',
                stat: stats?.total_users || 0,
                icon: UsersIcon,
                change: '+8%',
                changeType: 'increase',
                color: 'emerald',
            },
            {
                name: 'Central Admins',
                stat: stats?.central_admins || 0,
                icon: UserGroupIcon,
                change: '0%',
                changeType: 'neutral',
                color: 'purple',
            },
            {
                name: 'Tenant Users',
                stat: stats?.tenant_users || 0,
                icon: ChartBarIcon,
                change: '+15%',
                changeType: 'increase',
                color: 'blue',
            },
        ];

        return (
            <>
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
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
                    {/* Recent Tenants */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Tenants</h3>
                            <div className="flow-root">
                                <ul className="-my-3 divide-y divide-gray-200">
                                    {stats?.recent_tenants?.map((tenant) => (
                                        <li key={tenant.id} className="py-3 flex justify-between items-center">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {tenant.name || 'Unnamed Tenant'}
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
                                    )) || []}
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
                                    {stats?.recent_users?.map((user) => (
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
                                                        {user.tenant?.name || 'Central Admin'} • {user.email}
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
                                    )) || []}
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
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Link
                                href={route('central-admin.tenants.create')}
                                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors duration-200"
                            >
                                <div>
                                    <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                                        <PlusIcon className="h-6 w-6" />
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-lg font-medium">
                                        <span className="absolute inset-0" aria-hidden="true" />
                                        Add Tenant
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Create a new tenant organization
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href={route('central-admin.users.index')}
                                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-emerald-500 border border-gray-200 rounded-lg hover:border-emerald-300 transition-colors duration-200"
                            >
                                <div>
                                    <span className="rounded-lg inline-flex p-3 bg-emerald-50 text-emerald-700 ring-4 ring-white">
                                        <UsersIcon className="h-6 w-6" />
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-lg font-medium">
                                        <span className="absolute inset-0" aria-hidden="true" />
                                        Manage Users
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        View and manage all users
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href={route('central-admin.settings')}
                                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-purple-500 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors duration-200"
                            >
                                <div>
                                    <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                                        <Cog6ToothIcon className="h-6 w-6" />
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-lg font-medium">
                                        <span className="absolute inset-0" aria-hidden="true" />
                                        System Settings
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Configure system settings
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href={route('central-admin.tenants.index')}
                                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors duration-200"
                            >
                                <div>
                                    <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                                        <BuildingOfficeIcon className="h-6 w-6" />
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-lg font-medium">
                                        <span className="absolute inset-0" aria-hidden="true" />
                                        View Tenants
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Browse all tenant organizations
                                    </p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    // Render Tenant Admin Dashboard Content
    const renderTenantAdminDashboard = () => {
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
                name: 'This Month',
                stat: stats?.user_growth?.this_month || 0,
                icon: UserPlusIcon,
                change: stats?.user_growth?.growth_percentage ? `${stats.user_growth.growth_percentage > 0 ? '+' : ''}${stats.user_growth.growth_percentage}%` : '0%',
                changeType: stats?.user_growth?.trend === 'up' ? 'increase' : stats?.user_growth?.trend === 'down' ? 'decrease' : 'neutral',
                color: 'purple',
            },
            {
                name: 'Roles',
                stat: stats?.role_distribution ? stats.role_distribution.length : 0,
                icon: ChartBarIcon,
                change: 'Active',
                changeType: 'neutral',
                color: 'indigo',
            },
        ];

        return (
            <>
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
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
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
                                        <p className="text-gray-500">No recent activity to display</p>
                                        <p className="text-sm text-gray-400 mt-1">Activity will appear here as users interact with your tenant</p>
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

                    {/* Sidebar Content */}
                    <div className="space-y-6">
                        {/* Tenant Overview */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                                    <BuildingOffice2Icon className="h-5 w-5 mr-2 text-emerald-600" />
                                    Tenant Overview
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
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <Link
                                        href={route('tenant-admin.users.create')}
                                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-emerald-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-emerald-700 transition ease-in-out duration-150"
                                    >
                                        <PlusIcon className="h-4 w-4 mr-2" />
                                        Add User
                                    </Link>
                                    <Link
                                        href={route('tenant-admin.settings')}
                                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest hover:bg-gray-50 transition ease-in-out duration-150"
                                    >
                                        <Cog6ToothIcon className="h-4 w-4 mr-2" />
                                        Settings
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    // Render Tenant User Dashboard Content
    const renderTenantUserDashboard = () => {
        const statCards = [
            {
                name: 'My Activities',
                stat: stats?.user_activities || 0,
                icon: CheckCircleIcon,
                color: 'emerald',
            },
            {
                name: 'Messages',
                stat: stats?.user_messages || 0,
                icon: EnvelopeIcon,
                color: 'blue',
            },
            {
                name: 'Reports',
                stat: stats?.user_reports || 0,
                icon: ChartBarIcon,
                color: 'purple',
            },
        ];

        return (
            <>
                {/* Welcome Section */}
                <div className="mb-8 bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-lg overflow-hidden">
                    <div className="px-6 py-8 text-white">
                        <h2 className="text-2xl font-bold">Welcome back, {user.name}!</h2>
                        <p className="mt-2 text-emerald-100">
                            You're part of {stats?.tenant_name || 'your organization'}
                        </p>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
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
                            </dd>
                        </div>
                    ))}
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                                    <ClockIcon className="h-5 w-5 mr-2 text-emerald-600" />
                                    Your Recent Activity
                                </h3>
                                <div className="text-center py-8">
                                    <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No recent activity</p>
                                    <p className="text-sm text-gray-400 mt-1">Your activity will appear here</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access */}
                    <div>
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Access</h3>
                                <div className="space-y-3">
                                    <PermissionGate permission="manage_own_profile">
                                        <Link
                                            href={route('profile.edit')}
                                            className="w-full inline-flex items-center justify-center px-4 py-2 bg-emerald-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-emerald-700 transition ease-in-out duration-150"
                                        >
                                            <UserIcon className="h-4 w-4 mr-2" />
                                            My Profile
                                        </Link>
                                    </PermissionGate>
                                    
                                    <PermissionGate permission="view_reports">
                                        <button className="w-full inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest hover:bg-gray-50 transition ease-in-out duration-150">
                                            <ChartBarIcon className="h-4 w-4 mr-2" />
                                            View Reports
                                        </button>
                                    </PermissionGate>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    // Render Regular User Dashboard Content
    const renderRegularDashboard = () => (
        <div className="py-12">
            <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6 text-gray-900">
                        You're logged in!
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <LayoutComponent header={getHeader()}>
            <Head title={
                isCentralAdmin ? "Central Admin Dashboard" : 
                isTenantAdmin ? "Tenant Admin Dashboard" : 
                isTenantUser ? "My Workspace" : 
                "Dashboard"
            } />
            
            {isCentralAdmin && renderCentralAdminDashboard()}
            {isTenantAdmin && !isCentralAdmin && renderTenantAdminDashboard()}
            {isTenantUser && renderTenantUserDashboard()}
            {!isCentralAdmin && !isTenantAdmin && !isTenantUser && renderRegularDashboard()}
        </LayoutComponent>
    );
}
