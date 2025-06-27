import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import TenantAdminLayout from '@/Layouts/TenantAdminLayout';
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

export default function Index({ analytics, period }) {
    const { data, setData, get, processing } = useForm({
        period: period,
    });

    const handlePeriodChange = (e) => {
        const newPeriod = e.target.value;
        setData('period', newPeriod);
        get(route('tenant-admin.support-tickets.analytics'), {
            data: { period: newPeriod },
            preserveState: true,
        });
    };

    // Prepare data for category chart
    const categoryData = {
        labels: Object.keys(analytics.tickets_by_category),
        datasets: [
            {
                data: Object.values(analytics.tickets_by_category),
                backgroundColor: [
                    '#3B82F6', // blue
                    '#10B981', // green
                    '#F59E0B', // yellow
                    '#EF4444', // red
                    '#8B5CF6', // purple
                    '#EC4899', // pink
                ],
            },
        ],
    };

    // Prepare data for priority chart
    const priorityData = {
        labels: Object.keys(analytics.tickets_by_priority),
        datasets: [
            {
                data: Object.values(analytics.tickets_by_priority),
                backgroundColor: [
                    '#3B82F6', // blue
                    '#F59E0B', // yellow
                    '#EF4444', // red
                ],
            },
        ],
    };

    return (
        <TenantAdminLayout>
            <Head title="Support Ticket Analytics" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-medium text-gray-900">
                                    Support Ticket Analytics
                                </h2>
                                <select
                                    value={data.period}
                                    onChange={handlePeriodChange}
                                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="day">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="year">This Year</option>
                                </select>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium text-blue-600">Total Tickets</h3>
                                    <p className="mt-2 text-3xl font-semibold text-blue-900">
                                        {analytics.total_tickets}
                                    </p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium text-green-600">Open Tickets</h3>
                                    <p className="mt-2 text-3xl font-semibold text-green-900">
                                        {analytics.open_tickets}
                                    </p>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium text-yellow-600">Resolved Tickets</h3>
                                    <p className="mt-2 text-3xl font-semibold text-yellow-900">
                                        {analytics.resolved_tickets}
                                    </p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium text-red-600">Escalated Tickets</h3>
                                    <p className="mt-2 text-3xl font-semibold text-red-900">
                                        {analytics.escalated_tickets}
                                    </p>
                                </div>
                            </div>

                            {/* Average Resolution Time */}
                            <div className="mb-8">
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-600">Average Resolution Time</h3>
                                    <p className="mt-2 text-3xl font-semibold text-gray-900">
                                        {analytics.average_resolution_time ? 
                                            `${Math.round(analytics.average_resolution_time)} hours` :
                                            'N/A'
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Charts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-600 mb-4">Tickets by Category</h3>
                                    <div className="h-64">
                                        <Pie
                                            data={categoryData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'bottom',
                                                    },
                                                },
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-600 mb-4">Tickets by Priority</h3>
                                    <div className="h-64">
                                        <Pie
                                            data={priorityData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'bottom',
                                                    },
                                                },
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TenantAdminLayout>
    );
} 