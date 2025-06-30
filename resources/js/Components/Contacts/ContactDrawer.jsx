import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UserCircleIcon, TicketIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { Button } from '@/Components/ui/button';
import { Link } from '@inertiajs/react';

const FormField = ({ label, value, onChange, type = "text" }) => {
    return (
        <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-500">
                {label}
            </label>
            <input
                type={type}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
        </div>
    );
};

const TabButton = ({ active, onClick, children, count }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-3 py-2 text-sm font-medium rounded-md ${
            active 
                ? 'bg-indigo-100 text-indigo-700 border-indigo-300' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
    >
        {children}
        {count !== undefined && (
            <span className={`ml-1 ${active ? 'text-indigo-600' : 'text-gray-400'}`}>
                ({count})
            </span>
        )}
    </button>
);

export default function ContactDrawer({ contact, isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        mobile: contact.mobile,
        job_title: contact.job_title,
        company: contact.company,
        department: contact.department,
        notes: contact.notes,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tickets, setTickets] = useState(contact.tickets || []);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const [addresses, setAddresses] = useState(contact.addresses || []);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        type: 'billing',
        street_1: '',
        street_2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        is_primary: false
    });

    useEffect(() => {
        console.log('Contact data in drawer:', contact);
        
        // Reset form data when contact changes
        setFormData({
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email,
            phone: contact.phone,
            mobile: contact.mobile,
            job_title: contact.job_title,
            company: contact.company,
            department: contact.department,
            notes: contact.notes,
        });

        // Initialize addresses
        setAddresses(contact.addresses || []);
        
        if (contact.tickets) {
            console.log('Tickets found:', contact.tickets);
            setTickets(contact.tickets);
        } else {
            console.log('No tickets found in contact data, loading separately...');
            loadTicketsForContact();
        }
    }, [contact]);



    const loadTicketsForContact = async () => {
        if (!contact.id || loadingTickets) return;
        
        setLoadingTickets(true);
        try {
            const response = await axios.get(route('tenant.contacts.show', contact.id));
            if (response.data && response.data.props && response.data.props.contact.tickets) {
                setTickets(response.data.props.contact.tickets);
                console.log('Loaded tickets separately:', response.data.props.contact.tickets);
            }
        } catch (error) {
            console.error('Error loading tickets for contact:', error);
        } finally {
            setLoadingTickets(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            // Prepare data with addresses
            const dataToSubmit = {
                ...formData,
                addresses: addresses
            };
            
            const response = await axios.put(route('tenant.contacts.update', contact.id), dataToSubmit);
            console.log('Contact update response:', response.data);
            
            // Close the drawer and refresh parent component
            onSuccess?.();
        } catch (error) {
            console.error('Error updating contact:', error);
            alert('Failed to update contact. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const renderContent = () => {
        if (!contact) return null;

        return (
            <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden bg-white shadow-xl">
                <div className="flex-shrink-0 px-4 py-6 sm:px-6">
                    <div className="flex items-start justify-between">
                        <h2 className="text-lg font-medium text-gray-900">
                            Contact Details
                        </h2>
                        <div className="ml-3 flex h-7 items-center">
                            <button
                                type="button"
                                className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                                onClick={onClose}
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Avatar Section */}
                <div className="flex-shrink-0 border-b border-gray-200 px-4 py-5 sm:px-6">
                    <div className="flex items-center justify-center">
                        <div className="relative">
                            <UserCircleIcon className="h-24 w-24 text-gray-300" />
                            <button
                                type="button"
                                className="absolute bottom-0 right-0 rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                <span className="sr-only">Change avatar</span>
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 text-center">
                        <div className="text-lg font-medium text-gray-900">
                            {contact.first_name} {contact.last_name}
                        </div>
                        {contact.job_title && contact.company && (
                            <div className="text-sm text-gray-500">
                                {contact.job_title} at {contact.company}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="-mb-px flex space-x-8">
                            <TabButton
                                active={activeTab === 'details'}
                                onClick={() => setActiveTab('details')}
                            >
                                Details
                            </TabButton>
                            <TabButton
                                active={activeTab === 'tickets'}
                                onClick={() => setActiveTab('tickets')}
                                count={tickets?.length || 0}
                            >
                                Tickets
                            </TabButton>
                            <TabButton
                                active={activeTab === 'notes'}
                                onClick={() => setActiveTab('notes')}
                            >
                                Notes
                            </TabButton>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-6">
                        {/* Details Tab */}
                        {activeTab === 'details' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                                    <FormField
                                        label="First Name"
                                        value={formData.first_name}
                                        onChange={(value) => handleChange('first_name', value)}
                                    />
                                    <FormField
                                        label="Last Name"
                                        value={formData.last_name}
                                        onChange={(value) => handleChange('last_name', value)}
                                    />
                                    <FormField
                                        label="Email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(value) => handleChange('email', value)}
                                    />
                                    <FormField
                                        label="Phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(value) => handleChange('phone', value)}
                                    />
                                    <FormField
                                        label="Mobile"
                                        type="tel"
                                        value={formData.mobile}
                                        onChange={(value) => handleChange('mobile', value)}
                                    />
                                    <FormField
                                        label="Job Title"
                                        value={formData.job_title}
                                        onChange={(value) => handleChange('job_title', value)}
                                    />
                                    <FormField
                                        label="Company"
                                        value={formData.company}
                                        onChange={(value) => handleChange('company', value)}
                                    />
                                    <FormField
                                        label="Department"
                                        value={formData.department}
                                        onChange={(value) => handleChange('department', value)}
                                    />
                                </div>

                                {/* Addresses Section */}
                                <div className="mt-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-medium text-gray-500">Addresses</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddressForm(!showAddressForm)}
                                            className="text-sm text-indigo-600 hover:text-indigo-900"
                                        >
                                            {showAddressForm ? 'Cancel' : 'Add Address'}
                                        </button>
                                    </div>
                                    
                                    {/* Display existing addresses */}
                                    {addresses.length > 0 && (
                                        <div className="space-y-4 mb-4">
                                            {addresses.map((address, index) => (
                                                <div key={index} className="border rounded-lg p-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
                                                            {address.is_primary && (
                                                                <span className="ml-2 text-xs text-indigo-600">(Primary)</span>
                                                            )}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newAddresses = addresses.filter((_, i) => i !== index);
                                                                setAddresses(newAddresses);
                                                            }}
                                                            className="text-red-600 hover:text-red-800 text-sm"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                    <div className="mt-2 text-sm text-gray-600">
                                                        <p>{address.street_1}</p>
                                                        {address.street_2 && <p>{address.street_2}</p>}
                                                        <p>
                                                            {address.city}, {address.state} {address.postal_code}
                                                        </p>
                                                        <p>{address.country}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add new address form */}
                                    {showAddressForm && (
                                        <div className="border rounded-lg p-4 bg-gray-50">
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Address</h4>
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500">Type</label>
                                                    <select
                                                        value={newAddress.type}
                                                        onChange={(e) => setNewAddress(prev => ({ ...prev, type: e.target.value }))}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                    >
                                                        <option value="billing">Billing</option>
                                                        <option value="shipping">Shipping</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={newAddress.is_primary}
                                                        onChange={(e) => setNewAddress(prev => ({ ...prev, is_primary: e.target.checked }))}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                    />
                                                    <label className="ml-2 block text-sm text-gray-900">Primary Address</label>
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <label className="block text-xs font-medium text-gray-500">Street Address</label>
                                                    <input
                                                        type="text"
                                                        value={newAddress.street_1}
                                                        onChange={(e) => setNewAddress(prev => ({ ...prev, street_1: e.target.value }))}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                        placeholder="123 Main Street"
                                                    />
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <label className="block text-xs font-medium text-gray-500">Street Address 2</label>
                                                    <input
                                                        type="text"
                                                        value={newAddress.street_2}
                                                        onChange={(e) => setNewAddress(prev => ({ ...prev, street_2: e.target.value }))}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                        placeholder="Apt, suite, etc. (optional)"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500">City</label>
                                                    <input
                                                        type="text"
                                                        value={newAddress.city}
                                                        onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500">State/Province</label>
                                                    <input
                                                        type="text"
                                                        value={newAddress.state}
                                                        onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500">Postal Code</label>
                                                    <input
                                                        type="text"
                                                        value={newAddress.postal_code}
                                                        onChange={(e) => setNewAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500">Country</label>
                                                    <input
                                                        type="text"
                                                        value={newAddress.country}
                                                        onChange={(e) => setNewAddress(prev => ({ ...prev, country: e.target.value }))}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                    />
                                                </div>
                                                <div className="sm:col-span-2 pt-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (newAddress.street_1.trim() && newAddress.city.trim()) {
                                                                setAddresses(prev => [...prev, newAddress]);
                                                                setNewAddress({
                                                                    type: 'billing',
                                                                    street_1: '',
                                                                    street_2: '',
                                                                    city: '',
                                                                    state: '',
                                                                    postal_code: '',
                                                                    country: '',
                                                                    is_primary: false
                                                                });
                                                                setShowAddressForm(false);
                                                            }
                                                        }}
                                                        disabled={!newAddress.street_1.trim() || !newAddress.city.trim()}
                                                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Add Address
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Tags Section */}
                                {contact.tags && contact.tags.length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="text-sm font-medium text-gray-500">Tags</h3>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {contact.tags.map((tag) => (
                                                <span
                                                    key={tag.id}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                                >
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}


                            </div>
                        )}

                        {/* Tickets Tab */}
                        {activeTab === 'tickets' && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Support Tickets</h3>
                                    <Link
                                        href={route('support-tickets.create', { contact_id: contact.id })}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Create Ticket
                                    </Link>
                                </div>
                                <div className="space-y-4">
                                    {loadingTickets ? (
                                        <div className="text-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                            <p className="mt-2 text-sm text-gray-500">Loading tickets...</p>
                                        </div>
                                    ) : tickets && tickets.length > 0 ? (
                                        tickets.map((ticket) => (
                                            <Link 
                                                key={ticket.id} 
                                                href={route('support-tickets.show', ticket.id)}
                                                className="block hover:bg-gray-50"
                                            >
                                                <div className="border rounded-lg p-4 transition duration-150 ease-in-out">
                                                    <div className="flex items-center space-x-2">
                                                        <TicketIcon className="h-5 w-5 text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-900">
                                                            #{ticket.ticket_number}
                                                        </span>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            ticket.status?.is_closed ? 'bg-gray-100 text-gray-800' :
                                                            ticket.status?.slug === 'new' ? 'bg-blue-100 text-blue-800' :
                                                            ticket.status?.slug === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                            {ticket.status?.name || 'Unknown'}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2">
                                                        <p className="text-sm text-gray-600 line-clamp-2">{ticket.subject}</p>
                                                        <div className="mt-2 text-xs text-gray-500">
                                                            Created: {new Date(ticket.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets</h3>
                                            <p className="mt-1 text-sm text-gray-500">This contact hasn't created any support tickets yet.</p>
                                            <div className="mt-6">
                                                <Link
                                                    href={route('support-tickets.create', { contact_id: contact.id })}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                >
                                                    <TicketIcon className="h-5 w-5 mr-2" />
                                                    Create First Ticket
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Notes Tab */}
                        {activeTab === 'notes' && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                                <div>
                                    <textarea
                                        value={formData.notes || ''}
                                        onChange={(e) => handleChange('notes', e.target.value)}
                                        className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        rows={8}
                                        placeholder="Add any notes about this contact..."
                                    />
                                    <p className="mt-2 text-sm text-gray-500">
                                        Notes will be saved when you click "Save Changes"
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
                    <div className="flex justify-end space-x-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            type="button"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>
            </form>
        );
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    {renderContent()}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
} 