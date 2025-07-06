import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import TenantAdminLayout from '@/Layouts/TenantAdminLayout';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    LineElement,
    PointElement,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    LineElement,
    PointElement
);

export default function Index({ analytics, period }) {
    const { data, setData, get, processing } = useForm({
        period: period,
    });

    const [cannedResponseStats, setCannedResponseStats] = useState(null);
    const [mentionStats, setMentionStats] = useState(null);
    const [loading, setLoading] = useState(false);

    const handlePeriodChange = (e) => {
        const newPeriod = e.target.value;
        setData('period', newPeriod);
        get(route('tenant-admin.support-tickets.analytics'), {
            data: { period: newPeriod },
            preserveState: true,
        });
    };

    // Fetch canned response and mention statistics
    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const [cannedResponseRes, mentionRes] = await Promise.all([
                    fetch(route('canned-responses.stats', { days: 30 })),
                    fetch(route('mentions.stats'))
                ]);
                
                if (cannedResponseRes.ok) {
                    const cannedData = await cannedResponseRes.json();
                    setCannedResponseStats(cannedData);
                }
                
                if (mentionRes.ok) {
                    const mentionData = await mentionRes.json();
                    setMentionStats(mentionData);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

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

    // Prepare data for canned response usage chart
    const cannedResponseData = cannedResponseStats ? {
        labels: cannedResponseStats.category_stats?.map(item => item.category) || [],
        datasets: [
            {
                label: 'Canned Responses by Category',
                data: cannedResponseStats.category_stats?.map(item => item.count) || [],
                backgroundColor: [
                    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
                    '#06B6D4', '#84CC16', '#F97316', '#A855F7'
                ],
            },
        ],
    } : null;

    // Prepare data for canned response usage trends
    const cannedResponseTrendsData = cannedResponseStats?.usage_trends ? {
        labels: cannedResponseStats.usage_trends.map(item => item.date),
        datasets: [
            {
                label: 'Daily Usage',
                data: cannedResponseStats.usage_trends.map(item => item.count),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
            },
        ],
    } : null;

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

                            {/* Canned Response & Mentions Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium text-purple-600">Canned Responses</h3>
                                    <p className="mt-2 text-3xl font-semibold text-purple-900">
                                        {cannedResponseStats?.total_responses || 0}
                                    </p>
                                    <p className="text-sm text-purple-600">
                                        {cannedResponseStats?.usage_stats?.total_usage || 0} total uses
                                    </p>
                                </div>
                                <div className="bg-indigo-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium text-indigo-600">Today's Usage</h3>
                                    <p className="mt-2 text-3xl font-semibold text-indigo-900">
                                        {cannedResponseStats?.usage_stats?.today_usage || 0}
                                    </p>
                                    <p className="text-sm text-indigo-600">
                                        canned responses used
                                    </p>
                                </div>
                                <div className="bg-pink-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium text-pink-600">Total Mentions</h3>
                                    <p className="mt-2 text-3xl font-semibold text-pink-900">
                                        {mentionStats?.total_mentions || 0}
                                    </p>
                                    <p className="text-sm text-pink-600">
                                        {mentionStats?.unread_mentions || 0} unread
                                    </p>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium text-orange-600">Recent Mentions</h3>
                                    <p className="mt-2 text-3xl font-semibold text-orange-900">
                                        {mentionStats?.recent_mentions || 0}
                                    </p>
                                    <p className="text-sm text-orange-600">
                                        in last 7 days
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

                            {/* Canned Response Charts */}
                            {cannedResponseStats && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        <h3 className="text-sm font-medium text-gray-600 mb-4">Canned Responses by Category</h3>
                                        <div className="h-64">
                                            {cannedResponseData ? (
                                                <Pie
                                                    data={cannedResponseData}
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
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-500">
                                                    No data available
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        <h3 className="text-sm font-medium text-gray-600 mb-4">Canned Response Usage Trends</h3>
                                        <div className="h-64">
                                            {cannedResponseTrendsData ? (
                                                <Line
                                                    data={cannedResponseTrendsData}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: {
                                                            legend: {
                                                                position: 'bottom',
                                                            },
                                                        },
                                                        scales: {
                                                            y: {
                                                                beginAtZero: true,
                                                                ticks: {
                                                                    stepSize: 1,
                                                                },
                                                            },
                                                        },
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-500">
                                                    No data available
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Most Used Canned Responses */}
                            {cannedResponseStats?.usage_stats?.most_used_responses && (
                                <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
                                    <h3 className="text-sm font-medium text-gray-600 mb-4">Most Used Canned Responses</h3>
                                    <div className="space-y-3">
                                        {cannedResponseStats.usage_stats.most_used_responses.slice(0, 5).map((item, index) => (
                                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {item.canned_response?.name || 'Unknown Response'}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Category: {item.canned_response?.category || 'General'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-semibold text-blue-600">
                                                        {item.usage_count}
                                                    </p>
                                                    <p className="text-xs text-gray-500">uses</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </TenantAdminLayout>
    );
} 