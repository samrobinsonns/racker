import { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ContactList from './List/ContactList';
import ContactFilters from './List/ContactFilters';
import ContactSearch from './List/ContactSearch';
import { Button } from '@/Components/ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import ImportExportManager from './ImportExport/ImportExportManager';

export default function Index({ contacts, filters }) {
    const [searchParams, setSearchParams] = useState({
        search: filters.search || '',
        type: filters.type || '',
        status: filters.status || '',
    });

    const handleSearch = (value) => {
        const newParams = { ...searchParams, search: value };
        setSearchParams(newParams);
        router.get(route('contacts.index'), newParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilterChange = (filters) => {
        const newParams = { ...searchParams, ...filters };
        setSearchParams(newParams);
        router.get(route('contacts.index'), newParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Contacts" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Import/Export Section */}
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <section>
                            <header className="mb-6">
                                <h2 className="text-lg font-medium text-gray-900">
                                    Import & Export
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Manage your contacts data by importing from CSV or exporting to CSV.
                                </p>
                            </header>

                            <ImportExportManager />
                        </section>
                    </div>

                    {/* Existing Contacts List Section */}
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <div className="px-4 sm:px-0 mb-6 flex items-center justify-between">
                            <h1 className="text-2xl font-semibold text-gray-900">Contacts</h1>
                            <Button
                                onClick={() => router.visit(route('contacts.create'))}
                                className="inline-flex items-center"
                            >
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Add Contact
                            </Button>
                        </div>

                        <div className="bg-white shadow rounded-lg">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <ContactSearch
                                            value={searchParams.search}
                                            onChange={handleSearch}
                                        />
                                    </div>
                                    <div className="flex-shrink-0">
                                        <ContactFilters
                                            filters={searchParams}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <ContactList contacts={contacts} />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 