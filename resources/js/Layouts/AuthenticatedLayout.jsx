import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Avatar from '@/Components/User/Avatar';
import NotificationCenter from '@/Components/Notifications/NotificationCenter';
import { useNotifications } from '@/Components/Notifications/NotificationProvider';
import {
    HomeIcon,
    UsersIcon,
    BuildingOfficeIcon,
    BuildingOffice2Icon,
    Cog6ToothIcon,
    ChevronDownIcon,
    Bars3Icon,
    XMarkIcon,
    BellIcon,
} from '@heroicons/react/24/outline';
import * as HeroIcons from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';

// Navigation Item Component that handles both links and dropdowns
function NavigationItem({ item, isCurrentRoute, themeConfig, isDesktop = false }) {
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
                                        className={`group flex items-center px-2 py-1 text-sm transition-colors duration-150 rounded-md ${
                                            themeConfig?.customColor ? 'text-gray-600 hover:bg-gray-50' : 
                                            themeConfig ? `text-gray-600 hover:text-${themeConfig.primary}-600 hover:bg-gray-50` : 
                                            'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                                        }`}
                                        style={themeConfig?.customColor ? { 
                                            '--hover-color': themeConfig.customColor 
                                        } : {}}
                                        onMouseEnter={(e) => {
                                            if (themeConfig?.customColor) {
                                                e.target.style.color = themeConfig.customColor;
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (themeConfig?.customColor) {
                                                e.target.style.color = '#4b5563'; // text-gray-600
                                            }
                                        }}
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
                                    className={`group flex items-center px-2 py-1 text-sm transition-colors duration-150 rounded-md ${
                                        themeConfig?.customColor ? 'text-gray-600 hover:bg-gray-50' : 
                                        themeConfig ? `text-gray-600 hover:text-${themeConfig.primary}-600 hover:bg-gray-50` : 
                                        'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                                    }`}
                                    style={themeConfig?.customColor ? { 
                                        '--hover-color': themeConfig.customColor 
                                    } : {}}
                                    onMouseEnter={(e) => {
                                        if (themeConfig?.customColor) {
                                            e.target.style.color = themeConfig.customColor;
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (themeConfig?.customColor) {
                                            e.target.style.color = '#4b5563'; // text-gray-600
                                        }
                                    }}
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
                className={`text-gray-700 hover:bg-gray-50 group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150`}
            >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
                <HeroIcons.ArrowTopRightOnSquareIcon className="ml-auto h-4 w-4 flex-shrink-0" />
            </a>
        );
    }
    
    // Regular link item
    const isActive = isCurrentRoute(item.href);
    
    return (
        <Link
            href={item.href}
            className={`${
                isActive && themeConfig?.customColor
                    ? 'bg-gray-100 border-r-2 font-medium'
                    : isActive
                    ? themeConfig.activeColor
                    : 'text-gray-700 hover:bg-gray-50'
            } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150`}
            style={isActive && themeConfig?.customColor ? {
                color: themeConfig.customColor,
                borderRightColor: themeConfig.customColor
            } : {}}
        >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            {item.name}
        </Link>
    );
}

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const { tenantId, stats } = usePage().props;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const { 
        addToast, 
        notifications, 
        unreadCount, 
        markAsRead, 
        markAllAsRead, 
        deleteNotification,
        loadNotifications: loadNotificationsFromProvider 
    } = useNotifications();
    
    // Update favicon when branding changes
    useEffect(() => {
        const customBranding = user.navigation_branding || {};
        if (customBranding.logoType === 'image' && customBranding.logoUrl) {
            let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = customBranding.logoUrl;
            document.getElementsByTagName('head')[0].appendChild(link);
        }
    }, [user.navigation_branding]);

    // Determine user type and context
    const isCentralAdmin = user.is_central_admin;
    const isTenantAdmin = user?.admin_level === 'tenant_admin';
    
    // Show sidebar if user has custom navigation items OR is an admin
    // This allows the Navigation Builder to control what all roles see
    const hasCustomNavigation = user.navigation_items && user.navigation_items.length > 0;
    const isAdmin = isCentralAdmin || isTenantAdmin;
    const shouldShowSidebar = hasCustomNavigation || isAdmin;

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

    // Get navigation items for admin users
    const getAdminNavigation = () => {
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

        // Use navigation items passed from backend (via HasPermissions trait)
        if (user.navigation_items && user.navigation_items.length > 0) {
            return user.navigation_items.map(item => {
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

        // Fallback to default navigation based on user type
        if (isCentralAdmin) {
            return [
                { name: 'Dashboard', href: route('dashboard'), icon: HomeIcon },
                { name: 'Messages', href: route('messages'), icon: HeroIcons.ChatBubbleLeftRightIcon },
                { name: 'Tenants', href: route('central-admin.tenants.index'), icon: BuildingOfficeIcon },
                { name: 'All Users', href: route('central-admin.users.index'), icon: UsersIcon },
                { name: 'Settings', href: route('central-admin.settings'), icon: Cog6ToothIcon },
            ];
        } else if (isTenantAdmin) {
            return [
                { name: 'Dashboard', href: route('dashboard'), icon: HomeIcon },
                { name: 'Messages', href: route('messages'), icon: HeroIcons.ChatBubbleLeftRightIcon },
                { name: 'Users', href: route('tenant-admin.users.index'), icon: UsersIcon },
                { name: 'Settings', href: route('tenant-admin.settings'), icon: Cog6ToothIcon },
            ];
        }
        return [];
    };

    // Theme configuration based on user type and custom navigation
    const getThemeConfig = () => {
        // Get custom branding from user navigation
        const customBranding = user.navigation_branding || {};
        
        if (isCentralAdmin) {
            return {
                primary: 'indigo',
                bgColor: 'bg-indigo-500',
                textColor: 'text-indigo-600',
                hoverColor: 'hover:bg-indigo-700',
                activeColor: 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-500',
                title: 'Central Admin',
                subtitle: '',
                icon: BuildingOfficeIcon,
                logoUrl: null,
                customColor: null,
                navigation: getAdminNavigation()
            };
        } else if (hasCustomNavigation || isTenantAdmin || user?.tenant_id) {
            // Check if we have a custom hex color
            const hasCustomColor = customBranding.primaryColor && customBranding.primaryColor.startsWith('#');
            
            if (hasCustomColor) {
                return {
                    primary: 'custom',
                    customColor: customBranding.primaryColor,
                    title: customBranding.title || stats?.tenant_name || 'Tenant Portal',
                    subtitle: customBranding.subtitle || '',
                    icon: customBranding.logoType === 'icon' 
                        ? getIconComponent(customBranding.logo) || BuildingOffice2Icon
                        : BuildingOffice2Icon,
                    logoUrl: customBranding.logoType === 'image' ? customBranding.logoUrl : null,
                    navigation: getAdminNavigation()
                };
            } else {
                // Fallback to named colors for backwards compatibility
                const primaryColor = customBranding.primaryColor || 'emerald';
                return {
                    primary: primaryColor,
                    bgColor: `bg-${primaryColor}-500`,
                    textColor: `text-${primaryColor}-600`,
                    hoverColor: `hover:bg-${primaryColor}-700`,
                    activeColor: `bg-${primaryColor}-100 text-${primaryColor}-700 border-r-2 border-${primaryColor}-500`,
                    title: customBranding.title || stats?.tenant_name || 'Tenant Portal',
                    subtitle: customBranding.subtitle || '',
                    icon: customBranding.logoType === 'icon' 
                        ? getIconComponent(customBranding.logo) || BuildingOffice2Icon
                        : BuildingOffice2Icon,
                    logoUrl: customBranding.logoType === 'image' ? customBranding.logoUrl : null,
                    customColor: null,
                    navigation: getAdminNavigation()
                };
            }
        }
        return null;
    };

    const themeConfig = getThemeConfig();

    const isCurrentRoute = (href) => {
        // Handle fallback routes
        if (!href || href === '#') {
            return false;
        }

        try {
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
        } catch (error) {
            // If route checking fails, return false
            return false;
        }
    };

    const getUserTypeLabel = () => {
        if (isCentralAdmin) return 'Central Administrator';
        if (isTenantAdmin) {
            // Get the actual role display name from user's roles
            const tenantRole = user.roles?.find(role => role.tenant_id === user.tenant_id);
            return tenantRole?.display_name || 'Tenant Administrator';
        }
        if (hasCustomNavigation) {
            // Get the primary role display name for users with custom navigation
            const primaryRole = user.roles?.find(role => role.tenant_id === user.tenant_id);
            return primaryRole?.display_name || 'User';
        }
        return 'User';
    };

    // Load notifications
    const loadNotifications = async () => {
        try {
            setIsLoadingNotifications(true);
            const response = await fetch('/api/notifications');
            const data = await response.json();
            
            // Update the NotificationProvider's state with the loaded notifications
            if (loadNotificationsFromProvider) {
                loadNotificationsFromProvider(data.notifications, data.unread_count);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
            addToast({
                type: 'error',
                message: 'Failed to load notifications',
                duration: 3000,
            });
        } finally {
            setIsLoadingNotifications(false);
        }
    };

    // Mark notification as read
    const handleMarkAsRead = async (notificationId) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            });
            
            if (response.ok) {
                // Use the NotificationProvider's markAsRead function
                markAsRead(notificationId);
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    // Mark all notifications as read
    const handleMarkAllAsRead = async () => {
        try {
            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            });
            
            if (response.ok) {
                // Use the NotificationProvider's markAllAsRead function
                markAllAsRead();
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    // Delete notification
    const handleDeleteNotification = async (notificationId) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            });
            
            if (response.ok) {
                // Use the NotificationProvider's deleteNotification function
                deleteNotification(notificationId);
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    // Load notifications on component mount
    useEffect(() => {
        loadNotifications();
    }, []);

    const [showNotifications, setShowNotifications] = useState(false);
    const [open, setOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Custom Navigation Sidebar - Show for users with custom navigation or admins */}
            {shouldShowSidebar && (
                <>
                    {/* Mobile sidebar */}
                    <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
                                                    <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
                            <div className="flex items-center">
                                {themeConfig.logoUrl ? (
                                    <img 
                                        src={themeConfig.logoUrl} 
                                        alt="Logo" 
                                        className="h-8 w-8 mr-2 object-contain" 
                                    />
                                ) : (
                                    <themeConfig.icon className={`h-8 w-8 ${themeConfig.textColor} mr-2`} />
                                )}
                                <div className="flex flex-col">
                                    <span className={`text-lg font-bold ${themeConfig.textColor}`}>
                                        {themeConfig.title}
                                    </span>
                                    {themeConfig.subtitle && (
                                        <span className={`text-xs ${themeConfig.textColor} opacity-75`}>
                                            {themeConfig.subtitle}
                                        </span>
                                    )}
                                </div>
                            </div>
                                <button
                                    type="button"
                                    className="text-gray-400 hover:text-gray-600"
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                            {(isTenantAdmin || user?.tenant_id || hasCustomNavigation) && (
                                <div className="px-4 py-2 border-b">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Current Tenant</p>
                                    <p className="text-sm font-medium text-gray-900">{stats?.tenant_name || 'Unknown'}</p>
                                </div>
                            )}
                            <nav className="flex-1 space-y-1 px-2 py-4">
                                {themeConfig.navigation.map((item) => (
                                    <NavigationItem 
                                        key={item.name} 
                                        item={item} 
                                        isCurrentRoute={isCurrentRoute} 
                                        themeConfig={themeConfig} 
                                        isDesktop={false} 
                                    />
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Desktop sidebar */}
                    <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
                        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
                            <div className="flex h-16 flex-shrink-0 items-center px-4 border-b">
                                {themeConfig.logoUrl ? (
                                    <img 
                                        src={themeConfig.logoUrl} 
                                        alt="Logo" 
                                        className="h-8 w-8 mr-2 object-contain" 
                                    />
                                ) : themeConfig.customColor ? (
                                    <themeConfig.icon 
                                        className="h-8 w-8 mr-2" 
                                        style={{ color: themeConfig.customColor }}
                                    />
                                ) : (
                                    <themeConfig.icon className={`h-8 w-8 ${themeConfig.textColor} mr-2`} />
                                )}
                                <div className="flex flex-col">
                                    {themeConfig.customColor ? (
                                        <>
                                            <span 
                                                className="text-lg font-bold" 
                                                style={{ color: themeConfig.customColor }}
                                            >
                                                {themeConfig.title}
                                            </span>
                                            {themeConfig.subtitle && (
                                                <span 
                                                    className="text-xs opacity-75" 
                                                    style={{ color: themeConfig.customColor }}
                                                >
                                                    {themeConfig.subtitle}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <span className={`text-lg font-bold ${themeConfig.textColor}`}>
                                                {themeConfig.title}
                                            </span>
                                            {themeConfig.subtitle && (
                                                <span className={`text-xs ${themeConfig.textColor} opacity-75`}>
                                                    {themeConfig.subtitle}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            {(isTenantAdmin || user?.tenant_id || hasCustomNavigation) && (
                                <div className="px-4 py-3 border-b bg-gray-50">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Current Tenant</p>
                                    <p className="text-sm font-medium text-gray-900">{stats?.tenant_name || 'Unknown'}</p>
                                </div>
                            )}
                            <div className="flex flex-1 flex-col overflow-y-auto">
                                <nav className="flex-1 space-y-1 px-2 py-4">
                                    {themeConfig.navigation.map((item) => (
                                        <NavigationItem 
                                            key={item.name} 
                                            item={item} 
                                            isCurrentRoute={isCurrentRoute} 
                                            themeConfig={themeConfig} 
                                            isDesktop={true} 
                                        />
                                    ))}
                                </nav>

                                {/* User Profile and Notifications Section */}
                                <div className="border-t border-gray-200 p-4">
                                    <div className="flex items-center justify-between">
                                        {/* User Profile Dropdown */}
                                        <div className="relative">
                                            <button 
                                                onClick={() => setOpen(!open)} 
                                                className="flex items-center group w-full"
                                            >
                                                <Avatar user={user} size="sm" />
                                                <div className="ml-3 flex-1 text-left">
                                                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {getUserTypeLabel()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {/* Notification Bell */}
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowNotifications(!showNotifications);
                                                            }}
                                                            className="p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none"
                                                        >
                                                            <span className="sr-only">View notifications</span>
                                                            <BellIcon className="h-6 w-6" aria-hidden="true" />
                                                        </button>
                                                        {unreadCount > 0 && (
                                                            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
                                                        )}
                                                    </div>
                                                    <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                                                </div>
                                            </button>

                                            <Transition
                                                show={open}
                                                enter="transition ease-out duration-200"
                                                enterFrom="transform -translate-y-1 opacity-0"
                                                enterTo="transform translate-y-0 opacity-100"
                                                leave="transition ease-in duration-150"
                                                leaveFrom="transform translate-y-0 opacity-100"
                                                leaveTo="transform -translate-y-1 opacity-0"
                                            >
                                                <div className="mt-2 border-t border-gray-200">
                                                    <Link
                                                        href={route('profile.edit')}
                                                        className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                                    >
                                                        Profile
                                                    </Link>
                                                    {(isCentralAdmin || isTenantAdmin || hasCustomNavigation) && (
                                                        <Link
                                                            href={route('dashboard')}
                                                            className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                                        >
                                                            Regular Dashboard
                                                        </Link>
                                                    )}
                                                    <Link
                                                        href={route('logout')}
                                                        method="post"
                                                        as="button"
                                                        className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                                    >
                                                        Log Out
                                                    </Link>
                                                </div>
                                            </Transition>
                                        </div>
                                    </div>

                                    {/* Notification Panel */}
                                    <Transition
                                        show={showNotifications}
                                        enter="transform transition ease-out duration-300"
                                        enterFrom="translate-x-full"
                                        enterTo="translate-x-0"
                                        leave="transform transition ease-in duration-200"
                                        leaveFrom="translate-x-0"
                                        leaveTo="translate-x-full"
                                        className="fixed inset-y-0 right-0 w-96 bg-white shadow-lg z-[100]"
                                    >
                                        <div className="h-full flex flex-col">
                                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Notifications
                                                </h3>
                                                <button
                                                    onClick={() => setShowNotifications(false)}
                                                    className="text-gray-400 hover:text-gray-500"
                                                >
                                                    <span className="sr-only">Close panel</span>
                                                    <XMarkIcon className="h-6 w-6" />
                                                </button>
                                            </div>
                                            <div className="flex-1 overflow-y-auto">
                                                <div className="divide-y divide-gray-200">
                                                    {notifications.map((notification) => (
                                                        <div
                                                            key={notification.id}
                                                            className={`p-4 ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                                                        >
                                                            <div className="flex items-start">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        {notification.title}
                                                                    </p>
                                                                    <p className="mt-1 text-sm text-gray-500">
                                                                        {notification.message}
                                                                    </p>
                                                                    <p className="mt-1 text-xs text-gray-400">
                                                                        {notification.time}
                                                                    </p>
                                                                </div>
                                                                {!notification.read && (
                                                                    <button
                                                                        onClick={() => markAsRead(notification.id)}
                                                                        className="ml-4 text-xs text-blue-600 hover:text-blue-800"
                                                                    >
                                                                        Mark as read
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </Transition>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Main content */}
            <div className="lg:pl-64">
                <main>
                    <div className="p-4">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
