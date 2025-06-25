import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    HomeIcon,
    UsersIcon,
    BuildingOfficeIcon,
    BuildingOffice2Icon,
    Cog6ToothIcon,
    ChevronDownIcon,
    Bars3Icon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const { tenantId, stats } = usePage().props;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Determine user type and context
    const isCentralAdmin = user.is_central_admin;
    const isTenantAdmin = user.roles?.some(role => role.name === 'tenant_admin') || false;
    const isAdmin = isCentralAdmin || isTenantAdmin;

    // Helper to get icon component from string name
    const getIconComponent = (iconName) => {
        const iconMap = {
            'HomeIcon': HomeIcon,
            'UsersIcon': UsersIcon,
            'Cog6ToothIcon': Cog6ToothIcon,
            'BuildingOfficeIcon': BuildingOfficeIcon,
            'BuildingOffice2Icon': BuildingOffice2Icon,
        };
        return iconMap[iconName] || HomeIcon;
    };

    // Get navigation items for admin users
    const getAdminNavigation = () => {
        // Use navigation items passed from backend (via HasPermissions trait)
        if (user.navigation_items && user.navigation_items.length > 0) {
            return user.navigation_items.map(item => ({
                name: item.name,
                href: route(item.route),
                icon: getIconComponent(item.icon),
                permission: item.permission
            }));
        }

        // Fallback to default navigation based on user type
        if (isCentralAdmin) {
            return [
                { name: 'Dashboard', href: route('dashboard'), icon: HomeIcon },
                { name: 'Tenants', href: route('central-admin.tenants.index'), icon: BuildingOfficeIcon },
                { name: 'All Users', href: route('central-admin.users.index'), icon: UsersIcon },
                { name: 'Settings', href: route('central-admin.settings'), icon: Cog6ToothIcon },
            ];
        } else if (isTenantAdmin) {
            return [
                { name: 'Dashboard', href: route('dashboard'), icon: HomeIcon },
                { name: 'Users', href: route('tenant-admin.users.index'), icon: UsersIcon },
                { name: 'Settings', href: route('tenant-admin.settings'), icon: Cog6ToothIcon },
            ];
        }
        return [];
    };

    // Theme configuration based on user type
    const getThemeConfig = () => {
        if (isCentralAdmin) {
            return {
                primary: 'indigo',
                bgColor: 'bg-indigo-500',
                textColor: 'text-indigo-600',
                hoverColor: 'hover:bg-indigo-700',
                activeColor: 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-500',
                title: 'Central Admin',
                icon: BuildingOfficeIcon,
                navigation: getAdminNavigation()
            };
        } else if (isTenantAdmin) {
            return {
                primary: 'emerald',
                bgColor: 'bg-emerald-500',
                textColor: 'text-emerald-600',
                hoverColor: 'hover:bg-emerald-700',
                activeColor: 'bg-emerald-100 text-emerald-700 border-r-2 border-emerald-500',
                title: 'Tenant Admin',
                icon: BuildingOffice2Icon,
                navigation: getAdminNavigation()
            };
        }
        return null;
    };

    const themeConfig = getThemeConfig();

    const isCurrentRoute = (href) => {
        if (href === route('dashboard')) {
            return route().current('dashboard');
        }
        
        // Handle tenant admin routes
        if (href.includes('tenant-admin')) {
            const routeName = href.split('/').pop();
            return route().current(`tenant-admin.${routeName}`);
        }
        
        // Handle central admin routes  
        if (href.includes('central-admin')) {
            const routeName = href.split('/').pop();
            return route().current(`central-admin.${routeName}`);
        }
        
        return route().current(href.split('/').pop());
    };

    const getUserTypeLabel = () => {
        if (isCentralAdmin) return 'Central Administrator';
        if (isTenantAdmin) return 'Tenant Administrator';
        return 'User';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Admin Sidebar - Only show for admin users */}
            {isAdmin && (
                <>
                    {/* Mobile sidebar */}
                    <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
                            <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
                                <div className="flex items-center">
                                    <themeConfig.icon className={`h-8 w-8 ${themeConfig.textColor} mr-2`} />
                                    <span className={`text-lg font-bold ${themeConfig.textColor}`}>{themeConfig.title}</span>
                                </div>
                                <button
                                    type="button"
                                    className="text-gray-400 hover:text-gray-600"
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                            {isTenantAdmin && (
                                <div className="px-4 py-2 border-b">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Current Tenant</p>
                                    <p className="text-sm font-medium text-gray-900">{stats?.tenant_name || 'Unknown'}</p>
                                </div>
                            )}
                            <nav className="flex-1 space-y-1 px-2 py-4">
                                {themeConfig.navigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`${
                                            isCurrentRoute(item.href)
                                                ? themeConfig.activeColor
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
                                <themeConfig.icon className={`h-8 w-8 ${themeConfig.textColor} mr-2`} />
                                <span className={`text-lg font-bold ${themeConfig.textColor}`}>{themeConfig.title}</span>
                            </div>
                            {isTenantAdmin && (
                                <div className="px-4 py-3 border-b bg-gray-50">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Current Tenant</p>
                                    <p className="text-sm font-medium text-gray-900">{stats?.tenant_name || 'Unknown'}</p>
                                </div>
                            )}
                            <div className="flex flex-1 flex-col overflow-y-auto">
                                <nav className="flex-1 space-y-1 px-2 py-4">
                                    {themeConfig.navigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`${
                                                isCurrentRoute(item.href)
                                                    ? themeConfig.activeColor
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
                </>
            )}

            {/* Main content */}
            <div className={isAdmin ? "lg:pl-64" : ""}>
                {/* Top navigation */}
                <nav className={`border-b border-gray-100 bg-white ${isAdmin ? 'sticky top-0 z-40 shadow-sm' : ''}`}>
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 justify-between">
                            <div className="flex">
                                {/* Mobile menu button for admins */}
                                {isAdmin && (
                                    <button
                                        type="button"
                                        className="text-gray-500 lg:hidden mr-4 flex items-center"
                                        onClick={() => setSidebarOpen(true)}
                                    >
                                        <Bars3Icon className="h-6 w-6" />
                                    </button>
                                )}

                                <div className="flex shrink-0 items-center">
                                    <Link href="/">
                                        <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
                                    </Link>
                                </div>

                                {/* Navigation for non-admin users */}
                                {!isAdmin && (
                                    <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                        <NavLink
                                            href={route('dashboard')}
                                            active={route().current('dashboard')}
                                        >
                                            Dashboard
                                        </NavLink>
                                    </div>
                                )}
                            </div>

                            <div className="hidden sm:ms-6 sm:flex sm:items-center">
                                {/* User type indicator for admins */}
                                {isAdmin && (
                                    <div className="text-sm text-gray-500 mr-4">
                                        {getUserTypeLabel()}
                                    </div>
                                )}

                                <div className="relative ms-3">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <span className="inline-flex rounded-md">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none"
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
                                            {/* Dashboard switching for admins */}
                                            {isCentralAdmin && (
                                                <Dropdown.Link href={route('dashboard')}>
                                                    Regular Dashboard
                                                </Dropdown.Link>
                                            )}
                                            {isTenantAdmin && (
                                                <Dropdown.Link href={route('dashboard')}>
                                                    Regular Dashboard
                                                </Dropdown.Link>
                                            )}
                                            <Dropdown.Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                            >
                                                Log Out
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            </div>

                            {/* Mobile menu button for non-admin users */}
                            {!isAdmin && (
                                <div className="-me-2 flex items-center sm:hidden">
                                    <button
                                        onClick={() =>
                                            setShowingNavigationDropdown(
                                                (previousState) => !previousState,
                                            )
                                        }
                                        className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none"
                                    >
                                        <svg
                                            className="h-6 w-6"
                                            stroke="currentColor"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                className={
                                                    !showingNavigationDropdown
                                                        ? 'inline-flex'
                                                        : 'hidden'
                                                }
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M4 6h16M4 12h16M4 18h16"
                                            />
                                            <path
                                                className={
                                                    showingNavigationDropdown
                                                        ? 'inline-flex'
                                                        : 'hidden'
                                                }
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile navigation menu for non-admin users */}
                    {!isAdmin && (
                        <div
                            className={
                                (showingNavigationDropdown ? 'block' : 'hidden') +
                                ' sm:hidden'
                            }
                        >
                            <div className="space-y-1 pb-3 pt-2">
                                <ResponsiveNavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                >
                                    Dashboard
                                </ResponsiveNavLink>
                            </div>

                            <div className="border-t border-gray-200 pb-1 pt-4">
                                <div className="px-4">
                                    <div className="text-base font-medium text-gray-800">
                                        {user.name}
                                    </div>
                                    <div className="text-sm font-medium text-gray-500">
                                        {user.email}
                                    </div>
                                </div>

                                <div className="mt-3 space-y-1">
                                    <ResponsiveNavLink href={route('profile.edit')}>
                                        Profile
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink
                                        method="post"
                                        href={route('logout')}
                                        as="button"
                                    >
                                        Log Out
                                    </ResponsiveNavLink>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mobile navigation for admin users */}
                    {isAdmin && (
                        <div className="sm:hidden">
                            <div className="border-t border-gray-200 pb-1 pt-4">
                                <div className="px-4">
                                    <div className="text-base font-medium text-gray-800">
                                        {user.name}
                                    </div>
                                    <div className="text-sm font-medium text-gray-500">
                                        {user.email} • {getUserTypeLabel()}
                                    </div>
                                </div>

                                <div className="mt-3 space-y-1">
                                    <ResponsiveNavLink href={route('profile.edit')}>
                                        Profile
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink
                                        method="post"
                                        href={route('logout')}
                                        as="button"
                                    >
                                        Log Out
                                    </ResponsiveNavLink>
                                </div>
                            </div>
                        </div>
                    )}
                </nav>

                {/* Page header */}
                {header && (
                    <header className="bg-white shadow-sm">
                        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                {/* Main content area - Clean for page content */}
                <main className={isAdmin ? "py-6" : ""}>
                    <div className={isAdmin ? "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" : ""}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
