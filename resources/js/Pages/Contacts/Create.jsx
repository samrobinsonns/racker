import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ContactForm from './Form/ContactForm';

export default function Create({ customFields }) {
    return (
        <AuthenticatedLayout>
            <Head title="Create Contact" />

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 sm:px-0 mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Create Contact</h1>
                </div>

                <div className="bg-white shadow rounded-lg">
                    <div className="p-6">
                        <ContactForm customFields={customFields} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 