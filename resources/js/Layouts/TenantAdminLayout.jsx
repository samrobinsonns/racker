import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    HomeIcon,
    UsersIcon,
    Cog6ToothIcon,
    ChevronDownIcon,
    Bars3Icon,
    XMarkIcon,
    BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import Dropdown from '@/Components/Dropdown';

export default function TenantAdminLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const { tenantId, stats } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: route('tenant-admin.dashboard'), icon: HomeIcon },
        { name: 'Users', href: route('tenant-admin.users.index'), icon: UsersIcon },
        { name: 'Settings', href: route('tenant-admin.settings'), icon: Cog6ToothIcon },
    ];

    const isCurrentRoute = (routeName) => {
        return route().current(routeName);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar */}
            <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
                    <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
                        <div className="flex items-center">
                            <BuildingOffice2Icon className="h-8 w-8 text-emerald-600 mr-2" />
                            <span className="text-lg font-bold text-emerald-600">Tenant Admin</span>
                        </div>
                        <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="px-4 py-2 border-b">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Current Tenant</p>
                        <p className="text-sm font-medium text-gray-900">{stats?.tenant_name || 'Unknown'}</p>
                    </div>
                    <nav className="flex-1 space-y-1 px-2 py-4">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`${
                                    isCurrentRoute(item.href.split('/').pop())
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'text-gray-700 hover:bg-gray-50'
                                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                            >
                                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
                <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
                    <div className="flex h-16 flex-shrink-0 items-center px-4 border-b">
                        <BuildingOffice2Icon className="h-8 w-8 text-emerald-600 mr-2" />
                        <span className="text-lg font-bold text-emerald-600">Tenant Admin</span>
                    </div>
                    <div className="px-4 py-3 border-b bg-gray-50">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Current Tenant</p>
                        <p className="text-sm font-medium text-gray-900">{stats?.tenant_name || 'Unknown'}</p>
                    </div>
                    <div className="flex flex-1 flex-col overflow-y-auto">
                        <nav className="flex-1 space-y-1 px-2 py-4">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`${
                                        isCurrentRoute(item.href.split('/').pop())
                                            ? 'bg-emerald-100 text-emerald-700 border-r-2 border-emerald-500'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150`}
                                >
                                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top navigation */}
                <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
                    <div className="flex h-16 justify-between items-center px-4 sm:px-6 lg:px-8">
                        <button
                            type="button"
                            className="text-gray-500 lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Bars3Icon className="h-6 w-6" />
                        </button>

                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-500">
                                Tenant Administrator
                            </div>
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <span className="inline-flex rounded-md">
                                        <button
                                            type="button"
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition ease-in-out duration-150"
                                        >
                                            {user.name}
                                            <ChevronDownIcon className="ml-2 -mr-0.5 h-4 w-4" />
                                        </button>
                                    </span>
                                </Dropdown.Trigger>

                                <Dropdown.Content>
                                    <Dropdown.Link href={route('profile.edit')}>
                                        Profile
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('dashboard')}>
                                        Regular Dashboard
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button">
                                        Log Out
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>

                {/* Page header */}
                {header && (
                    <header className="bg-white shadow-sm">
                        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                {/* Main content */}
                <main className="py-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
} 