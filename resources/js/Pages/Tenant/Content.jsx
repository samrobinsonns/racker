import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DocumentTextIcon, FolderIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function Content({ pageTitle }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Content
                </h2>
            }
        >
            <Head title={pageTitle || 'Content'} />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Content</h1>
                            <p className="mt-2 text-gray-600">Manage your organization's content and documents</p>
                        </div>
                        <button className="inline-flex items-center px-4 py-2 bg-emerald-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-emerald-700 transition ease-in-out duration-150">
                            <PlusIcon className="h-4 w-4 mr-2" />
                            New Content
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white shadow rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Categories</h3>
                                <nav className="space-y-2">
                                    <a href="#" className="flex items-center px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-md">
                                        <FolderIcon className="h-4 w-4 mr-3" />
                                        All Content
                                    </a>
                                    <a href="#" className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md">
                                        <FolderIcon className="h-4 w-4 mr-3" />
                                        Documents
                                    </a>
                                    <a href="#" className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md">
                                        <FolderIcon className="h-4 w-4 mr-3" />
                                        Images
                                    </a>
                                    <a href="#" className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md">
                                        <FolderIcon className="h-4 w-4 mr-3" />
                                        Templates
                                    </a>
                                </nav>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium text-gray-900">Recent Content</h3>
                                        <div className="flex space-x-2">
                                            <button className="text-sm text-gray-500 hover:text-gray-700">List</button>
                                            <button className="text-sm text-gray-500 hover:text-gray-700">Grid</button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="text-center py-12">
                                        <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
                                        <p className="text-gray-500 mb-6">Get started by creating your first piece of content</p>
                                        <button className="inline-flex items-center px-4 py-2 bg-emerald-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-emerald-700 transition ease-in-out duration-150">
                                            <PlusIcon className="h-4 w-4 mr-2" />
                                            Create Content
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 