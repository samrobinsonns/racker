import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';
import {
    CalendarIcon,
    ArrowLeftIcon,
    ClockIcon,
    MapPinIcon,
    LinkIcon,
} from '@heroicons/react/24/outline';

export default function CalendarCreateEvent({ calendars }) {
    const [allDay, setAllDay] = useState(false);
    
    const { data, setData, post, processing, errors } = useForm({
        calendar_id: calendars.length > 0 ? calendars[0].id : '',
        title: '',
        description: '',
        start_date: new Date().toISOString().slice(0, 16),
        end_date: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
        all_day: false,
        location: '',
        url: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/calendar/events');
    };

    const handleAllDayChange = (checked) => {
        setAllDay(checked);
        setData('all_day', checked);
        
        if (checked) {
            // Set to start of day and end of day
            const startDate = new Date(data.start_date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(data.end_date);
            endDate.setHours(23, 59, 59, 999);
            
            setData('start_date', startDate.toISOString().slice(0, 16));
            setData('end_date', endDate.toISOString().slice(0, 16));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Create Event
                    </h2>
                    <Link
                        href="/calendar"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Back to Calendar
                    </Link>
                </div>
            }
        >
            <Head title="Create Event" />

            <div className="py-6">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Calendar Selection */}
                            <div>
                                <label htmlFor="calendar_id" className="block text-sm font-medium text-gray-700">
                                    Calendar
                                </label>
                                <select
                                    id="calendar_id"
                                    value={data.calendar_id}
                                    onChange={(e) => setData('calendar_id', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                >
                                    {calendars.map((calendar) => (
                                        <option key={calendar.id} value={calendar.id}>
                                            {calendar.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.calendar_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.calendar_id}</p>
                                )}
                            </div>

                            {/* Event Title */}
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                    Event Title
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    placeholder="Enter event title"
                                />
                                {errors.title && (
                                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                                )}
                            </div>

                            {/* Event Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    placeholder="Optional description"
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                )}
                            </div>

                            {/* All Day Event */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="all_day"
                                    checked={allDay}
                                    onChange={(e) => handleAllDayChange(e.target.checked)}
                                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                />
                                <label htmlFor="all_day" className="ml-2 block text-sm text-gray-900">
                                    All day event
                                </label>
                            </div>

                            {/* Date and Time */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                                        Start Date & Time
                                    </label>
                                    <input
                                        type={allDay ? "date" : "datetime-local"}
                                        id="start_date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    />
                                    {errors.start_date && (
                                        <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                                        End Date & Time
                                    </label>
                                    <input
                                        type={allDay ? "date" : "datetime-local"}
                                        id="end_date"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    />
                                    {errors.end_date && (
                                        <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                                    )}
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                                    Location
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPinIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        id="location"
                                        value={data.location}
                                        onChange={(e) => setData('location', e.target.value)}
                                        className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                        placeholder="Enter location"
                                    />
                                </div>
                                {errors.location && (
                                    <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                                )}
                            </div>

                            {/* URL */}
                            <div>
                                <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                                    URL
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LinkIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="url"
                                        id="url"
                                        value={data.url}
                                        onChange={(e) => setData('url', e.target.value)}
                                        className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                        placeholder="https://example.com"
                                    />
                                </div>
                                {errors.url && (
                                    <p className="mt-1 text-sm text-red-600">{errors.url}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end space-x-3">
                                <Link
                                    href="/calendar"
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                                >
                                    {processing ? 'Creating...' : 'Create Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 