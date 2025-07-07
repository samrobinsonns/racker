import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    FunnelIcon, 
    MagnifyingGlassIcon, 
    PlusIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    ArrowTrendingUpIcon,
    UserIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

export default function Index({ 
    tickets, 
    filters, 
    filterOptions, 
    stats, 
    permissions,
    auth 
}) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [activeFilters, setActiveFilters] = useState(filters);
    const [showFilters, setShowFilters] = useState(false);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== filters.search) {
                handleFilterChange('search', searchTerm);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...activeFilters, [key]: value };
        if (!value) {
            delete newFilters[key];
        }
        
        router.get(route('support-tickets.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        router.get(route('support-tickets.index'), {}, {
            preserveState: true,
        });
    };

    const getPriorityColor = (priority) => {
        const colors = {
            1: 'text-red-700 bg-red-50 ring-red-600/20',
            2: 'text-orange-700 bg-orange-50 ring-orange-600/20',
            3: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20',
            4: 'text-green-700 bg-green-50 ring-green-600/20',
            5: 'text-gray-700 bg-gray-50 ring-gray-600/20',
        };
        return colors[priority.level] || colors[3];
    };

    const getStatusColor = (status) => {
        const colors = {
            new: 'text-blue-700 bg-blue-50 ring-blue-600/20',
            open: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20',
            'in-progress': 'text-purple-700 bg-purple-50 ring-purple-600/20',
            pending: 'text-orange-700 bg-orange-50 ring-orange-600/20',
            resolved: 'text-green-700 bg-green-50 ring-green-600/20',
            closed: 'text-gray-700 bg-gray-50 ring-gray-600/20',
        };
        return colors[status.slug] || colors['open'];
    };

    const formatTimeAgo = (date) => {
        const now = new Date();
        const created = new Date(date);
        const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return created.toLocaleDateString();
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Support Tickets" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-[1920px] mx-auto">
                {/* Header Section */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Support Tickets</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage and track support requests
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        {permissions.create && (
                            <Link
                                href={route('support-tickets.create')}
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-lg font-semibold text-sm text-white hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                            >
                                <PlusIcon className="h-5 w-5 mr-2" />
                                New Ticket
                            </Link>
                        )}
                        {tickets.data.length > 0 && (
                            <button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete ALL tickets? This cannot be undone.')) {
                                        router.post(route('support-tickets.clearAll'), {}, {
                                            preserveState: true,
                                            onSuccess: () => window.location.reload(),
                                        });
                                    }
                                }}
                                className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-lg font-semibold text-sm text-white hover:bg-red-700 focus:bg-red-700 active:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition ease-in-out duration-150"
                            >
                                <XCircleIcon className="h-5 w-5 mr-2" />
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <CheckCircleIcon className="w-6 h-6 text-indigo-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <h2 className="text-sm font-medium text-gray-500">Total Tickets</h2>
                                <p className="text-2xl font-semibold text-gray-900">{stats.total || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <ClockIcon className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <h2 className="text-sm font-medium text-gray-500">Open Tickets</h2>
                                <p className="text-2xl font-semibold text-gray-900">{stats.open || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <h2 className="text-sm font-medium text-gray-500">Overdue</h2>
                                <p className="text-2xl font-semibold text-gray-900">{stats.overdue || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <h2 className="text-sm font-medium text-gray-500">Unassigned</h2>
                                <p className="text-2xl font-semibold text-gray-900">{stats.unassigned || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    {/* Search and Filter Bar */}
                    <div className="border-b border-gray-200 p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex-1 max-w-lg">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="search"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search tickets..."
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                        showFilters ? 'bg-gray-50' : ''
                                    }`}
                                >
                                    <FunnelIcon className="h-4 w-4 mr-2" />
                                    Filters
                                    {Object.keys(filters).length > 0 && (
                                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                            {Object.keys(filters).length}
                                        </span>
                                    )}
                                </button>

                                {Object.keys(filters).length > 0 && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-indigo-600 hover:text-indigo-500"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Expandable Filters */}
                        {showFilters && (
                            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {/* Status Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={activeFilters.status_id || ''}
                                        onChange={(e) => handleFilterChange('status_id', e.target.value)}
                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                                    >
                                        <option value="">All Statuses</option>
                                        {filterOptions.statuses.map(status => (
                                            <option key={status.id} value={status.id}>
                                                {status.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Priority Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select
                                        value={activeFilters.priority_id || ''}
                                        onChange={(e) => handleFilterChange('priority_id', e.target.value)}
                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                                    >
                                        <option value="">All Priorities</option>
                                        {filterOptions.priorities.map(priority => (
                                            <option key={priority.id} value={priority.id}>
                                                {priority.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Assignee Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                                    <select
                                        value={activeFilters.assignee_id || ''}
                                        onChange={(e) => handleFilterChange('assignee_id', e.target.value)}
                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                                    >
                                        <option value="">All Assignees</option>
                                        <option value="unassigned">Unassigned</option>
                                        {filterOptions.users.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tickets List */}
                    <div className="divide-y divide-gray-100">
                        {tickets.data.length > 0 ? (
                            tickets.data.map((ticket) => (
                                <Link
                                    key={ticket.id}
                                    href={route('support-tickets.show', ticket.id)}
                                    className="block hover:bg-gray-50 transition duration-150 ease-in-out p-6"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center min-w-0 flex-1">
                                            <div className="flex-shrink-0">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium ring-1 ring-inset ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.priority.name}
                                                </span>
                                            </div>
                                            <div className="ml-4 min-w-0 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-base font-medium text-gray-900 truncate">
                                                            #{ticket.ticket_number} - {ticket.subject}
                                                        </p>
                                                        <p className="mt-1 text-sm text-gray-500">
                                                            {ticket.requester_name} • {formatTimeAgo(ticket.created_at)}
                                                            {ticket.assignee && (
                                                                <span className="ml-2">
                                                                    • Assigned to {ticket.assignee.name}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        {ticket.is_escalated && (
                                                            <ArrowTrendingUpIcon className="h-5 w-5 text-red-500" />
                                                        )}
                                                        {ticket.is_overdue && (
                                                            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                                                        )}
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium ring-1 ring-inset ${getStatusColor(ticket.status)}`}>
                                                            {ticket.status.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <div className="mx-auto h-12 w-12 text-gray-400">
                                    <XCircleIcon />
                                </div>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {Object.keys(filters).length > 0 
                                        ? 'Try adjusting your filters to see more results.'
                                        : 'Get started by creating a new support ticket.'
                                    }
                                </p>
                                {permissions.create && Object.keys(filters).length === 0 && (
                                    <div className="mt-6">
                                        <Link
                                            href={route('support-tickets.create')}
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            <PlusIcon className="h-5 w-5 mr-2" />
                                            New Ticket
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {tickets.last_page > 1 && (
                        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                            <div className="flex-1 flex justify-between sm:hidden">
                                {tickets.prev_page_url && (
                                    <Link
                                        href={tickets.prev_page_url}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Previous
                                    </Link>
                                )}
                                {tickets.next_page_url && (
                                    <Link
                                        href={tickets.next_page_url}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Next
                                    </Link>
                                )}
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{tickets.from}</span> to{' '}
                                        <span className="font-medium">{tickets.to}</span> of{' '}
                                        <span className="font-medium">{tickets.total}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                                        {tickets.prev_page_url && (
                                            <Link
                                                href={tickets.prev_page_url}
                                                className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                            >
                                                <ChevronLeftIcon className="h-5 w-5" />
                                            </Link>
                                        )}
                                        
                                        {/* Page numbers would go here */}
                                        
                                        {tickets.next_page_url && (
                                            <Link
                                                href={tickets.next_page_url}
                                                className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                            >
                                                <ChevronRightIcon className="h-5 w-5" />
                                            </Link>
                                        )}
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 