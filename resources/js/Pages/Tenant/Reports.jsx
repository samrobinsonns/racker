import { Head } from '@inertiajs/react';
import { ChartBarIcon, DocumentChartBarIcon, TableCellsIcon } from '@heroicons/react/24/outline';

export default function Reports({ pageTitle }) {
    return (
        <>
            <Head title={pageTitle || 'Reports'} />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                        <p className="mt-2 text-gray-600">View and generate reports for your organization</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Activity Report Card */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <ChartBarIcon className="h-8 w-8 text-emerald-600" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Activity Report
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                View your team's activity
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                                <div className="mt-5">
                                    <button className="w-full bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors">
                                        Generate Report
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Performance Report Card */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <DocumentChartBarIcon className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Performance Report
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                Track performance metrics
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                                <div className="mt-5">
                                    <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                                        Generate Report
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Summary Report Card */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <TableCellsIcon className="h-8 w-8 text-purple-600" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Summary Report
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                Overall summary data
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                                <div className="mt-5">
                                    <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
                                        Generate Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Reports */}
                    <div className="mt-8">
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Recent Reports</h3>
                            </div>
                            <div className="p-6">
                                <div className="text-center py-8">
                                    <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No reports generated yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Reports will appear here once you generate them</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
} 