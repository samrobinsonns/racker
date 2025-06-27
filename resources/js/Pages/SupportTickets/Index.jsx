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
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Support Tickets
                    </h2>
                    {permissions.create && (
                        <Link
                            href={route('support-tickets.create')}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            New Ticket
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Support Tickets" />

            {/* Statistics Dashboard */}
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Total Tickets */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                                            <CheckCircleIcon className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Tickets
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {stats.total}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Open Tickets */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                                            <ClockIcon className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Open Tickets
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {stats.open}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Overdue Tickets */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                                            <ExclamationTriangleIcon className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Overdue
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {stats.overdue}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Unassigned Tickets */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                                            <UserIcon className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Unassigned
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {stats.unassigned}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white shadow rounded-lg">
                        {/* Search and Filter Bar */}
                        <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-3">
                                        {/* Search */}
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
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Filter Toggle */}
                                        <button
                                            onClick={() => setShowFilters(!showFilters)}
                                            className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                                showFilters ? 'bg-gray-50' : ''
                                            }`}
                                        >
                                            <FunnelIcon className="h-4 w-4 mr-2" />
                                            Filters
                                        </button>

                                        {/* Active Filter Count */}
                                        {Object.keys(filters).length > 0 && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                {Object.keys(filters).length} active
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expandable Filters */}
                            {showFilters && (
                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {/* Status Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <select
                                            value={activeFilters.status_id || ''}
                                            onChange={(e) => handleFilterChange('status_id', e.target.value)}
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
                                        <label className="block text-sm font-medium text-gray-700">Priority</label>
                                        <select
                                            value={activeFilters.priority_id || ''}
                                            onChange={(e) => handleFilterChange('priority_id', e.target.value)}
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
                                        <label className="block text-sm font-medium text-gray-700">Assignee</label>
                                        <select
                                            value={activeFilters.assignee_id || ''}
                                            onChange={(e) => handleFilterChange('assignee_id', e.target.value)}
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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

                                    {/* Quick Filters */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Quick Filters</label>
                                        <div className="mt-2 space-y-2">
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={activeFilters.overdue || false}
                                                    onChange={(e) => handleFilterChange('overdue', e.target.checked)}
                                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">Overdue</span>
                                            </label>
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={activeFilters.escalated || false}
                                                    onChange={(e) => handleFilterChange('escalated', e.target.checked)}
                                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">Escalated</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Clear Filters */}
                            {Object.keys(filters).length > 0 && (
                                <div className="mt-4">
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-indigo-600 hover:text-indigo-500"
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Tickets List */}
                        <div className="overflow-hidden">
                            {tickets.data.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {tickets.data.map((ticket) => (
                                        <li key={ticket.id}>
                                            <Link
                                                href={route('support-tickets.show', ticket.id)}
                                                className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center min-w-0 flex-1">
                                                        <div className="flex-shrink-0">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${getPriorityColor(ticket.priority)}`}>
                                                                {ticket.priority.name}
                                                            </span>
                                                        </div>
                                                        <div className="ml-4 min-w-0 flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                                        #{ticket.ticket_number} - {ticket.subject}
                                                                    </p>
                                                                    <p className="text-sm text-gray-500">
                                                                        {ticket.requester_name} • {formatTimeAgo(ticket.created_at)}
                                                                        {ticket.assignee && (
                                                                            <span className="ml-2">
                                                                                • Assigned to {ticket.assignee.name}
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    {ticket.is_escalated && (
                                                                        <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />
                                                                    )}
                                                                    {ticket.is_overdue && (
                                                                        <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
                                                                    )}
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${getStatusColor(ticket.status)}`}>
                                                                        {ticket.status.name}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
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
                                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                <PlusIcon className="h-4 w-4 mr-2" />
                                                New Ticket
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {tickets.last_page > 1 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    {tickets.prev_page_url && (
                                        <Link
                                            href={tickets.prev_page_url}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Previous
                                        </Link>
                                    )}
                                    {tickets.next_page_url && (
                                        <Link
                                            href={tickets.next_page_url}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
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
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            {tickets.prev_page_url && (
                                                <Link
                                                    href={tickets.prev_page_url}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                                >
                                                    <ChevronLeftIcon className="h-5 w-5" />
                                                </Link>
                                            )}
                                            
                                            {/* Page numbers would go here */}
                                            
                                            {tickets.next_page_url && (
                                                <Link
                                                    href={tickets.next_page_url}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
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
            </div>
        </AuthenticatedLayout>
    );
} 