import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PermissionGate from '@/Components/PermissionGate';
import { usePermissions } from '@/Hooks/usePermissions';
import { useNotifications } from '@/Components/Notifications/NotificationProvider';
import { useState, useEffect } from 'react';
import {
    BuildingOfficeIcon,
    UsersIcon,
    UserGroupIcon,
    ChartBarIcon,
    PlusIcon,
    EyeIcon,
    ClockIcon,
    CheckCircleIcon,
    UserPlusIcon,
    ShieldCheckIcon,
    EnvelopeIcon,
    UserIcon,
    BuildingOffice2Icon,
    Cog6ToothIcon,
    ArrowPathIcon,
    CheckIcon,
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    TrashIcon,
    BellIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
    const { props } = usePage();
    const { auth, stats, layoutType } = props;
    const { user } = auth;
    const { hasPermission, getAdminLevel } = usePermissions();
    const { notifications: notificationSystem } = useNotifications();

    // Notification state
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    // Format date helper
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Load notifications
    const loadNotifications = async (resetPage = true) => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/notifications`, {
                params: {
                    limit: 4
                }
            });

            const newNotifications = response.data.notifications;
            setNotifications(newNotifications);
            setHasMore(false); // No pagination needed
        } catch (error) {
            console.error('Failed to load notifications:', error);
            notificationSystem.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    // Handle mark as read
    const handleMarkAsRead = async (id) => {
        try {
            await axios.patch(`/api/notifications/${id}/read`);
            setNotifications(notifications.map(n => 
                n.id === id ? { ...n, read_at: new Date().toISOString() } : n
            ));
            notificationSystem.success('Notification marked as read');
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            notificationSystem.error('Failed to mark notification as read');
        }
    };

    // Handle mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            await axios.patch('/api/notifications/mark-all-read');
            setNotifications(notifications.map(n => ({ 
                ...n, 
                read_at: n.read_at || new Date().toISOString() 
            })));
            notificationSystem.success('All notifications marked as read');
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
            notificationSystem.error('Failed to mark all notifications as read');
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/notifications/${id}`);
            setNotifications(notifications.filter(n => n.id !== id));
            notificationSystem.success('Notification deleted');
        } catch (error) {
            console.error('Failed to delete notification:', error);
            notificationSystem.error('Failed to delete notification');
        }
    };

    // Handle refresh
    const handleRefreshNotifications = () => {
        loadNotifications(true);
    };

    // Load notifications on mount
    useEffect(() => {
        loadNotifications(true);
    }, []);

    // Check user type - AuthenticatedLayout will handle the dynamic theming and navigation
    const isCentralAdmin = user?.is_central_admin;
    const isTenantAdmin = user?.admin_level === 'tenant_admin';
    const isTenantUser = user?.tenant_id && user?.admin_level !== 'tenant_admin';

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
                                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors duration-200"
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
                                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors duration-200"
                            >
                                <div>
                                    <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                                        <Cog6ToothIcon className="h-6 w-6" />
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-lg font-medium">
                                        <span className="absolute inset-0" aria-hidden="true" />
                                        Settings
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Configure system settings
                                    </p>
                                </div>
                            </Link>

                            <div className="relative group bg-white p-6 border border-gray-200 rounded-lg">
                                <div>
                                    <span className="rounded-lg inline-flex p-3 bg-gray-50 text-gray-700 ring-4 ring-white">
                                        <ChartBarIcon className="h-6 w-6" />
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Analytics
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Coming soon...
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    // Render Tenant User Dashboard Content - Now used for ALL tenant users (including admins)
    const renderTenantUserDashboard = () => {
        const statCards = [
            {
                name: 'My Tickets',
                stat: stats?.user_tickets || 0,
                icon: CheckCircleIcon,
                color: 'emerald',
            },
            {
                name: 'Resolved Tickets',
                stat: stats?.resolved_tickets || 0,
                icon: CheckIcon,
                color: 'blue',
            },
            {
                name: 'Reports',
                stat: stats?.user_reports || 3,
                icon: ChartBarIcon,
                color: 'purple',
            },
        ];

        return (
            <>
                {/* Welcome Section */}


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
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                                        <ClockIcon className="h-5 w-5 mr-2 text-emerald-600" />
                                        Recent Activity & Notifications
                                    </h3>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleMarkAllAsRead()}
                                            className="text-sm text-gray-600 hover:text-emerald-600"
                                        >
                                            Mark all as read
                                        </button>
                                        <button
                                            onClick={() => handleRefreshNotifications()}
                                            className="text-gray-600 hover:text-emerald-600"
                                        >
                                            <ArrowPathIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Notifications List */}
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {loading ? (
                                        <div className="flex justify-center items-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                                        </div>
                                    ) : notifications.length > 0 ? (
                                        notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`relative p-4 rounded-lg border ${
                                                    notification.read_at ? 'bg-white' : 'bg-emerald-50'
                                                } ${
                                                    notification.type === 'success'
                                                        ? 'border-green-200'
                                                        : notification.type === 'error'
                                                        ? 'border-red-200'
                                                        : notification.type === 'warning'
                                                        ? 'border-yellow-200'
                                                        : 'border-blue-200'
                                                }`}
                                            >
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0">
                                                        {notification.type === 'success' && (
                                                            <CheckCircleIcon className="h-6 w-6 text-green-500" />
                                                        )}
                                                        {notification.type === 'error' && (
                                                            <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
                                                        )}
                                                        {notification.type === 'warning' && (
                                                            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
                                                        )}
                                                        {notification.type === 'info' && (
                                                            <InformationCircleIcon className="h-6 w-6 text-blue-500" />
                                                        )}
                                                    </div>
                                                    <div className="ml-3 flex-1">
                                                        {notification.title && (
                                                            <h4 className="text-sm font-medium text-gray-900">
                                                                {notification.title}
                                                            </h4>
                                                        )}
                                                        <p className="text-sm text-gray-600">{notification.message}</p>
                                                        <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                                                            <span>{formatDate(notification.created_at)}</span>
                                                            {notification.action_url && (
                                                                <Link
                                                                    href={notification.action_url}
                                                                    className="text-emerald-600 hover:text-emerald-800"
                                                                >
                                                                    {notification.action_text || 'View Details'}
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4 flex-shrink-0 flex items-start space-x-2">
                                                        {!notification.read_at && (
                                                            <button
                                                                onClick={() => handleMarkAsRead(notification.id)}
                                                                className="text-gray-400 hover:text-emerald-600"
                                                            >
                                                                <CheckIcon className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(notification.id)}
                                                            className="text-gray-400 hover:text-red-600"
                                                        >
                                                            <TrashIcon className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">No notifications to display</p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                You have no notifications yet
                                            </p>
                                        </div>
                                    )}
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
                                        <Link
                                            href={route('tenant.reports')}
                                            className="w-full inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest hover:bg-gray-50 transition ease-in-out duration-150"
                                        >
                                            <ChartBarIcon className="h-4 w-4 mr-2" />
                                            View Reports
                                        </Link>
                                    </PermissionGate>

                                    <PermissionGate permission="view_tenant_data">
                                        <Link
                                            href={route('tenant.content')}
                                            className="w-full inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest hover:bg-gray-50 transition ease-in-out duration-150"
                                        >
                                            <BuildingOffice2Icon className="h-4 w-4 mr-2" />
                                            Content
                                        </Link>
                                    </PermissionGate>

                                    <PermissionGate permission="view_tenant_analytics">
                                        <Link
                                            href={route('tenant.analytics')}
                                            className="w-full inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest hover:bg-gray-50 transition ease-in-out duration-150"
                                        >
                                            <ChartBarIcon className="h-4 w-4 mr-2" />
                                            Analytics
                                        </Link>
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
        <AuthenticatedLayout header={getHeader()}>
            <Head title="Dashboard" />
            
            {isCentralAdmin && renderCentralAdminDashboard()}
            {(isTenantAdmin || isTenantUser) && renderTenantUserDashboard()}
            {!isCentralAdmin && !isTenantAdmin && !isTenantUser && renderRegularDashboard()}
        </AuthenticatedLayout>
    );
}
