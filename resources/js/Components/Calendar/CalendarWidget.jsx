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
    ChevronDownIcon,
} from '@heroicons/react/24/outline';

export default function CalendarWidget({ calendarStats, upcomingEvents = [] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showViewDropdown, setShowViewDropdown] = useState(false);
    const [currentView, setCurrentView] = useState('upcoming'); // upcoming, today, week, month

    // Ensure upcomingEvents is always an array
    const safeUpcomingEvents = Array.isArray(upcomingEvents) ? upcomingEvents : [];

    // State for month-specific events
    const [monthEvents, setMonthEvents] = useState([]);
    const [loadingMonthEvents, setLoadingMonthEvents] = useState(false);
    const [selectedCalendar, setSelectedCalendar] = useState('all');
    const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);

    // Fetch events for a specific month
    const fetchMonthEvents = async (year, month) => {
        setLoadingMonthEvents(true);
        try {
            const response = await fetch(`/calendar/events?start=${year}-${String(month + 1).padStart(2, '0')}-01&end=${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}&view=month`);
            const data = await response.json();
            setMonthEvents(data);
        } catch (error) {
            console.error('Failed to fetch month events:', error);
            setMonthEvents([]);
        } finally {
            setLoadingMonthEvents(false);
        }
    };

    // Filter events based on current view and selected calendar
    const getFilteredEvents = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const endOfWeek = new Date(today);
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        let filteredEvents;
        switch (currentView) {
            case 'today':
                filteredEvents = safeUpcomingEvents.filter(event => {
                    const eventDate = new Date(event.start_date);
                    eventDate.setHours(0, 0, 0, 0);
                    return eventDate.getTime() === today.getTime();
                });
                break;
            case 'week':
                filteredEvents = safeUpcomingEvents.filter(event => {
                    const eventDate = new Date(event.start_date);
                    return eventDate >= today && eventDate < endOfWeek;
                });
                break;
            case 'month':
                // Use month-specific events if available, otherwise fall back to upcoming events
                if (monthEvents.length > 0) {
                    filteredEvents = monthEvents;
                } else {
                    filteredEvents = safeUpcomingEvents.filter(event => {
                        const eventDate = new Date(event.start_date);
                        return eventDate >= today && eventDate <= endOfMonth;
                    });
                }
                break;
            default: // upcoming
                filteredEvents = safeUpcomingEvents;
                break;
        }

        // Apply calendar filter
        if (selectedCalendar !== 'all') {
            filteredEvents = filteredEvents.filter(event => {
                if (selectedCalendar === 'support_tickets') {
                    return event.is_support_ticket;
                }
                return event.calendar && event.calendar.id === selectedCalendar;
            });
        }

        return filteredEvents;
    };

    // Sort events by date (closest first), but prioritize support ticket events
    const filteredEvents = getFilteredEvents();
    const sortedEvents = filteredEvents
        .sort((a, b) => {
            // First, prioritize support ticket events
            if (a.is_support_ticket && !b.is_support_ticket) return -1;
            if (!a.is_support_ticket && b.is_support_ticket) return 1;
            
            // Then sort by date (closest first)
            const dateA = new Date(a.start_date);
            const dateB = new Date(b.start_date);
            const dateDiff = dateA - dateB;
            
            // If dates are the same, sort by title to ensure consistent ordering
            if (dateDiff === 0) {
                return a.title.localeCompare(b.title);
            }
            
            return dateDiff;
        })
        .slice(0, 12); // Show more events to ensure support tickets are visible

    // Debug: Log the events being passed
    useEffect(() => {
        console.log('CalendarWidget received events:', safeUpcomingEvents);
        console.log('Events type:', typeof safeUpcomingEvents);
        console.log('Is array:', Array.isArray(safeUpcomingEvents));
        console.log('Events length:', safeUpcomingEvents.length);
        console.log('Support ticket events:', safeUpcomingEvents.filter(e => e.is_support_ticket));
        console.log('Regular calendar events:', safeUpcomingEvents.filter(e => !e.is_support_ticket));
        
        // Debug: Log each support ticket event individually
        const supportTicketEvents = safeUpcomingEvents.filter(e => e.is_support_ticket);
        supportTicketEvents.forEach((event, index) => {
            console.log(`Support ticket ${index + 1}:`, {
                id: event.id,
                title: event.title,
                start_date: event.start_date,
                ticket_number: event.ticket?.ticket_number
            });
        });
        
        // Debug: Log filtered events
        const filtered = getFilteredEvents();
        console.log('Filtered events:', filtered);
        console.log('Filtered events length:', filtered.length);
    }, [safeUpcomingEvents]);

    // Debug: Log filtered and sorted events
    useEffect(() => {
        console.log('Filtered events:', filteredEvents);
        console.log('Sorted events:', sortedEvents);
    }, [filteredEvents, sortedEvents]);

    // Handle click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showViewDropdown && !event.target.closest('.view-dropdown')) {
                setShowViewDropdown(false);
            }
            if (showCalendarDropdown && !event.target.closest('.calendar-dropdown')) {
                setShowCalendarDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showViewDropdown, showCalendarDropdown]);

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

    // Get current period display
    const getPeriodDisplay = () => {
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    // Navigate to previous month
    const goToPreviousMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
        
        // If in month view, fetch events for the new month
        if (currentView === 'month') {
            fetchMonthEvents(newDate.getFullYear(), newDate.getMonth());
        }
    };

    // Navigate to next month
    const goToNextMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
        
        // If in month view, fetch events for the new month
        if (currentView === 'month') {
            fetchMonthEvents(newDate.getFullYear(), newDate.getMonth());
        }
    };

    // Handle view change
    const changeView = (view) => {
        setCurrentView(view);
        setShowViewDropdown(false);
        
        // If switching to month view, fetch the current month's events
        if (view === 'month') {
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth();
            fetchMonthEvents(currentYear, currentMonth);
        } else {
            // Clear month events when switching to other views
            setMonthEvents([]);
        }
    };

    // Get available calendars from events
    const getAvailableCalendars = () => {
        const calendars = new Map();
        calendars.set('all', { id: 'all', name: 'All Calendars', color: '#6B7280' });
        
        // Add support tickets calendar
        calendars.set('support_tickets', { 
            id: 'support_tickets', 
            name: 'Support Tickets', 
            color: '#DC2626' 
        });
        
        // Add regular calendar events - include all events from both upcoming and month events
        const allEvents = [...safeUpcomingEvents, ...monthEvents];
        allEvents.forEach(event => {
            if (event.calendar && event.calendar.id) {
                calendars.set(event.calendar.id, {
                    id: event.calendar.id,
                    name: event.calendar.name,
                    color: event.calendar.color
                });
            }
        });
        
        // Sort calendars by name for consistent ordering
        return Array.from(calendars.values()).sort((a, b) => {
            // Keep "All Calendars" and "Support Tickets" at the top
            if (a.id === 'all') return -1;
            if (b.id === 'all') return 1;
            if (a.id === 'support_tickets') return -1;
            if (b.id === 'support_tickets') return 1;
            
            // Sort other calendars alphabetically
            return a.name.localeCompare(b.name);
        });
    };

    // Get view title
    const getViewTitle = () => {
        switch (currentView) {
            case 'today':
                return 'Today';
            case 'week':
                return 'This Week';
            case 'month':
                return 'This Month';
            default:
                return 'Upcoming Events';
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <CalendarIcon className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Calendar</h3>
                        <p className="text-sm text-gray-500">
                            {calendarStats?.total_calendars || 0} calendars • {safeUpcomingEvents.length} events
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    {/* Calendar Dropdown */}
                    <div className="relative calendar-dropdown">
                        <button
                            onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 min-w-[140px] justify-between"
                        >
                            <div className="flex items-center">
                                <div 
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: getAvailableCalendars().find(c => c.id === selectedCalendar)?.color || '#6B7280' }}
                                />
                                <span className="truncate">
                                    {getAvailableCalendars().find(c => c.id === selectedCalendar)?.name || 'All Calendars'}
                                </span>
                            </div>
                            <ChevronDownIcon className="h-4 w-4 ml-1 flex-shrink-0" />
                        </button>
                        
                        {showCalendarDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                                <div className="py-1">
                                    {getAvailableCalendars().map((calendar) => (
                                        <div
                                            key={calendar.id}
                                            onClick={() => {
                                                setSelectedCalendar(calendar.id);
                                                setShowCalendarDropdown(false);
                                            }}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                        >
                                            <div 
                                                className="w-3 h-3 rounded-full mr-3"
                                                style={{ backgroundColor: calendar.color }}
                                            />
                                            {calendar.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* View Dropdown */}
                    <div className="relative view-dropdown">
                        <button
                            onClick={() => setShowViewDropdown(!showViewDropdown)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 min-w-[100px] justify-between"
                        >
                            <div className="flex items-center">
                                <EyeIcon className="h-4 w-4 mr-1" />
                                <span>View</span>
                            </div>
                            <ChevronDownIcon className="h-4 w-4 ml-1 flex-shrink-0" />
                        </button>
                        
                        {showViewDropdown && (
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                                <div className="py-1">
                                    <div
                                        onClick={() => changeView('upcoming')}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                    >
                                        Upcoming
                                    </div>
                                    <div
                                        onClick={() => changeView('today')}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                    >
                                        Today
                                    </div>
                                    <div
                                        onClick={() => changeView('week')}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                    >
                                        This Week
                                    </div>
                                    <div
                                        onClick={() => changeView('month')}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                    >
                                        This Month
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    

                </div>
            </div>

            {/* Current Month */}
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                        {currentView === 'month' ? getPeriodDisplay() : getViewTitle()}
                    </h4>
                    
                    {/* Month Navigation (only show for month view) */}
                    {currentView === 'month' && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={goToPreviousMonth}
                                className="p-1 rounded-md hover:bg-gray-100"
                                title="Previous month"
                            >
                                <ChevronLeftIcon className="h-4 w-4 text-gray-500" />
                            </button>
                            <button
                                onClick={goToNextMonth}
                                className="p-1 rounded-md hover:bg-gray-100"
                                title="Next month"
                            >
                                <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Upcoming Events List */}
            <div className="flex-1 min-h-0">
                {loadingMonthEvents && currentView === 'month' ? (
                    <div className="text-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                        <p className="text-xs text-gray-500">Loading month events...</p>
                    </div>
                ) : sortedEvents.length > 0 ? (
                    <div className="space-y-3">
                        {sortedEvents.map((event) => (
                            <div
                                key={`${event.id}-${event.is_support_ticket ? 'ticket' : 'calendar'}-${event.start_date}`}
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
                                                    : formatDate(event.start_date)
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
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <CalendarIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">No {currentView === 'upcoming' ? 'upcoming' : currentView} events</p>
                    </div>
                )}
            </div>
        </div>
    );
} 