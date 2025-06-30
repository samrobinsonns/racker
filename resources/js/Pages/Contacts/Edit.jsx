import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ContactForm from './Form/ContactForm';

export default function Edit({ contact, customFields }) {
    return (
        <AuthenticatedLayout>
            <Head title={`Edit ${contact.first_name} ${contact.last_name}`} />

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 sm:px-0 mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Edit Contact: {contact.first_name} {contact.last_name}
                    </h1>
                </div>

                <div className="bg-white shadow rounded-lg">
                    <div className="p-6">
                        <ContactForm contact={contact} customFields={customFields} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 