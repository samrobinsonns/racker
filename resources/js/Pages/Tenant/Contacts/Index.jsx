import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import ContactDrawer from '@/Components/Contacts/ContactDrawer';

export default function Index({ auth, contacts }) {
    const [selectedContact, setSelectedContact] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleContactClick = (contact) => {
        setSelectedContact(contact);
        setDrawerOpen(true);
    };

    const refreshContacts = () => {
        router.reload({ only: ['contacts'] });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Contacts
                    </h2>
                    <Button
                        onClick={() => window.location.href = route('tenant.contacts.create')}
                    >
                        Add Contact
                    </Button>
                </div>
            }
        >
            <Head title="Contacts" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
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