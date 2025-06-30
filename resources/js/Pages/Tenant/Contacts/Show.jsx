import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function Show({ auth, contact }) {
    const renderInfoSection = (title, value) => (
        <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">{title}</dt>
            <dd className="mt-1 text-sm text-gray-900">{value || 'Not specified'}</dd>
        </div>
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Contact Details
                    </h2>
                    <div className="flex items-center space-x-3">
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                        >
                            <Link href={route('tenant.contacts.edit', contact.id)}>
                                <PencilIcon className="w-4 h-4 mr-2" />
                                Edit
                            </Link>
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                if (confirm('Are you sure you want to delete this contact?')) {
                                    // Implement delete functionality
                                }
                            }}
                        >
                            <TrashIcon className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title={`${contact.first_name} ${contact.last_name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                {contact.first_name} {contact.last_name}
                            </h3>
                            {contact.job_title && contact.company && (
                                <p className="max-w-2xl mt-1 text-sm text-gray-500">
                                    {contact.job_title} at {contact.company}
                                </p>
                            )}
                        </div>
                        <div className="px-4 py-5 border-t border-gray-200 sm:px-6">
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                                {renderInfoSection('Email', contact.email)}
                                {renderInfoSection('Phone', contact.phone)}
                                {renderInfoSection('Mobile', contact.mobile)}
                                {renderInfoSection('Company', contact.company)}
                                {renderInfoSection('Department', contact.department)}
                                {renderInfoSection('Job Title', contact.job_title)}
                            </dl>
                        </div>

                        {/* Tags Section */}
                        {contact.tags && contact.tags.length > 0 && (
                            <div className="px-4 py-5 border-t border-gray-200 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Tags</dt>
                                <dd className="mt-1">
                                    <div className="flex flex-wrap gap-2">
                                        {contact.tags.map((tag) => (
                                            <span
                                                key={tag.id}
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                            >
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                </dd>
                            </div>
                        )}

                        {/* Addresses Section */}
                        {contact.addresses && contact.addresses.length > 0 && (
                            <div className="px-4 py-5 border-t border-gray-200 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Addresses</dt>
                                <dd className="mt-2 space-y-4">
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
                                </dd>
                            </div>
                        )}

                        {/* Notes Section */}
                        {contact.notes && contact.notes.length > 0 && (
                            <div className="px-4 py-5 border-t border-gray-200 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                                <dd className="mt-2 space-y-4">
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
                                </dd>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 