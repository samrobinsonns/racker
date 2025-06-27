import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TicketList from '@/Components/SupportTickets/TicketList';
import TicketFilters from '@/Components/SupportTickets/TicketFilters';
import TicketStats from '@/Components/SupportTickets/TicketStats';
import CreateTicketModal from '@/Components/SupportTickets/CreateTicketModal';
import usePermissions from '@/Hooks/usePermissions';

export default function Dashboard({ auth }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status_id: '',
        priority_id: '',
        category_id: '',
        assignee_id: '',
        search: '',
        sort_by: 'created_at',
        sort_direction: 'desc',
        per_page: 15,
    });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { hasPermission } = usePermissions();

    // Fetch tickets when filters change
    useEffect(() => {
        fetchTickets();
    }, [filters]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`/api/support-tickets?${queryParams}`, {
                headers: {
                    'Accept': 'application/json',
                },
            });
            const data = await response.json();
            
            if (data.success) {
                setTickets(data.tickets);
            } else {
                console.error('Failed to fetch tickets:', data.message);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleCreateTicket = async (ticketData) => {
        try {
            const response = await fetch('/api/support-tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(ticketData),
            });
            const data = await response.json();
            
            if (data.success) {
                setShowCreateModal(false);
                fetchTickets(); // Refresh ticket list
            } else {
                console.error('Failed to create ticket:', data.message);
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Support Tickets
                    </h2>
                    {hasPermission('create_support_tickets') && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Create Ticket
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Support Tickets" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Stats Section */}
                    <div className="mb-6">
                        <TicketStats />
                    </div>

                    {/* Filters Section */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <TicketFilters
                                filters={filters}
                                onFilterChange={handleFilterChange}
                            />
                        </div>
                    </div>

                    {/* Tickets List */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <TicketList
                                tickets={tickets}
                                loading={loading}
                                onRefresh={fetchTickets}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Ticket Modal */}
            <CreateTicketModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreateTicket}
            />
        </AuthenticatedLayout>
    );
} 