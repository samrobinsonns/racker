import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ChartPieIcon, ArrowUpIcon, ArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function Analytics({ pageTitle }) {
    const metrics = [
        {
            name: 'Total Views',
            value: '1,234',
            change: '+12%',
            changeType: 'increase',
        },
        {
            name: 'Active Users',
            value: '89',
            change: '+8%',
            changeType: 'increase',
        },
        {
            name: 'Conversion Rate',
            value: '2.4%',
            change: '-0.2%',
            changeType: 'decrease',
        },
        {
            name: 'Revenue',
            value: '$12,345',
            change: '+15%',
            changeType: 'increase',
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Analytics
                </h2>
            }
        >
            <Head title={pageTitle || 'Analytics'} />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                        <p className="mt-2 text-gray-600">Track your organization's performance and insights</p>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        {metrics.map((metric) => (
                            <div key={metric.name} className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <ChartPieIcon className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    {metric.name}
                                                </dt>
                                                <dd className="flex items-baseline">
                                                    <div className="text-2xl font-semibold text-gray-900">
                                                        {metric.value}
                                                    </div>
                                                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                                                        metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                        {metric.changeType === 'increase' ? (
                                                            <ArrowUpIcon className="self-center flex-shrink-0 h-3 w-3" />
                                                        ) : (
                                                            <ArrowDownIcon className="self-center flex-shrink-0 h-3 w-3" />
                                                        )}
                                                        <span className="sr-only">
                                                            {metric.changeType === 'increase' ? 'Increased' : 'Decreased'} by
                                                        </span>
                                                        {metric.change}
                                                    </div>
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
                        {/* Chart 1 */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Usage Over Time</h3>
                            </div>
                            <div className="p-6">
                                <div className="text-center py-12">
                                    <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">Chart data will be displayed here</p>
                                </div>
                            </div>
                        </div>

                        {/* Chart 2 */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Performance Breakdown</h3>
                            </div>
                            <div className="p-6">
                                <div className="text-center py-12">
                                    <ChartPieIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">Pie chart will be displayed here</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                        </div>
                        <div className="p-6">
                            <div className="text-center py-8">
                                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No recent analytics activity</p>
                                <p className="text-sm text-gray-400 mt-1">Activity will appear here as data is collected</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 