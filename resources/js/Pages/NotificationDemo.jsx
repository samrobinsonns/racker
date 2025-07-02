import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useNotifications } from '@/Components/Notifications/NotificationProvider';
import { useState } from 'react';

export default function NotificationDemo({ auth }) {
    const { success, error, warning, info, addNotification } = useNotifications();
    const [notificationMessage, setNotificationMessage] = useState('This is a test notification');
    const [notificationTitle, setNotificationTitle] = useState('Test Title');

    const handleToastNotification = (type) => {
        switch (type) {
            case 'success':
                success(notificationMessage, { title: notificationTitle });
                break;
            case 'error':
                error(notificationMessage, { title: notificationTitle });
                break;
            case 'warning':
                warning(notificationMessage, { title: notificationTitle });
                break;
            case 'info':
                info(notificationMessage, { title: notificationTitle });
                break;
        }
    };

    const handlePersistentNotification = (type) => {
        addNotification({
            type,
            title: notificationTitle,
            message: notificationMessage,
            action_url: '/dashboard',
            action_text: 'View Dashboard',
        });
    };

    const handleRealTimeNotification = () => {
        router.post(route('test-notification'), {}, {
            onSuccess: () => {
                console.log('Real-time notification test sent');
            },
            onError: (errors) => {
                console.error('Error sending real-time notification:', errors);
            }
        });
    };

    const handleStatusChangeNotification = () => {
        router.post(route('test-status-change-notification'), {}, {
            onSuccess: () => {
                console.log('Status change notification test sent');
            },
            onError: (errors) => {
                console.error('Error sending status change notification:', errors);
            }
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Notification Demo</h2>}
        >
            <Head title="Notification Demo" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h3 className="text-lg font-medium mb-4">Notification System Demo</h3>
                            
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notification Title
                                </label>
                                <input
                                    type="text"
                                    value={notificationTitle}
                                    onChange={(e) => setNotificationTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notification Message
                                </label>
                                <textarea
                                    value={notificationMessage}
                                    onChange={(e) => setNotificationMessage(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Toast Notifications */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-gray-900 mb-3">Toast Notifications</h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                        These appear temporarily and auto-dismiss after 5 seconds.
                                    </p>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handleToastNotification('success')}
                                            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                                        >
                                            Success Toast
                                        </button>
                                        <button
                                            onClick={() => handleToastNotification('error')}
                                            className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                                        >
                                            Error Toast
                                        </button>
                                        <button
                                            onClick={() => handleToastNotification('warning')}
                                            className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                                        >
                                            Warning Toast
                                        </button>
                                        <button
                                            onClick={() => handleToastNotification('info')}
                                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            Info Toast
                                        </button>
                                    </div>
                                </div>

                                {/* Persistent Notifications */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-gray-900 mb-3">Persistent Notifications</h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                        These are stored and appear in the notification center.
                                    </p>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handlePersistentNotification('success')}
                                            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                                        >
                                            Success Notification
                                        </button>
                                        <button
                                            onClick={() => handlePersistentNotification('error')}
                                            className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                                        >
                                            Error Notification
                                        </button>
                                        <button
                                            onClick={() => handlePersistentNotification('warning')}
                                            className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                                        >
                                            Warning Notification
                                        </button>
                                        <button
                                            onClick={() => handlePersistentNotification('info')}
                                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            Info Notification
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Real-time Notification Test */}
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <h4 className="font-medium text-purple-900 mb-3">Real-time Notification Test</h4>
                                <p className="text-sm text-purple-700 mb-4">
                                    This will send a notification via WebSocket that should appear immediately without page refresh.
                                </p>
                                <button
                                    onClick={handleRealTimeNotification}
                                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                                >
                                    Send Real-time Notification
                                </button>
                            </div>

                            {/* Status Change Notification Test */}
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mt-4">
                                <h4 className="font-medium text-orange-900 mb-3">Ticket Status Change Notification Test</h4>
                                <p className="text-sm text-orange-700 mb-4">
                                    This will simulate a ticket status change notification for a ticket assigned to you.
                                </p>
                                <button
                                    onClick={handleStatusChangeNotification}
                                    className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                                >
                                    Send Status Change Notification
                                </button>
                            </div>

                            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-2">How to Use</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• Click the bell icon in the top navigation to view notifications</li>
                                    <li>• Toast notifications appear temporarily and auto-dismiss</li>
                                    <li>• Persistent notifications are stored and can be managed</li>
                                    <li>• Real-time notifications appear instantly without page refresh</li>
                                    <li>• You can mark notifications as read or delete them</li>
                                    <li>• The notification center shows unread count and recent notifications</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 