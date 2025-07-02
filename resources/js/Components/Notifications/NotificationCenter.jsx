import { useState, useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';
import {
    BellIcon,
    XMarkIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    ExclamationCircleIcon,
    ClockIcon,
    EyeIcon,
    EyeSlashIcon,
} from '@heroicons/react/24/outline';
import * as HeroIcons from '@heroicons/react/24/outline';

export default function NotificationCenter({ 
    notifications = [], 
    unreadCount = 0,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete,
    onRefresh,
    maxNotifications = 10,
    showBadge = true,
    position = 'top-right',
    theme = 'default'
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-close after 5 seconds if opened
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsOpen(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleMarkAsRead = async (notificationId) => {
        if (onMarkAsRead) {
            setIsLoading(true);
            try {
                await onMarkAsRead(notificationId);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleMarkAllAsRead = async () => {
        if (onMarkAllAsRead) {
            setIsLoading(true);
            try {
                await onMarkAllAsRead();
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleDelete = async (notificationId) => {
        if (onDelete) {
            setIsLoading(true);
            try {
                await onDelete(notificationId);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success':
                return CheckCircleIcon;
            case 'warning':
                return ExclamationTriangleIcon;
            case 'error':
                return ExclamationCircleIcon;
            case 'info':
            default:
                return InformationCircleIcon;
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'success':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'warning':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'error':
                return 'text-red-600 bg-red-50 border-red-200';
            case 'info':
            default:
                return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return time.toLocaleDateString();
    };

    const positionClasses = {
        'top-right': 'top-0 right-0',
        'top-left': 'top-0 left-0',
        'bottom-right': 'bottom-0 right-0',
        'bottom-left': 'bottom-0 left-0',
    };

    const themeClasses = {
        default: 'bg-white border-gray-200',
        dark: 'bg-gray-800 border-gray-700 text-white',
        primary: 'bg-blue-50 border-blue-200',
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-md transition-colors duration-200 ${
                    theme === 'dark' 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                disabled={isLoading}
            >
                <BellIcon className="h-6 w-6" />
                
                {/* Badge for unread notifications */}
                {showBadge && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <div className={`absolute ${positionClasses[position]} mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden`}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Notifications
                        </h3>
                        <div className="flex items-center space-x-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    disabled={isLoading}
                                    className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                >
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                        {!notifications || notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                <BellIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No notifications</p>
                                <p className="text-sm">You're all caught up!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {notifications.slice(0, maxNotifications).map((notification) => {
                                    const IconComponent = getNotificationIcon(notification.type);
                                    const colorClasses = getNotificationColor(notification.type);
                                    
                                    return (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-gray-50 transition-colors duration-150 ${
                                                !notification.read_at ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <div className="flex items-start space-x-3">
                                                {/* Icon */}
                                                <div className={`flex-shrink-0 p-1 rounded-full ${colorClasses}`}>
                                                    <IconComponent className="h-4 w-4" />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {notification.title}
                                                            </p>
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                {notification.message}
                                                            </p>
                                                            <div className="flex items-center mt-2 space-x-4">
                                                                <span className="text-xs text-gray-400 flex items-center">
                                                                    <ClockIcon className="h-3 w-3 mr-1" />
                                                                    {formatTimeAgo(notification.created_at)}
                                                                </span>
                                                                {notification.action_url && (
                                                                    <Link
                                                                        href={notification.action_url}
                                                                        className="text-xs text-blue-600 hover:text-blue-800"
                                                                        onClick={() => setIsOpen(false)}
                                                                    >
                                                                        View Details
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center space-x-1 ml-2">
                                                            {!notification.read_at && (
                                                                <button
                                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                                    disabled={isLoading}
                                                                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                                                    title="Mark as read"
                                                                >
                                                                    <EyeIcon className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDelete(notification.id)}
                                                                disabled={isLoading}
                                                                className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                                                                title="Delete notification"
                                                            >
                                                                <XMarkIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications && notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    {unreadCount} unread of {notifications.length} total
                                </span>
                                {onRefresh && (
                                    <button
                                        onClick={onRefresh}
                                        disabled={isLoading}
                                        className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                    >
                                        Refresh
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 