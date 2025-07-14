import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';
import {
    CalendarIcon,
    ArrowLeftIcon,
    UserGroupIcon,
    EyeIcon,
    PencilIcon,
    Cog6ToothIcon,
    TrashIcon,
    PlusIcon,
    ShareIcon,
} from '@heroicons/react/24/outline';

export default function CalendarManage({ calendars, tenantUsers }) {
    const [selectedCalendar, setSelectedCalendar] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareData, setShareData] = useState({
        user_id: '',
        permission: 'view'
    });

    // Get calendar color helper
    const getCalendarColor = (color) => {
        return color || '#3B82F6';
    };

    const handleShare = async () => {
        if (!selectedCalendar || !shareData.user_id) return;

        try {
            const response = await fetch('/calendar/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    calendar_id: selectedCalendar.id,
                    user_id: shareData.user_id,
                    permission: shareData.permission,
                }),
            });

            if (response.ok) {
                setShowShareModal(false);
                setShareData({ user_id: '', permission: 'view' });
                // Reload page to refresh data
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to share calendar:', error);
        }
    };

    const handleRemoveShare = async (userId) => {
        if (!selectedCalendar) return;

        try {
            const response = await fetch('/calendar/share', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    calendar_id: selectedCalendar.id,
                    user_id: userId,
                }),
            });

            if (response.ok) {
                // Reload page to refresh data
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to remove calendar share:', error);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Manage Calendars
                    </h2>
                    <div className="flex items-center space-x-3">
                        <Link
                            href="/calendar/create"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            New Calendar
                        </Link>
                        <Link
                            href="/calendar"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                            <ArrowLeftIcon className="h-4 w-4 mr-2" />
                            Back to Calendar
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Manage Calendars" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Calendar List */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Calendars</h3>
                                
                                <div className="space-y-3">
                                    {calendars.map((calendar) => (
                                        <div
                                            key={calendar.id}
                                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                                selectedCalendar?.id === calendar.id
                                                    ? 'border-emerald-500 bg-emerald-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => setSelectedCalendar(calendar)}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className="w-4 h-4 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: getCalendarColor(calendar.color) }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {calendar.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {calendar.events_count || 0} events
                                                    </p>
                                                </div>
                                                {calendar.is_public && (
                                                    <UserGroupIcon className="h-4 w-4 text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Calendar Details */}
                        <div className="lg:col-span-2">
                            {selectedCalendar ? (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-3">
                                            <div
                                                className="w-6 h-6 rounded-full"
                                                style={{ backgroundColor: getCalendarColor(selectedCalendar.color) }}
                                            />
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {selectedCalendar.name}
                                            </h3>
                                        </div>
                                        <button
                                            onClick={() => setShowShareModal(true)}
                                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                                        >
                                            <ShareIcon className="h-4 w-4 mr-2" />
                                            Share
                                        </button>
                                    </div>

                                    {/* Calendar Info */}
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Calendar Information</h4>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-sm text-gray-500">Description:</span>
                                                <p className="text-sm text-gray-900">
                                                    {selectedCalendar.description || 'No description'}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-500">Created by:</span>
                                                <p className="text-sm text-gray-900">
                                                    {selectedCalendar.creator?.name}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-500">Visibility:</span>
                                                <p className="text-sm text-gray-900">
                                                    {selectedCalendar.is_public ? 'Public' : 'Private'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shared Users */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Shared With</h4>
                                        {selectedCalendar.shares && selectedCalendar.shares.length > 0 ? (
                                            <div className="space-y-2">
                                                {selectedCalendar.shares.map((share) => (
                                                    <div key={share.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                                <span className="text-sm font-medium text-gray-700">
                                                                    {share.shared_with_user?.name?.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {share.shared_with_user?.name}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {share.permission} access
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveShare(share.shared_with_user_id)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">Not shared with anyone</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <div className="text-center py-12">
                                        <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">Select a calendar to manage</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && selectedCalendar && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Share "{selectedCalendar.name}"
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="user_id" className="block text-sm font-medium text-gray-700">
                                        User
                                    </label>
                                    <select
                                        id="user_id"
                                        value={shareData.user_id}
                                        onChange={(e) => setShareData({ ...shareData, user_id: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    >
                                        <option value="">Select a user</option>
                                        {tenantUsers.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} ({user.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="permission" className="block text-sm font-medium text-gray-700">
                                        Permission
                                    </label>
                                    <select
                                        id="permission"
                                        value={shareData.permission}
                                        onChange={(e) => setShareData({ ...shareData, permission: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    >
                                        <option value="view">View only</option>
                                        <option value="edit">Can edit</option>
                                        <option value="admin">Full access</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setShowShareModal(false)}
                                    className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleShare}
                                    disabled={!shareData.user_id}
                                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
} 