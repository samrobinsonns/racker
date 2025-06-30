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
    ChartBarIcon,
    DocumentTextIcon,
    ChartPieIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import * as HeroIcons from '@heroicons/react/24/outline';
import Dropdown from '@/Components/Dropdown';
import { usePermissions } from '@/Hooks/usePermissions';

// Navigation Item Component that handles both links and dropdowns
function NavigationItem({ item, isCurrentRoute, isDesktop = false }) {
    // Use localStorage to persist dropdown state
    const storageKey = `dropdown-${item.name.replace(/\s+/g, '-').toLowerCase()}`;
    const [isOpen, setIsOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : true; // Default to open
        }
        return true;
    });

    // Save state to localStorage when it changes
    const toggleOpen = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (typeof window !== 'undefined') {
            localStorage.setItem(storageKey, JSON.stringify(newState));
        }
    };
    
    // If it's a divider, render horizontal line
    if (item.type === 'divider') {
        return (
            <div className="px-2 py-1">
                <hr className="border-gray-300" />
            </div>
        );
    }
    
    // If it's a dropdown, render dropdown with children
    if (item.type === 'dropdown' && item.children && item.children.length > 0) {
        return (
            <div>
                <button
                    onClick={toggleOpen}
                    className={`${
                        isDesktop
                            ? 'text-gray-700 hover:bg-gray-50'
                            : 'text-gray-700 hover:bg-gray-50'
                    } group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150`}
                >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                    <ChevronDownIcon className={`ml-auto h-4 w-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isOpen && (
                    <div className="mt-1 ml-8 space-y-1">
                        {item.children.map((child) => {
                            const ChildIcon = child.icon ? HeroIcons[child.icon] || HomeIcon : null;
                            // Handle external links for child items
                            if (child.type === 'external') {
                                return (
                                    <a
                                        key={child.name}
                                        href={child.url || child.href || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center px-2 py-1 text-sm text-gray-600 hover:text-emerald-600 hover:bg-gray-50 rounded-md"
                                    >
                                        {ChildIcon && <ChildIcon className="mr-2 h-4 w-4 flex-shrink-0" />}
                                        {child.name}
                                        <HeroIcons.ArrowTopRightOnSquareIcon className="ml-auto h-3 w-3 flex-shrink-0" />
                                    </a>
                                );
                            }
                            return (
                                <Link
                                    key={child.name}
                                    href={child.href || '#'}
                                    className="group flex items-center px-2 py-1 text-sm text-gray-600 hover:text-emerald-600 hover:bg-gray-50 rounded-md"
                                >
                                    {ChildIcon && <ChildIcon className="mr-2 h-4 w-4 flex-shrink-0" />}
                                    {child.name}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
    
    // External link item
    if (item.type === 'external') {
        return (
            <a
                href={item.url || item.href || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:bg-gray-50 group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150"
            >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
                <HeroIcons.ArrowTopRightOnSquareIcon className="ml-auto h-4 w-4 flex-shrink-0" />
            </a>
        );
    }
    
    // Regular link item
    return (
        <Link
            href={item.href}
            className={`${
                isCurrentRoute(item.href.split('/').pop())
                    ? isDesktop
                        ? 'bg-emerald-100 text-emerald-700 border-r-2 border-emerald-500'
                        : 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-700 hover:bg-gray-50'
            } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150`}
        >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            {item.name}
        </Link>
    );
}

export default function TenantAdminLayout({ children }) {
    const user = usePage().props.auth.user;
    const { tenantId, stats } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { hasPermission } = usePermissions();

    // Get navigation items from user (now driven by NavigationService)
    const getNavigation = () => {
        // Use navigation items passed from backend (via HasPermissions trait)
        if (user.navigation_items && user.navigation_items.length > 0) {
            return user.navigation_items.map(item => {
                // Helper function to safely get href
                const getHref = (routeName) => {
                    if (!routeName || routeName === '#' || routeName === '') {
                        return '#';
                    } 
                    
                    // Check if route function exists and if the route is available
                    if (typeof route === 'function') {
                        try {
                            // Check if the route exists before trying to generate it
                            if (route().has && route().has(routeName)) {
                                return route(routeName);
                            } else {
                                // Route doesn't exist, provide fallback
                                console.warn(`Route "${routeName}" not registered in Ziggy routes`);
                                return '#';
                            }
                        } catch (error) {
                            console.warn(`Route "${routeName}" not found:`, error.message);
                            return '#';
                        }
                    } else {
                        console.warn('Route helper not available');
                        return '#';
                    }
                };
                
                // Process children if they exist
                const processedChildren = item.children ? item.children.map(child => ({
                    name: child.name || child.label,
                    href: child.type === 'external' ? child.url : getHref(child.route),
                    url: child.url,
                    icon: child.icon,
                    permission: child.permission,
                    type: child.type || 'link'
                })) : [];
                
                return {
                    name: item.name,
                    href: item.type === 'external' ? item.url : getHref(item.route),
                    url: item.url,
                    icon: getIconComponent(item.icon),
                    permission: item.permission,
                    type: item.type || 'link',
                    children: processedChildren
                };
            });
        }

        // Fallback to default navigation if no custom navigation is configured
        return [
            { name: 'Dashboard', href: route('dashboard'), icon: HomeIcon },
            { name: 'Reports', href: route('tenant.reports'), icon: ChartBarIcon },
            { name: 'Content', href: route('tenant.content'), icon: DocumentTextIcon },
            { name: 'Analytics', href: route('tenant.analytics'), icon: ChartPieIcon },
            { name: 'My Profile', href: route('profile.edit'), icon: UserIcon },
        ];
    };

    // Helper to get icon component from string name - now supports all HeroIcons
    const getIconComponent = (iconName) => {
        if (!iconName) return HomeIcon;
        
        // Try to get the icon from HeroIcons
        const IconComponent = HeroIcons[iconName];
        
        // Log warning if icon not found (helps with debugging)
        if (!IconComponent) {
            console.warn(`Icon "${iconName}" not found in Heroicons, falling back to HomeIcon`);
        }
        
        // Return the icon if found, otherwise fallback to HomeIcon
        return IconComponent || HomeIcon;
    };

    const navigation = getNavigation();

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
                            <NavigationItem key={item.name} item={item} isCurrentRoute={isCurrentRoute} />
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
                                <NavigationItem key={item.name} item={item} isCurrentRoute={isCurrentRoute} isDesktop={true} />
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top navigation */}
                <div className="sticky top-0 z-40 bg-gray-50">
                    <div className="flex h-12 justify-end items-center px-5">
                        <button
                            type="button"
                            className="text-gray-500 lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Bars3Icon className="h-6 w-6" />
                        </button>

                        <div className="flex items-center space-x-4 pt-5">
                            <div className="text-sm leading-none text-gray-500">
                                Tenant Administrator
                            </div>
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <span className="inline-flex">
                                        <button
                                            type="button"
                                            className="inline-flex items-center text-sm leading-none font-medium text-gray-500 hover:text-gray-700 transition ease-in-out duration-150"
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

                {/* Main content */}
                <main className="py-6">
                    <div className="mx-auto max-w-7xl px-2 sm:px-3 lg:px-4">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
} 