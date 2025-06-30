import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { Button } from '@/Components/ui/button';

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
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            await axios.put(route('tenant.contacts.update', contact.id), formData);
            onSuccess?.();
        } catch (error) {
            console.error('Error updating contact:', error);
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

                        {/* Addresses Section */}
                        {contact.addresses && contact.addresses.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-sm font-medium text-gray-500">Addresses</h3>
                                <div className="mt-2 space-y-4">
                                    {contact.addresses.map((address) => (
                                        <div key={address.id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
                                                    {address.is_primary && (
                                                        <span className="ml-2 text-xs text-indigo-600">(Primary)</span>
                                                    )}
                                                </span>
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
                            </div>
                        )}

                        {/* Notes Section */}
                        {contact.notes && contact.notes.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                                <div className="mt-2 space-y-4">
                                    {contact.notes.map((note) => (
                                        <div key={note.id} className="border-l-4 border-indigo-400 bg-indigo-50 p-4">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-indigo-800">
                                                    {note.user?.name || 'Unknown User'}
                                                </span>
                                                <span className="text-sm text-indigo-700">
                                                    {new Date(note.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-900">{note.note}</p>
                                        </div>
                                    ))}
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