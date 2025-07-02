import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import NotificationToast from './NotificationToast';
import Echo from 'laravel-echo';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export default function NotificationProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Add a toast notification
    const addToast = useCallback((notification) => {
        const id = Date.now() + Math.random();
        const newToast = {
            id,
            ...notification,
            duration: notification.duration || 5000,
            position: notification.position || 'top-right',
        };

        setToasts(prev => [...prev, newToast]);

        // Auto-remove after duration
        if (newToast.duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, newToast.duration);
        }

        return id;
    }, []);

    // Remove a toast notification
    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    // Add a persistent notification
    const addNotification = useCallback((notification) => {
        // Use the provided ID if it exists (for real-time notifications), otherwise generate one
        const id = notification.id || Date.now() + Math.random();
        const newNotification = {
            id,
            read_at: notification.read_at || null,
            created_at: notification.created_at || new Date().toISOString(),
            ...notification,
        };

        setNotifications(prev => {
            // Check if notification with this ID already exists
            const exists = prev.some(n => n.id === id);
            if (exists) {
                console.log('Notification already exists, skipping:', id);
                return prev;
            }
            return [newNotification, ...prev];
        });
        
        // Only increment unread count if the notification is unread
        if (!notification.read_at) {
            setUnreadCount(prev => prev + 1);
        }

        return id;
    }, []);

    // Mark notification as read
    const markAsRead = useCallback((id) => {
        setNotifications(prev => 
            prev.map(notification => 
                notification.id === id 
                    ? { ...notification, read_at: new Date().toISOString() }
                    : notification
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(() => {
        setNotifications(prev => 
            prev.map(notification => ({
                ...notification,
                read_at: notification.read_at || new Date().toISOString()
            }))
        );
        setUnreadCount(0);
    }, []);

    // Delete a notification
    const deleteNotification = useCallback((id) => {
        setNotifications(prev => {
            const notification = prev.find(n => n.id === id);
            if (notification && !notification.read_at) {
                setUnreadCount(count => Math.max(0, count - 1));
            }
            return prev.filter(n => n.id !== id);
        });
    }, []);

    // Clear all notifications
    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    // Load notifications from API (for initial load)
    const loadNotifications = useCallback((notifications, unreadCount) => {
        setNotifications(notifications || []);
        setUnreadCount(unreadCount || 0);
    }, []);

    // Convenience methods for different notification types
    const success = useCallback((message, options = {}) => {
        return addToast({
            type: 'success',
            message,
            ...options,
        });
    }, [addToast]);

    const error = useCallback((message, options = {}) => {
        return addToast({
            type: 'error',
            message,
            ...options,
        });
    }, [addToast]);

    const warning = useCallback((message, options = {}) => {
        return addToast({
            type: 'warning',
            message,
            ...options,
        });
    }, [addToast]);

    const info = useCallback((message, options = {}) => {
        return addToast({
            type: 'info',
            message,
            ...options,
        });
    }, [addToast]);

    // Listen for real-time notifications
    useEffect(() => {
        console.log('Setting up real-time notification listener...');
        console.log('Echo available:', !!window.Echo);
        
        // Get user ID from window.auth
        const userId = window.auth?.user?.id;
        console.log('Auth user ID:', userId);
        
        // Check if Echo is available and user is authenticated
        if (window.Echo && userId) {
            console.log('User ID found:', userId);
            
            // Listen for new notifications on the user's private channel
            const channel = window.Echo.private(`notifications.${userId}`);
            console.log('Channel created:', `notifications.${userId}`);
            
            // Test the connection
            channel.subscribed(() => {
                console.log('Successfully subscribed to notification channel');
            });
            
            channel.error((error) => {
                console.error('Error subscribing to notification channel:', error);
            });
            
            channel.listen('.NotificationCreated', (event) => {
                console.log('Real-time notification received (with dot):', event);
                const notification = event;
                
                console.log('Adding notification to list:', {
                    id: notification.id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    read_at: notification.read_at
                });
                
                // Add the notification to the list
                addNotification({
                    id: notification.id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    action_url: notification.action_url,
                    action_text: notification.action_text,
                    metadata: notification.metadata,
                    created_at: notification.created_at,
                    read_at: notification.read_at,
                });

                // Also show a toast for immediate feedback
                addToast({
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    action_url: notification.action_url,
                    action_text: notification.action_text,
                    duration: 8000, // Show for 8 seconds for important notifications
                });
            });

            // Also listen for the event without the dot prefix
            channel.listen('NotificationCreated', (event) => {
                console.log('Real-time notification received (no dot):', event);
                const notification = event;
                
                console.log('Adding notification to list:', {
                    id: notification.id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    read_at: notification.read_at
                });
                
                // Add the notification to the list
                addNotification({
                    id: notification.id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    action_url: notification.action_url,
                    action_text: notification.action_text,
                    metadata: notification.metadata,
                    created_at: notification.created_at,
                    read_at: notification.read_at,
                });

                // Also show a toast for immediate feedback
                addToast({
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    action_url: notification.action_url,
                    action_text: notification.action_text,
                    duration: 8000, // Show for 8 seconds for important notifications
                });
            });

            // Cleanup function
            return () => {
                console.log('Cleaning up notification listeners');
                channel.stopListening('.NotificationCreated');
                channel.stopListening('NotificationCreated');
            };
        } else {
            console.log('Echo not available or user not authenticated, skipping real-time notifications');
        }
    }, [addNotification, addToast]);

    const value = {
        // Toast notifications
        addToast,
        removeToast,
        toasts,
        
        // Persistent notifications
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        loadNotifications,
        notifications,
        unreadCount,
        
        // Convenience methods
        success,
        error,
        warning,
        info,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            
            {/* Render all active toasts */}
            {toasts.map(toast => (
                <NotificationToast
                    key={toast.id}
                    notification={toast}
                    onClose={() => removeToast(toast.id)}
                    duration={toast.duration}
                    position={toast.position}
                />
            ))}
        </NotificationContext.Provider>
    );
} 