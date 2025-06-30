import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { PencilIcon } from '@heroicons/react/24/outline';
import NotesSection from './Notes/NotesSection';
import AddressManager from './Addresses/AddressManager';
import PreferencesManager from './Communication/PreferencesManager';

const TYPE_COLORS = {
    customer: 'bg-blue-100 text-blue-800',
    lead: 'bg-yellow-100 text-yellow-800',
    vendor: 'bg-purple-100 text-purple-800',
    partner: 'bg-green-100 text-green-800',
};

const STATUS_COLORS = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    archived: 'bg-red-100 text-red-800',
};

export default function Show({ contact, tickets, notes }) {
    const [activeTab, setActiveTab] = useState('details');

    return (
        <AuthenticatedLayout>
            <Head title={`${contact.first_name} ${contact.last_name}`} />

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 sm:px-0 mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Contact Details
                    </h1>
                    <Button asChild>
                        <Link href={route('contacts.edit', contact.id)}>
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Edit Contact
                        </Link>
                    </Button>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">
                                        {contact.first_name} {contact.last_name}
                                    </h2>
                                    <div className="space-y-2">
                                        <p className="text-gray-600">{contact.email}</p>
                                        <p className="text-gray-600">{contact.phone}</p>
                                        {contact.company && (
                                            <p className="text-gray-600">
                                                {contact.company}
                                                {contact.job_title && ` - ${contact.job_title}`}
                                            </p>
                                        )}
                                        <div className="flex gap-2 pt-2">
                                            <Badge
                                                className={TYPE_COLORS[contact.type]}
                                                variant="secondary"
                                            >
                                                {contact.type}
                                            </Badge>
                                            <Badge
                                                className={STATUS_COLORS[contact.status]}
                                                variant="secondary"
                                            >
                                                {contact.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {contact.primary_address && (
                                    <div>
                                        <h3 className="font-medium text-gray-900 mb-2">
                                            Primary Address
                                        </h3>
                                        <address className="text-gray-600 not-italic">
                                            {contact.primary_address.line1}<br />
                                            {contact.primary_address.line2 && (
                                                <>{contact.primary_address.line2}<br /></>
                                            )}
                                            {contact.primary_address.city}, {contact.primary_address.state} {contact.primary_address.postal_code}<br />
                                            {contact.primary_address.country}
                                        </address>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="addresses">
                                Addresses ({contact.addresses.length})
                            </TabsTrigger>
                            <TabsTrigger value="notes">
                                Notes ({notes.length})
                            </TabsTrigger>
                            <TabsTrigger value="tickets">
                                Tickets ({tickets.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-6">
                            {contact.custom_field_values && Object.keys(contact.custom_field_values).length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Custom Fields</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {Object.entries(contact.custom_field_values).map(([key, value]) => (
                                                <div key={key}>
                                                    <dt className="font-medium text-gray-900">{key}</dt>
                                                    <dd className="text-gray-600">{value}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </CardContent>
                                </Card>
                            )}

                            {contact.notes && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Notes</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-600 whitespace-pre-wrap">
                                            {contact.notes}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="addresses">
                            <AddressManager
                                contact={contact}
                                addresses={contact.addresses}
                            />
                        </TabsContent>

                        <TabsContent value="notes">
                            <NotesSection contact={contact} notes={notes} />
                        </TabsContent>

                        <TabsContent value="tickets">
                            <Card>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-gray-200">
                                        {tickets.map((ticket) => (
                                            <div key={ticket.id} className="p-6">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="text-base font-medium">
                                                            <Link
                                                                href={route('tickets.show', ticket.id)}
                                                                className="text-gray-900 hover:text-gray-600"
                                                            >
                                                                {ticket.title}
                                                            </Link>
                                                        </h3>
                                                        <div className="mt-1 space-y-1">
                                                            <p className="text-sm text-gray-600">
                                                                Status: {ticket.status}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                Created: {new Date(ticket.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {tickets.length === 0 && (
                                            <div className="p-6 text-center text-gray-500">
                                                No tickets yet
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Communication Preferences Section */}
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <section className="max-w-xl">
                            <header>
                                <h2 className="text-lg font-medium text-gray-900">
                                    Communication Preferences
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Manage how and when we communicate with this contact.
                                </p>
                            </header>

                            <PreferencesManager
                                contact={contact}
                                preferences={contact.communication_preferences}
                            />
                        </section>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 