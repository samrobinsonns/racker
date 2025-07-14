import { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    CalendarIcon,
    PlusIcon,
    EyeIcon,
    ClockIcon,
    MapPinIcon,
    UserIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
    PencilIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function CalendarWidget({ calendarStats, upcomingEvents = [] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'

    // Format date helper
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format time helper
    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get calendar color helper
    const getCalendarColor = (color) => {
        return color || '#3B82F6';
    };

    // Handle event click
    const handleEventClick = (event) => {
        // If it's a support ticket event, navigate to the ticket
        if (event.is_support_ticket) {
            window.open(event.url, '_blank');
            return;
        }
        
        // Otherwise, navigate to edit event page
        router.visit(`/calendar/events/${event.id}/edit`);
    };

    // Navigation helpers
    const goToPreviousPeriod = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() - 7);
        } else {
            newDate.setMonth(newDate.getMonth() - 1);
        }
        setCurrentDate(newDate);
    };

    const goToNextPeriod = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + 7);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
    };

    // Get current period display
    const getPeriodDisplay = () => {
        if (viewMode === 'week') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            
            return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else {
            return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
    };

    // Generate calendar grid data
    const generateCalendarGrid = () => {
        const grid = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (viewMode === 'month') {
            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());

            for (let week = 0; week < 6; week++) {
                const weekData = [];
                for (let day = 0; day < 7; day++) {
                    const date = new Date(startDate);
                    date.setDate(startDate.getDate() + (week * 7) + day);
                    
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                    const isToday = date.toDateString() === today.toDateString();
                    
                    weekData.push({
                        date,
                        isCurrentMonth,
                        isToday,
                        events: getEventsForDate(date),
                    });
                }
                grid.push(weekData);
            }
        } else { // week view
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            
            for (let day = 0; day < 7; day++) {
                const date = new Date(startOfWeek);
                date.setDate(startOfWeek.getDate() + day);
                
                const isToday = date.toDateString() === today.toDateString();
                
                grid.push([{
                    date,
                    isCurrentMonth: true,
                    isToday,
                    events: getEventsForDate(date),
                }]);
            }
        }

        return grid;
    };

    // Get events for a specific date
    const getEventsForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return upcomingEvents.filter(event => {
            const eventDate = new Date(event.start_date);
            const eventDateStr = eventDate.toISOString().split('T')[0];
            return eventDateStr === dateStr;
        });
    };

    const calendarGrid = generateCalendarGrid();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <CalendarIcon className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Calendar</h3>
                        <p className="text-sm text-gray-500">
                            {calendarStats?.total_calendars || 0} calendars • {calendarStats?.upcoming_events || 0} upcoming events
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    <Link
                        href="/calendar"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View All
                    </Link>
                    
                    <Link
                        href="/calendar/create-event"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        New Event
                    </Link>
                </div>
            </div>

            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={goToPreviousPeriod}
                        className="p-1 rounded-md hover:bg-gray-100"
                    >
                        <ChevronLeftIcon className="h-4 w-4 text-gray-500" />
                    </button>
                    
                    <h4 className="text-sm font-medium text-gray-900">
                        {getPeriodDisplay()}
                    </h4>
                    
                    <button
                        onClick={goToNextPeriod}
                        className="p-1 rounded-md hover:bg-gray-100"
                    >
                        <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                    </button>
                </div>
                
                <div className="flex items-center space-x-1">
                    <button
                        onClick={() => setViewMode('week')}
                        className={`px-2 py-1 text-xs font-medium rounded ${
                            viewMode === 'week'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Week
                    </button>
                    <button
                        onClick={() => setViewMode('month')}
                        className={`px-2 py-1 text-xs font-medium rounded ${
                            viewMode === 'month'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Month
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Calendar Header */}
                {viewMode === 'month' && (
                    <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                            <div key={day} className="px-1 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide text-center">
                                {day}
                            </div>
                        ))}
                    </div>
                )}

                {/* Calendar Grid */}
                <div className={`grid ${viewMode === 'month' ? 'grid-cols-7' : 'grid-cols-7'}`}>
                    {calendarGrid.map((week, weekIndex) => (
                        week.map((day, dayIndex) => (
                            <div
                                key={`${weekIndex}-${dayIndex}`}
                                className={`min-h-[80px] border-r border-b border-gray-200 ${
                                    !day.isCurrentMonth ? 'bg-gray-50' : ''
                                } ${day.isToday ? 'bg-emerald-50' : ''}`}
                            >
                                <div className="p-1">
                                    <div className={`text-xs font-medium mb-1 ${
                                        !day.isCurrentMonth ? 'text-gray-400' : 
                                        day.isToday ? 'text-emerald-700' : 'text-gray-900'
                                    }`}>
                                        {day.date.getDate()}
                                    </div>
                                    
                                    {/* Events */}
                                    <div className="space-y-0.5">
                                        {day.events.slice(0, 2).map((event) => (
                                            <div
                                                key={event.id}
                                                onClick={() => handleEventClick(event)}
                                                className="text-xs p-0.5 rounded truncate cursor-pointer hover:bg-gray-100 transition-colors group"
                                                style={{
                                                    backgroundColor: getCalendarColor(event.calendar?.color) + '20',
                                                    borderLeft: `2px solid ${getCalendarColor(event.calendar?.color)}`
                                                }}
                                            >
                                                <div className="font-medium text-gray-900 truncate text-xs flex items-center justify-between">
                                                    <span className="flex items-center">
                                                        {event.is_support_ticket && (
                                                            <ExclamationTriangleIcon className="h-2 w-2 mr-0.5 text-red-500" />
                                                        )}
                                                        {event.title}
                                                    </span>
                                                    {!event.is_support_ticket && (
                                                        <PencilIcon className="h-2 w-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {day.events.length > 2 && (
                                            <div className="text-xs text-gray-500 text-center">
                                                +{day.events.length - 2}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ))}
                </div>
            </div>

            {/* Upcoming Events */}
            <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Upcoming Events</h5>
                
                {upcomingEvents.length > 0 ? (
                    upcomingEvents.slice(0, 3).map((event) => (
                        <div
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group"
                        >
                            {/* Event Color Indicator */}
                            <div
                                className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                                style={{ backgroundColor: getCalendarColor(event.calendar?.color) }}
                            />
                            
                            {/* Event Details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h6 className="text-sm font-medium text-gray-900 truncate flex items-center">
                                            {event.is_support_ticket && (
                                                <ExclamationTriangleIcon className="h-3 w-3 mr-1 text-red-500" />
                                            )}
                                            {event.title}
                                            {!event.is_support_ticket && (
                                                <PencilIcon className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500" />
                                            )}
                                        </h6>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {event.is_support_ticket ? 'Support Ticket' : event.calendar?.name}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                                        <ClockIcon className="h-3 w-3" />
                                        <span>
                                            {event.all_day 
                                                ? 'All day'
                                                : formatTime(event.start_date)
                                            }
                                        </span>
                                    </div>
                                </div>
                                
                                {event.location && (
                                    <div className="flex items-center mt-1 text-xs text-gray-500">
                                        <MapPinIcon className="h-3 w-3 mr-1" />
                                        <span className="truncate">{event.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-6">
                        <CalendarIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">No upcoming events</p>
                    </div>
                )}
            </div>
        </div>
    );
} 