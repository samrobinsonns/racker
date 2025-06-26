import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import ChatInterface from '@/Components/Messaging/ChatInterface';

export default function Messages({ auth }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Messages
                    </h2>
                    <div className="text-sm text-gray-600">
                        Real-time messaging system
                    </div>
                </div>
            }
        >
            <Head title="Messages" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg" style={{ height: 'calc(100vh - 200px)' }}>
                        <ChatInterface className="h-full" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 