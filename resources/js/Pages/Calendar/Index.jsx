import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState, useEffect } from 'react';
import {
    CalendarIcon,
    PlusIcon,
    Cog6ToothIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    EyeIcon,
    UserGroupIcon,
    ClockIcon,
    MapPinIcon,
    PencilIcon,
    XMarkIcon,
    TrashIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function CalendarIndex({ calendars, events, view, date, stats }) {
    const [currentView, setCurrentView] = useState(view);
    const [currentDate, setCurrentDate] = useState(new Date(date));
    const [selectedCalendars, setSelectedCalendars] = useState(
        calendars.map(cal => cal.id)
    );
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    // Debug: Log the events being received
    useEffect(() => {
        console.log('Calendar Index received events:', events);
        console.log('Events type:', typeof events);
        console.log('Is array:', Array.isArray(events));
        console.log('Events length:', events?.length);
        console.log('Support ticket events:', events?.filter(e => e.is_support_ticket));
        console.log('Regular calendar events:', events?.filter(e => !e.is_support_ticket));
        
        // Debug: Log each support ticket event individually
        const supportTicketEvents = events?.filter(e => e.is_support_ticket) || [];
        supportTicketEvents.forEach((event, index) => {
            console.log(`Support ticket ${index + 1}:`, {
                id: event.id,
                title: event.title,
                start_date: event.start_date,
                ticket_number: event.ticket?.ticket_number
            });
        });
    }, [events]);

    // Create event form
    const { data, setData, post, processing, errors, reset } = useForm({
        calendar_id: calendars.length > 0 ? calendars[0].id : '',
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        all_day: false,
        location: '',
        url: '',
    });

    // Edit event form
    const {
        data: editData,
        setData: setEditData,
        put: putEdit,
        delete: deleteEdit,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEdit
    } = useForm({
        calendar_id: '',
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        all_day: false,
        location: '',
        url: '',
    });

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
        if (typeof date === 'string') {
            date = parseLocalDate(date);
        }
        return date instanceof Date && !isNaN(date) ? date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        }) : '';
    };

    // Get calendar color helper
    const getCalendarColor = (color) => {
        return color || '#3B82F6';
    };

    // Handle event click (edit or view)
    const handleEventClick = (event) => {
        // If it's a support ticket event, navigate to the ticket
        if (event.is_support_ticket) {
            window.open(event.url, '_blank');
            return;
        }
        
        // Otherwise, open edit modal for regular calendar events
        openEditModal(event);
    };

    // Open edit modal with event data
    const openEditModal = (event) => {
        setEditingEvent(event);
        setEditData({
            calendar_id: event.calendar_id,
            title: event.title,
            description: event.description || '',
            start_date: toLocalInputValue(parseLocalDate(event.start_date)),
            end_date: toLocalInputValue(parseLocalDate(event.end_date)),
            all_day: event.all_day,
            location: event.location || '',
            url: event.url || '',
        });
        setShowEditModal(true);
    };

    // Handle edit modal submit
    const handleEditModalSubmit = (e) => {
        e.preventDefault();
        putEdit(`/calendar/events/${editingEvent.id}`, {
            onSuccess: () => {
                setShowEditModal(false);
                setEditingEvent(null);
                resetEdit();
            },
        });
    };

    // Handle edit modal delete
    const handleEditModalDelete = () => {
        if (confirm('Are you sure you want to delete this event?')) {
            deleteEdit(`/calendar/events/${editingEvent.id}`, {
                onSuccess: () => {
                    setShowEditModal(false);
                    setEditingEvent(null);
                    resetEdit();
                },
            });
        }
    };

    // Helper to format date for datetime-local input in local time
    function toLocalInputValue(date) {
        const pad = n => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    // Helper to parse 'YYYY-MM-DD HH:mm:ss' as local time
    function parseLocalDate(dateStr) {
        if (!dateStr) return new Date();
        if (dateStr.includes('T')) return new Date(dateStr); // already ISO
        const [datePart, timePart] = dateStr.split(' ');
        if (!datePart || !timePart) return new Date(dateStr);
        const [year, month, day] = datePart.split('-');
        const [hour, minute, second] = timePart.split(':');
        return new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hour),
            Number(minute),
            Number(second)
        );
    }

    // Handle calendar square click
    const handleSquareClick = (date) => {
        setSelectedDate(date);
        
        // Set to start of the day to avoid timezone issues
        const startDate = new Date(date);
        startDate.setHours(9, 0, 0, 0); // Set to 9 AM
        
        const endDate = new Date(date);
        endDate.setHours(10, 0, 0, 0); // Set to 10 AM
        
        // Format dates for datetime-local input (YYYY-MM-DDTHH:MM) in local time
        const startDateStr = toLocalInputValue(startDate);
        const endDateStr = toLocalInputValue(endDate);
        
        reset();
        setData({
            calendar_id: calendars.length > 0 ? calendars[0].id : '',
            title: '',
            description: '',
            start_date: startDateStr,
            end_date: endDateStr,
            all_day: false,
            location: '',
            url: '',
        });
        setShowCreateModal(true);
    };

    // Handle keyboard events
    const handleKeyDown = (e, date) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSquareClick(date);
        }
    };

    // Handle modal submit
    const handleModalSubmit = (e) => {
        e.preventDefault();
        post('/calendar/events', {
            onSuccess: () => {
                setShowCreateModal(false);
                reset();
            },
        });
    };

    // Navigation helpers
    const goToPreviousPeriod = () => {
        const newDate = new Date(currentDate);
        if (currentView === 'week') {
            newDate.setDate(newDate.getDate() - 7);
        } else if (currentView === 'month') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setDate(newDate.getDate() - 1);
        }
        setCurrentDate(newDate);
    };

    const goToNextPeriod = () => {
        const newDate = new Date(currentDate);
        if (currentView === 'week') {
            newDate.setDate(newDate.getDate() + 7);
        } else if (currentView === 'month') {
            newDate.setMonth(newDate.getMonth() + 1);
        } else {
            newDate.setDate(newDate.getDate() + 1);
        }
        setCurrentDate(newDate);
    };

    // Get current period display
    const getPeriodDisplay = () => {
        if (currentView === 'week') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            
            return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else if (currentView === 'month') {
            return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } else {
            return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        }
    };

    // Generate calendar grid data
    const generateCalendarGrid = () => {
        const grid = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (currentView === 'month') {
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
        } else if (currentView === 'week') {
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
        } else { // day view
            const isToday = currentDate.toDateString() === today.toDateString();
            
            grid.push([{
                date: currentDate,
                isCurrentMonth: true,
                isToday,
                events: getEventsForDate(currentDate),
            }]);
        }

        return grid;
    };

    // Get events for a specific date
    const getEventsForDate = (date) => {
        const dateStr = toLocalInputValue(date).slice(0, 10); // 'YYYY-MM-DD'
        return events.filter(event => {
            const eventDate = parseLocalDate(event.start_date);
            const eventDateStr = toLocalInputValue(eventDate).slice(0, 10);
            
            // For support ticket events, always show them (no calendar filtering)
            if (event.is_support_ticket) {
                return eventDateStr === dateStr;
            }
            
            // For regular calendar events, check if calendar is selected
            return eventDateStr === dateStr && selectedCalendars.includes(event.calendar_id);
        });
    };

    // Filter events by selected calendars (include support ticket events)
    const filteredEvents = events.filter(event => {
        // Always include support ticket events
        if (event.is_support_ticket) {
            return true;
        }
        
        // For regular calendar events, check if calendar is selected
        return selectedCalendars.includes(event.calendar_id);
    });

    const calendarGrid = generateCalendarGrid();

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Calendar
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
                            href="/calendar/create-event"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            New Event
                        </Link>
                        <Link
                            href="/calendar/manage"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                            <Cog6ToothIcon className="h-4 w-4 mr-2" />
                            Manage
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Calendar" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Calendar Navigation */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={goToPreviousPeriod}
                                    className="p-2 rounded-md hover:bg-gray-100"
                                >
                                    <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
                                </button>
                                
                                <h3 className="text-lg font-medium text-gray-900">
                                    {getPeriodDisplay()}
                                </h3>
                                
                                <button
                                    onClick={goToNextPeriod}
                                    className="p-2 rounded-md hover:bg-gray-100"
                                >
                                    <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentView('day')}
                                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                                        currentView === 'day'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Day
                                </button>
                                <button
                                    onClick={() => setCurrentView('week')}
                                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                                        currentView === 'week'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Week
                                </button>
                                <button
                                    onClick={() => setCurrentView('month')}
                                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                                        currentView === 'month'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Month
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {/* Calendar Header */}
                        {currentView === 'month' && (
                            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                    <div key={day} className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide text-center">
                                        {day}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Calendar Grid */}
                        <div className={`grid ${currentView === 'month' ? 'grid-cols-7' : currentView === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
                            {calendarGrid.map((week, weekIndex) => (
                                week.map((day, dayIndex) => (
                                    <div
                                        key={`${weekIndex}-${dayIndex}`}
                                        className={`min-h-[120px] border-r border-b border-gray-200 ${
                                            !day.isCurrentMonth ? 'bg-gray-50' : ''
                                        } ${day.isToday ? 'bg-emerald-50' : ''}`}
                                        tabIndex={0}
                                        onKeyDown={(e) => handleKeyDown(e, day.date)}
                                        onClick={() => handleSquareClick(day.date)}
                                        role="button"
                                        aria-label={`Add event for ${day.date.toLocaleDateString()}`}
                                    >
                                        <div className="p-2 h-full">
                                            <div className={`text-sm font-medium mb-1 ${
                                                !day.isCurrentMonth ? 'text-gray-400' : 
                                                day.isToday ? 'text-emerald-700' : 'text-gray-900'
                                            }`}>
                                                {day.date.getDate()}
                                            </div>
                                            
                                            {/* Events */}
                                            <div className="space-y-1">
                                                {day.events.slice(0, 3).map((event) => (
                                                    <div
                                                        key={event.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEventClick(event);
                                                        }}
                                                        className="text-xs p-1 rounded truncate cursor-pointer hover:bg-gray-100 transition-colors group relative"
                                                        style={{
                                                            backgroundColor: getCalendarColor(event.calendar?.color) + '20',
                                                            borderLeft: `3px solid ${getCalendarColor(event.calendar?.color)}`
                                                        }}
                                                    >
                                                        <div className="font-medium text-gray-900 truncate flex items-center justify-between">
                                                            <span className="flex items-center">
                                                                {event.is_support_ticket && (
                                                                    <ExclamationTriangleIcon className="h-3 w-3 mr-1 text-red-500" />
                                                                )}
                                                                {event.title}
                                                            </span>
                                                            {!event.is_support_ticket && (
                                                                <PencilIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500" />
                                                            )}
                                                        </div>
                                                        {!event.all_day && (
                                                            <div className="text-gray-500">
                                                                {formatTime(event.start_date)}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {day.events.length > 3 && (
                                                    <div className="text-xs text-gray-500 text-center">
                                                        +{day.events.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ))}
                        </div>
                    </div>

                    {/* Calendar Sidebar */}
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Calendar List */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h4 className="text-lg font-medium text-gray-900 mb-4">Calendars</h4>
                                
                                <div className="space-y-3">
                                    {/* Support Tickets Calendar (always visible) */}
                                    <div className="flex items-center space-x-3">
                                        <div className="h-4 w-4 flex-shrink-0">
                                            {/* Checkbox disabled for support tickets */}
                                        </div>
                                        <div
                                            className="w-4 h-4 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: '#DC2626' }}
                                        />
                                        <label className="text-sm font-medium text-gray-900 flex-1">
                                            Support Tickets
                                        </label>
                                        <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                    </div>
                                    
                                    {/* Regular Calendars */}
                                    {calendars.map((calendar) => (
                                        <div key={calendar.id} className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                id={`calendar-${calendar.id}`}
                                                checked={selectedCalendars.includes(calendar.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedCalendars([...selectedCalendars, calendar.id]);
                                                    } else {
                                                        setSelectedCalendars(selectedCalendars.filter(id => id !== calendar.id));
                                                    }
                                                }}
                                                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                            />
                                            <div
                                                className="w-4 h-4 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: getCalendarColor(calendar.color) }}
                                            />
                                            <label
                                                htmlFor={`calendar-${calendar.id}`}
                                                className="text-sm font-medium text-gray-900 cursor-pointer flex-1"
                                            >
                                                {calendar.name}
                                            </label>
                                            {calendar.is_public && (
                                                <UserGroupIcon className="h-4 w-4 text-gray-400" />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Quick Stats */}
                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {stats?.total_calendars || 0}
                                            </div>
                                            <div className="text-xs text-gray-500">Calendars</div>
                                        </div>
                                        <div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {filteredEvents.length}
                                            </div>
                                            <div className="text-xs text-gray-500">Events</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Upcoming Events */}
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h4 className="text-lg font-medium text-gray-900 mb-4">Upcoming Events</h4>
                                
                                {filteredEvents.length > 0 ? (
                                    <div className="space-y-4">
                                        {filteredEvents.slice(0, 10).map((event) => (
                                            <div
                                                key={event.id}
                                                onClick={() => handleEventClick(event)}
                                                className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer group"
                                            >
                                                {/* Event Color Indicator */}
                                                <div
                                                    className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                                                    style={{ backgroundColor: getCalendarColor(event.calendar?.color) }}
                                                />
                                                
                                                {/* Event Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h5 className="text-sm font-medium text-gray-900 flex items-center">
                                                                {event.is_support_ticket && (
                                                                    <ExclamationTriangleIcon className="h-3 w-3 mr-1 text-red-500" />
                                                                )}
                                                                {event.title}
                                                                {!event.is_support_ticket && (
                                                                    <PencilIcon className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500" />
                                                                )}
                                                            </h5>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {event.is_support_ticket ? 'Support Ticket' : event.calendar?.name}
                                                            </p>
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {event.all_day 
                                                                ? 'All day'
                                                                : `${formatTime(event.start_date)} - ${formatTime(event.end_date)}`
                                                            }
                                                        </div>
                                                    </div>
                                                    
                                                    {event.description && (
                                                        <p className="text-sm text-gray-600 mt-2">
                                                            {event.description}
                                                        </p>
                                                    )}
                                                    
                                                    {event.location && (
                                                        <div className="flex items-center mt-2 text-xs text-gray-500">
                                                            <MapPinIcon className="h-3 w-3 mr-1" />
                                                            <span className="truncate">{event.location}</span>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex items-center mt-2 text-xs text-gray-500">
                                                        <span>Created by {event.creator?.name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">No events found</p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            {selectedCalendars.length === 0 
                                                ? 'Select calendars to view events'
                                                : 'Create your first event to get started'
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Event Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-[32rem] shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Create Event
                                </h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleModalSubmit} className="space-y-4">
                                {/* Calendar Selection */}
                                <div>
                                    <label htmlFor="modal_calendar_id" className="block text-sm font-medium text-gray-700">
                                        Calendar
                                    </label>
                                    <select
                                        id="modal_calendar_id"
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
                                    <label htmlFor="modal_title" className="block text-sm font-medium text-gray-700">
                                        Event Title
                                    </label>
                                    <input
                                        type="text"
                                        id="modal_title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                        placeholder="Enter event title"
                                        autoFocus
                                    />
                                    {errors.title && (
                                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                                    )}
                                </div>

                                {/* Date and Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="modal_start_date" className="block text-sm font-medium text-gray-700">
                                            Start
                                        </label>
                                        <input
                                            type="datetime-local"
                                            id="modal_start_date"
                                            value={data.start_date}
                                            onChange={(e) => setData('start_date', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                        />
                                        {errors.start_date && (
                                            <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="modal_end_date" className="block text-sm font-medium text-gray-700">
                                            End
                                        </label>
                                        <input
                                            type="datetime-local"
                                            id="modal_end_date"
                                            value={data.end_date}
                                            onChange={(e) => setData('end_date', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                        />
                                        {errors.end_date && (
                                            <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                                        )}
                                    </div>
                                </div>

                                {/* All Day Event */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="modal_all_day"
                                        checked={data.all_day}
                                        onChange={(e) => setData('all_day', e.target.checked)}
                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="modal_all_day" className="ml-2 block text-sm text-gray-900">
                                        All day event
                                    </label>
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        {processing ? 'Creating...' : 'Create Event'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {showEditModal && editingEvent && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-[32rem] shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Edit Event
                                </h3>
                                <button
                                    onClick={() => { setShowEditModal(false); setEditingEvent(null); resetEdit(); }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                            <form onSubmit={handleEditModalSubmit} className="space-y-4">
                                {/* Calendar Selection */}
                                <div>
                                    <label htmlFor="edit_calendar_id" className="block text-sm font-medium text-gray-700">
                                        Calendar
                                    </label>
                                    <select
                                        id="edit_calendar_id"
                                        value={editData.calendar_id}
                                        onChange={(e) => setEditData('calendar_id', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    >
                                        {calendars.map((calendar) => (
                                            <option key={calendar.id} value={calendar.id}>
                                                {calendar.name}
                                            </option>
                                        ))}
                                    </select>
                                    {editErrors.calendar_id && (
                                        <p className="mt-1 text-sm text-red-600">{editErrors.calendar_id}</p>
                                    )}
                                </div>
                                {/* Event Title */}
                                <div>
                                    <label htmlFor="edit_title" className="block text-sm font-medium text-gray-700">
                                        Event Title
                                    </label>
                                    <input
                                        type="text"
                                        id="edit_title"
                                        value={editData.title}
                                        onChange={(e) => setEditData('title', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                        placeholder="Enter event title"
                                        autoFocus
                                    />
                                    {editErrors.title && (
                                        <p className="mt-1 text-sm text-red-600">{editErrors.title}</p>
                                    )}
                                </div>
                                {/* Date and Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="edit_start_date" className="block text-sm font-medium text-gray-700">
                                            Start
                                        </label>
                                        <input
                                            type="datetime-local"
                                            id="edit_start_date"
                                            value={editData.start_date}
                                            onChange={(e) => setEditData('start_date', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                        />
                                        {editErrors.start_date && (
                                            <p className="mt-1 text-sm text-red-600">{editErrors.start_date}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="edit_end_date" className="block text-sm font-medium text-gray-700">
                                            End
                                        </label>
                                        <input
                                            type="datetime-local"
                                            id="edit_end_date"
                                            value={editData.end_date}
                                            onChange={(e) => setEditData('end_date', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                        />
                                        {editErrors.end_date && (
                                            <p className="mt-1 text-sm text-red-600">{editErrors.end_date}</p>
                                        )}
                                    </div>
                                </div>
                                {/* All Day Event */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="edit_all_day"
                                        checked={editData.all_day}
                                        onChange={(e) => setEditData('all_day', e.target.checked)}
                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="edit_all_day" className="ml-2 block text-sm text-gray-900">
                                        All day event
                                    </label>
                                </div>
                                {/* Location */}
                                <div>
                                    <label htmlFor="edit_location" className="block text-sm font-medium text-gray-700">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        id="edit_location"
                                        value={editData.location}
                                        onChange={(e) => setEditData('location', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                        placeholder="Enter location"
                                    />
                                    {editErrors.location && (
                                        <p className="mt-1 text-sm text-red-600">{editErrors.location}</p>
                                    )}
                                </div>
                                {/* URL */}
                                <div>
                                    <label htmlFor="edit_url" className="block text-sm font-medium text-gray-700">
                                        URL
                                    </label>
                                    <input
                                        type="url"
                                        id="edit_url"
                                        value={editData.url}
                                        onChange={(e) => setEditData('url', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                        placeholder="https://example.com"
                                    />
                                    {editErrors.url && (
                                        <p className="mt-1 text-sm text-red-600">{editErrors.url}</p>
                                    )}
                                </div>
                                {/* Submit/Delete Buttons */}
                                <div className="flex justify-between items-center pt-4">
                                    <button
                                        type="button"
                                        onClick={handleEditModalDelete}
                                        disabled={editProcessing}
                                        className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                    >
                                        <TrashIcon className="h-4 w-4 mr-2" />
                                        Delete Event
                                    </button>
                                    <div className="flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => { setShowEditModal(false); setEditingEvent(null); resetEdit(); }}
                                            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={editProcessing}
                                            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            {editProcessing ? 'Updating...' : 'Update Event'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
} 