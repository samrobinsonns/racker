import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Create({ categories }) {
    return (
        <AuthenticatedLayout>
            <Head title="Create Canned Response" />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h1 className="text-2xl font-semibold mb-4">Create Canned Response</h1>
                            <p>Create a new canned response.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 