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
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold leading-tight text-gray-900">
                            Contact Management
                        </h2>
                        <p className="text-sm text-gray-600">
                            Manage your contacts, import/export data, and more.
                        </p>
                    </div>
                    <Button
                        onClick={() => router.visit(route('contacts.create'))}
                        className="inline-flex items-center"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Contact
                    </Button>
                </div>
            }
        >
            <Head title="Contacts" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white shadow-sm rounded-lg mb-6">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1">
                                    <ContactSearch
                                        value={searchParams.search}
                                        onChange={handleSearch}
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <ContactFilters
                                        filters={searchParams}
                                        onChange={handleFilterChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <ContactList contacts={contacts} />
                    </div>

                    <div className="bg-white shadow-sm rounded-lg p-4">
                        <section>
                            <header className="mb-4">
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 