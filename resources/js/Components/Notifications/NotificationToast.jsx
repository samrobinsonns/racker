import { useState, useEffect } from 'react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    ExclamationCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

export default function NotificationToast({
    notification,
    onClose,
    duration = 5000,
    position = 'top-right',
    showProgress = true,
}) {
    const [isVisible, setIsVisible] = useState(true);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (duration > 0) {
            const startTime = Date.now();
            const endTime = startTime + duration;

            const updateProgress = () => {
                const now = Date.now();
                const remaining = Math.max(0, endTime - now);
                const newProgress = (remaining / duration) * 100;
                setProgress(newProgress);

                if (remaining > 0) {
                    requestAnimationFrame(updateProgress);
                } else {
                    handleClose();
                }
            };

            requestAnimationFrame(updateProgress);
        }
    }, [duration]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            if (onClose) onClose();
        }, 300); // Wait for fade out animation
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

    const getNotificationStyles = (type) => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    text: 'text-green-800',
                    icon: 'text-green-400',
                    progress: 'bg-green-500',
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    text: 'text-yellow-800',
                    icon: 'text-yellow-400',
                    progress: 'bg-yellow-500',
                };
            case 'error':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-800',
                    icon: 'text-red-400',
                    progress: 'bg-red-500',
                };
            case 'info':
            default:
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    text: 'text-blue-800',
                    icon: 'text-blue-400',
                    progress: 'bg-blue-500',
                };
        }
    };

    const positionClasses = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
        'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
    };

    const styles = getNotificationStyles(notification.type);
    const IconComponent = getNotificationIcon(notification.type);

    if (!isVisible) return null;

    return (
        <div
            className={`fixed ${positionClasses[position]} z-50 w-96 max-w-sm transition-all duration-300 ease-in-out ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}
        >
            <div className={`${styles.bg} ${styles.border} border rounded-lg shadow-lg overflow-hidden`}>
                {/* Progress bar */}
                {showProgress && duration > 0 && (
                    <div className="h-1 bg-gray-200">
                        <div
                            className={`h-full ${styles.progress} transition-all duration-100 ease-linear`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Content */}
                <div className="p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <IconComponent className={`h-5 w-5 ${styles.icon}`} />
                        </div>
                        <div className="ml-3 flex-1">
                            {notification.title && (
                                <p className={`text-sm font-medium ${styles.text}`}>
                                    {notification.title}
                                </p>
                            )}
                            <p className={`text-sm ${styles.text} mt-1`}>
                                {notification.message}
                            </p>
                            {notification.action && (
                                <div className="mt-3">
                                    <button
                                        onClick={notification.action.onClick}
                                        className={`text-sm font-medium ${styles.text} hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-500`}
                                    >
                                        {notification.action.text}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="ml-4 flex-shrink-0">
                            <button
                                onClick={handleClose}
                                className={`inline-flex ${styles.text} hover:${styles.text} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-500`}
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 