import { Button } from '@/Components/ui/button';
import { Link } from '@inertiajs/react';
import { TicketIcon } from '@heroicons/react/24/outline';

export default function TicketList({ tickets, contactId }) {
    if (!tickets || tickets.length === 0) {
        return (
            <div className="text-center py-12">
                <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new ticket.</p>
                <div className="mt-6">
                    <Button
                        type="button"
                        onClick={() => window.location.href = route('tenant.tickets.create', { contact_id: contactId })}
                    >
                        Create Ticket
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-500">Support Tickets</h3>
                <Button
                    type="button"
                    onClick={() => window.location.href = route('tenant.tickets.create', { contact_id: contactId })}
                    size="sm"
                >
                    Create Ticket
                </Button>
            </div>
            
            <div className="space-y-4">
                {tickets.map((ticket) => (
                    <Link
                        key={ticket.id}
                        href={route('tenant.tickets.show', ticket.id)}
                        className="block p-4 bg-white border rounded-lg hover:bg-gray-50"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">{ticket.title}</h4>
                                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{ticket.description}</p>
                            </div>
                            <div className="ml-4 flex-shrink-0 flex flex-col items-end space-y-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    ticket.status.name === 'Open' ? 'bg-green-100 text-green-800' :
                                    ticket.status.name === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                    ticket.status.name === 'Closed' ? 'bg-gray-100 text-gray-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {ticket.status.name}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    ticket.priority.name === 'High' ? 'bg-red-100 text-red-800' :
                                    ticket.priority.name === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                }`}>
                                    {ticket.priority.name}
                                </span>
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                            Created {new Date(ticket.created_at).toLocaleDateString()}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
} 