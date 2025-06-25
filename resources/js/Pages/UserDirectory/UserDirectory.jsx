import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

export default function UserDirectory({ pageTitle }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    User Directory
                </h2>
            }
        >
            <Head title={pageTitle || 'User Directory'} />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">User Directory</h1>
                        <p className="mt-2 text-gray-600">Manage and view user directory data</p>
                    </div>

                    {/* Main Content Area */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="text-center py-16">
                            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to User Directory</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                This is your custom User Directory page. Start building your content here.
                            </p>
                            <div className="mt-6">
                                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    Get Started
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Example Content Sections */}
                    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Feature 1 */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0">
                                    <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                                </div>
                                <h3 className="ml-3 text-lg font-medium text-gray-900">Feature One</h3>
                            </div>
                            <p className="text-gray-600">Add your first feature or content section here.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0">
                                    <DocumentTextIcon className="h-6 w-6 text-emerald-600" />
                                </div>
                                <h3 className="ml-3 text-lg font-medium text-gray-900">Feature Two</h3>
                            </div>
                            <p className="text-gray-600">Add your second feature or content section here.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0">
                                    <DocumentTextIcon className="h-6 w-6 text-purple-600" />
                                </div>
                                <h3 className="ml-3 text-lg font-medium text-gray-900">Feature Three</h3>
                            </div>
                            <p className="text-gray-600">Add your third feature or content section here.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
