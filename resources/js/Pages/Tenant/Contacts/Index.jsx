import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import ContactDrawer from '@/Components/Contacts/ContactDrawer';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import debounce from 'lodash/debounce';

export default function Index({ auth, contacts }) {
    const [selectedContact, setSelectedContact] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleContactClick = (contact) => {
        setSelectedContact(contact);
        setDrawerOpen(true);
    };

    const refreshContacts = () => {
        router.reload({ only: ['contacts'] });
    };

    const handleSearch = debounce((value) => {
        router.get(route('tenant.contacts.index'), 
            { search: value }, 
            { preserveState: true }
        );
    }, 300);

    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title="Contacts" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Title Section */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h1 className="text-3xl font-bold text-gray-900">Contact Directory</h1>
                            <p className="mt-2 text-sm text-gray-600">View and manage all your contacts in one place. Use the search below to find specific contacts.</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex gap-4 items-center">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search contacts..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            handleSearch(e.target.value);
                                        }}
                                        className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    />
                                </div>
                                <Button
                                    onClick={() => router.visit(route('tenant.contacts.create'))}
                                    size="sm"
                                    className="shrink-0"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add Contact
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Contacts Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Phone
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Company
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {contacts.data.map((contact) => (
                                        <tr
                                            key={contact.id}
                                            onClick={() => handleContactClick(contact)}
                                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {contact.first_name} {contact.last_name}
                                                </div>
                                                {contact.job_title && (
                                                    <div className="text-sm text-gray-500">
                                                        {contact.job_title}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {contact.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {contact.phone || contact.mobile}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {contact.company}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {selectedContact && (
                <ContactDrawer
                    key={selectedContact.id}
                    contact={selectedContact}
                    isOpen={drawerOpen}
                    onClose={() => {
                        setDrawerOpen(false);
                        setTimeout(() => setSelectedContact(null), 300);
                    }}
                    onSuccess={() => {
                        refreshContacts();
                        setDrawerOpen(false);
                        setTimeout(() => setSelectedContact(null), 300);
                    }}
                />
            )}
        </AuthenticatedLayout>
    );
} 