import React, { useState, useEffect } from 'react';
import { debounce } from 'lodash';

export default function TicketFilters({ filters, onFilterChange }) {
    const [statuses, setStatuses] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [categories, setCategories] = useState([]);
    const [assignees, setAssignees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFilterOptions();
    }, []);

    const fetchFilterOptions = async () => {
        try {
            setLoading(true);
            const [statusesRes, prioritiesRes, categoriesRes, assigneesRes] = await Promise.all([
                fetch('/api/support-tickets/statuses'),
                fetch('/api/support-tickets/priorities'),
                fetch('/api/support-tickets/categories'),
                fetch('/api/support-tickets/assignees'),
            ]);

            const [
                { statuses: fetchedStatuses },
                { priorities: fetchedPriorities },
                { categories: fetchedCategories },
                { assignees: fetchedAssignees },
            ] = await Promise.all([
                statusesRes.json(),
                prioritiesRes.json(),
                categoriesRes.json(),
                assigneesRes.json(),
            ]);

            setStatuses(fetchedStatuses);
            setPriorities(fetchedPriorities);
            setCategories(fetchedCategories);
            setAssignees(fetchedAssignees);
        } catch (error) {
            console.error('Error fetching filter options:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = debounce((value) => {
        onFilterChange({ search: value });
    }, 300);

    const sortOptions = [
        { value: 'created_at', label: 'Created Date' },
        { value: 'updated_at', label: 'Updated Date' },
        { value: 'priority', label: 'Priority' },
        { value: 'status', label: 'Status' },
    ];

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center">
                <input
                    type="text"
                    placeholder="Search tickets..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue={filters.search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                />
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                    </label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.status_id}
                        onChange={(e) => onFilterChange({ status_id: e.target.value })}
                    >
                        <option value="">All Statuses</option>
                        {statuses.map((status) => (
                            <option key={status.id} value={status.id}>
                                {status.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Priority Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                    </label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.priority_id}
                        onChange={(e) => onFilterChange({ priority_id: e.target.value })}
                    >
                        <option value="">All Priorities</option>
                        {priorities.map((priority) => (
                            <option key={priority.id} value={priority.id}>
                                {priority.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Category Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                    </label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.category_id}
                        onChange={(e) => onFilterChange({ category_id: e.target.value })}
                    >
                        <option value="">All Categories</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Assignee Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assignee
                    </label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.assignee_id}
                        onChange={(e) => onFilterChange({ assignee_id: e.target.value })}
                    >
                        <option value="">All Assignees</option>
                        {assignees.map((assignee) => (
                            <option key={assignee.id} value={assignee.id}>
                                {assignee.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center space-x-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sort By
                    </label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.sort_by}
                        onChange={(e) => onFilterChange({ sort_by: e.target.value })}
                    >
                        {sortOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sort Direction
                    </label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.sort_direction}
                        onChange={(e) => onFilterChange({ sort_direction: e.target.value })}
                    >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                    </select>
                </div>
            </div>
        </div>
    );
} 