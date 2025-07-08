import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { useState, useEffect, Fragment } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Menu, Transition } from '@headlessui/react';
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
    const [ticketStats, setTicketStats] = useState({
        categories: {},
        priorities: {},
        loading: true
    });



    // Fetch ticket statistics from the actual support ticket system
    const fetchTicketStats = async (period = 'month') => {
        try {
            setTicketStats(prev => ({ ...prev, loading: true }));
            
            // Use the existing support ticket analytics endpoint
            const response = await fetch(route('tenant-admin.support-tickets.analytics.data'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({ period })
            });
            
            if (response.ok) {
                const data = await response.json();
                setTicketStats({
                    categories: data.tickets_by_category || {},
                    priorities: data.tickets_by_priority || {},
                    loading: false
                });
            } else {
                throw new Error('Failed to fetch ticket stats');
            }
        } catch (error) {
            console.error('Error fetching ticket stats:', error);
            // Use empty data if API fails - will show "No data available" message
            setTicketStats({
                categories: {},
                priorities: {},
                loading: false
            });
        }
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
        fetchTicketStats(data.period);
    }, [data.period]);

    // Prepare dynamic data for category chart
    const categoryTickets = ticketStats.categories || {};
    
    // Clean the data - now that backend handles NULL properly, we just need basic filtering
    const cleanCategoryData = Object.entries(categoryTickets)
        .filter(([key, value]) => value > 0)
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});
    
    // Define colors for categories - ensure we have enough colors
    const categoryColors = [
        'rgba(99, 102, 241, 0.8)',   // Blue
        'rgba(16, 185, 129, 0.8)',   // Green  
        'rgba(245, 158, 11, 0.8)',   // Yellow
        'rgba(239, 68, 68, 0.8)',    // Red
        'rgba(139, 92, 246, 0.8)',   // Purple
        'rgba(236, 72, 153, 0.8)',   // Pink
        'rgba(6, 182, 212, 0.8)',    // Cyan
        'rgba(132, 204, 22, 0.8)',   // Lime
        'rgba(249, 115, 22, 0.8)',   // Orange
        'rgba(168, 85, 247, 0.8)',   // Violet
    ];
    
    const categoryHoverColors = [
        'rgba(99, 102, 241, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(139, 92, 246, 1)',
        'rgba(236, 72, 153, 1)',
        'rgba(6, 182, 212, 1)',
        'rgba(132, 204, 22, 1)',
        'rgba(249, 115, 22, 1)',
        'rgba(168, 85, 247, 1)',
    ];
    
    const categoryData = {
        labels: Object.keys(cleanCategoryData),
        datasets: [
            {
                data: Object.values(cleanCategoryData),
                backgroundColor: categoryColors.slice(0, Object.keys(cleanCategoryData).length),
                borderWidth: 2,
                hoverBackgroundColor: categoryHoverColors.slice(0, Object.keys(cleanCategoryData).length),
                borderColor: '#ffffff',
            },
        ],
    };

    // Prepare dynamic data for priority chart
    const priorityTickets = ticketStats.priorities || {};
    
    // Clean the data - now that backend handles NULL properly, we just need basic filtering
    const cleanPriorityData = Object.entries(priorityTickets)
        .filter(([key, value]) => value > 0)
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});
    
    // Define colors for priorities with semantic meaning
    const priorityColorMap = {
        'Critical': 'rgba(220, 38, 38, 0.8)',   // Dark Red
        'High': 'rgba(239, 68, 68, 0.8)',       // Red
        'Medium': 'rgba(245, 158, 11, 0.8)',    // Yellow
        'Low': 'rgba(99, 102, 241, 0.8)',       // Blue
        'Lowest': 'rgba(16, 185, 129, 0.8)',    // Green
    };
    
    const priorityHoverColorMap = {
        'Critical': 'rgba(220, 38, 38, 1)',
        'High': 'rgba(239, 68, 68, 1)',
        'Medium': 'rgba(245, 158, 11, 1)',
        'Low': 'rgba(99, 102, 241, 1)',
        'Lowest': 'rgba(16, 185, 129, 1)',
    };
    
    const priorityLabels = Object.keys(cleanPriorityData);
    const priorityData = {
        labels: priorityLabels,
        datasets: [
            {
                data: Object.values(cleanPriorityData),
                backgroundColor: priorityLabels.map(label => priorityColorMap[label] || 'rgba(156, 163, 175, 0.8)'),
                borderWidth: 2,
                hoverBackgroundColor: priorityLabels.map(label => priorityHoverColorMap[label] || 'rgba(156, 163, 175, 1)'),
                borderColor: '#ffffff',
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
                    'rgba(99, 102, 241, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)', 
                    'rgba(239, 68, 68, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(236, 72, 153, 0.8)',
                    'rgba(6, 182, 212, 0.8)', 'rgba(132, 204, 22, 0.8)', 'rgba(249, 115, 22, 0.8)', 
                    'rgba(168, 85, 247, 0.8)'
                ],
                borderWidth: 0,
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
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: 'rgb(99, 102, 241)',
            },
        ],
    } : null;

    const MetricCard = ({ title, value, trend, trendValue, icon, color = "blue" }) => {
        const colorClasses = {
            blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-700",
            green: "from-green-50 to-green-100 border-green-200 text-green-700",
            yellow: "from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-700",
            red: "from-red-50 to-red-100 border-red-200 text-red-700",
            purple: "from-purple-50 to-purple-100 border-purple-200 text-purple-700",
            indigo: "from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700",
            pink: "from-pink-50 to-pink-100 border-pink-200 text-pink-700",
            orange: "from-orange-50 to-orange-100 border-orange-200 text-orange-700",
        };

        return (
            <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${colorClasses[color]} p-6 shadow-sm hover:shadow-md transition-shadow duration-200`}>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium opacity-70">{title}</p>
                        <p className="text-3xl font-bold mt-2">{value}</p>
                        {trend && (
                            <div className="flex items-center mt-3 space-x-1">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    <svg className={`w-3 h-3 mr-1 ${trend === 'up' ? 'rotate-0' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                    {trendValue}
                                </span>
                            </div>
                        )}
                    </div>
                    {icon && (
                        <div className="opacity-20">
                            {icon}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const periodOptions = [
        { value: 'day', label: 'Today', icon: '📅' },
        { value: 'week', label: 'This Week', icon: '📊' },
        { value: 'month', label: 'This Month', icon: '📈' },
        { value: 'year', label: 'This Year', icon: '📆' },
    ];

    const getCurrentPeriodLabel = () => {
        const current = periodOptions.find(option => option.value === data.period);
        return current ? current.label : 'Select Period';
    };

    // Generate header for the page
    const getHeader = () => (
        <div className="px-6 w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
                <h2 className=" text-2xl font-bold leading-tight text-gray-900">Analytics Dashboard</h2>
                <p className="text-gray-600 mt-1">Support ticket insights and performance metrics</p>
            </div>
            <div className="flex items-center space-x-3">
                    {processing && (
                        <div className="flex items-center text-sm text-gray-500">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                        </div>
                    )}
                    <Menu as="div" className="relative inline-block text-left">
                        <div>
                            <Menu.Button className="inline-flex items-center justify-center w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                                <svg className="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                {getCurrentPeriodLabel()}
                                <svg className="w-4 h-4 ml-2 -mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </Menu.Button>
                        </div>

                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                <div className="py-1">
                                    {periodOptions.map((option) => (
                                        <Menu.Item key={option.value}>
                                            {({ active }) => (
                                                                                            <button
                                                onClick={() => {
                                                    const newPeriod = option.value;
                                                    setData('period', newPeriod);
                                                    get(route('tenant-admin.support-tickets.analytics'), {
                                                        data: { period: newPeriod },
                                                        preserveState: true,
                                                    });
                                                    fetchTicketStats(newPeriod);
                                                }}
                                                    className={`${
                                                        active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                                    } ${
                                                        data.period === option.value ? 'bg-blue-100 text-blue-800 font-medium' : ''
                                                    } group flex items-center w-full px-4 py-3 text-sm transition-colors duration-150`}
                                                >
                                                    <span className="mr-3 text-lg">{option.icon}</span>
                                                    {option.label}
                                                    {data.period === option.value && (
                                                        <svg className="ml-auto w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </button>
                                            )}
                                        </Menu.Item>
                                    ))}
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout header={getHeader()}>
            <Head title="Support Ticket Analytics" />

            <div className="py-8">
                <div className="w-full px-6">

                    {/* Main Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <MetricCard
                            title="Total Tickets"
                            value={analytics.total_tickets}
                            trend="up"
                            trendValue="12%"
                            color="blue"
                            icon={
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                            }
                        />
                        <MetricCard
                            title="Open Tickets"
                            value={analytics.open_tickets}
                            trend="down"
                            trendValue="3%"
                            color="green"
                            icon={
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            }
                        />
                        <MetricCard
                            title="Resolved Tickets"
                            value={analytics.resolved_tickets}
                            trend="up"
                            trendValue="8%"
                            color="yellow"
                            icon={
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            }
                        />
                        <MetricCard
                            title="Escalated Tickets"
                            value={analytics.escalated_tickets}
                            trend="down"
                            trendValue="15%"
                            color="red"
                            icon={
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            }
                        />
                    </div>

                    {/* Secondary Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <MetricCard
                            title="Canned Responses"
                            value={cannedResponseStats?.total_responses || 0}
                            trend="up"
                            trendValue="5%"
                            color="purple"
                            icon={
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                                </svg>
                            }
                        />
                        <MetricCard
                            title="Today's Usage"
                            value={cannedResponseStats?.usage_stats?.today_usage || 0}
                            color="indigo"
                            icon={
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                            }
                        />
                        <MetricCard
                            title="Total Mentions"
                            value={mentionStats?.total_mentions || 0}
                            color="pink"
                            icon={
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                                </svg>
                            }
                        />
                        <MetricCard
                            title="Recent Mentions"
                            value={mentionStats?.recent_mentions || 0}
                            color="orange"
                            icon={
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                            }
                        />
                    </div>

                    {/* Resolution Time Stats */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Resolution Time Statistics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-600">Average Time</p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">
                                    {analytics.resolution_time_stats?.formatted?.average || 'N/A'}
                                </p>
                                {analytics.resolution_time_stats?.average && (
                                    <div className="mt-2 text-sm text-gray-500 space-x-2">
                                        <span>{analytics.resolution_time_stats.average.days}d</span>
                                        <span>{analytics.resolution_time_stats.average.hours}h</span>
                                        <span>{analytics.resolution_time_stats.average.minutes}m</span>
                                    </div>
                                )}
                            </div>
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-600">Fastest Resolution</p>
                                <p className="text-2xl font-bold text-green-600 mt-2">
                                    {analytics.resolution_time_stats?.formatted?.minimum || 'N/A'}
                                </p>
                                {analytics.resolution_time_stats?.minimum && (
                                    <div className="mt-2 text-sm text-gray-500 space-x-2">
                                        <span>{analytics.resolution_time_stats.minimum.days}d</span>
                                        <span>{analytics.resolution_time_stats.minimum.hours}h</span>
                                        <span>{analytics.resolution_time_stats.minimum.minutes}m</span>
                                    </div>
                                )}
                            </div>
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-4">
                                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-600">Longest Resolution</p>
                                <p className="text-2xl font-bold text-red-600 mt-2">
                                    {analytics.resolution_time_stats?.formatted?.maximum || 'N/A'}
                                </p>
                                {analytics.resolution_time_stats?.maximum && (
                                    <div className="mt-2 text-sm text-gray-500 space-x-2">
                                        <span>{analytics.resolution_time_stats.maximum.days}d</span>
                                        <span>{analytics.resolution_time_stats.maximum.hours}h</span>
                                        <span>{analytics.resolution_time_stats.maximum.minutes}m</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Tickets by Category</h3>
                            <div className="h-80">
                                {ticketStats.loading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : Object.keys(cleanCategoryData).length > 0 ? (
                                    <Pie
                                        data={categoryData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom',
                                                    labels: {
                                                        usePointStyle: true,
                                                        padding: 20,
                                                        font: {
                                                            size: 12,
                                                        },
                                                    },
                                                },
                                                tooltip: {
                                                    callbacks: {
                                                        label: function(context) {
                                                            const label = context.label || '';
                                                            const value = context.parsed || 0;
                                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                                            return `${label}: ${value} tickets (${percentage}%)`;
                                                        }
                                                    }
                                                }
                                            },
                                            interaction: {
                                                intersect: false,
                                            },
                                            animation: {
                                                animateRotate: true,
                                                animateScale: true
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        <div className="text-center">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            <p className="mt-2">No category data available</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Tickets by Priority</h3>
                            <div className="h-80">
                                {ticketStats.loading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : Object.keys(cleanPriorityData).length > 0 ? (
                                    <Pie
                                        data={priorityData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom',
                                                    labels: {
                                                        usePointStyle: true,
                                                        padding: 20,
                                                        font: {
                                                            size: 12,
                                                        },
                                                    },
                                                },
                                                tooltip: {
                                                    callbacks: {
                                                        label: function(context) {
                                                            const label = context.label || '';
                                                            const value = context.parsed || 0;
                                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                                            return `${label} Priority: ${value} tickets (${percentage}%)`;
                                                        }
                                                    }
                                                }
                                            },
                                            interaction: {
                                                intersect: false,
                                            },
                                            animation: {
                                                animateRotate: true,
                                                animateScale: true
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        <div className="text-center">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            <p className="mt-2">No priority data available</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Canned Response Analytics */}
                    {cannedResponseStats && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">Canned Responses by Category</h3>
                                <div className="h-80">
                                    {cannedResponseData ? (
                                        <Pie
                                            data={cannedResponseData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'bottom',
                                                        labels: {
                                                            usePointStyle: true,
                                                            padding: 20,
                                                            font: {
                                                                size: 12,
                                                            },
                                                        },
                                                    },
                                                },
                                            }}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-500">
                                            <div className="text-center">
                                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                                <p className="mt-2">No data available</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">Usage Trends</h3>
                                <div className="h-80">
                                    {cannedResponseTrendsData ? (
                                        <Line
                                            data={cannedResponseTrendsData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'bottom',
                                                        labels: {
                                                            usePointStyle: true,
                                                            padding: 20,
                                                            font: {
                                                                size: 12,
                                                            },
                                                        },
                                                    },
                                                },
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        ticks: {
                                                            stepSize: 1,
                                                        },
                                                        grid: {
                                                            color: 'rgba(0, 0, 0, 0.1)',
                                                        },
                                                    },
                                                    x: {
                                                        grid: {
                                                            color: 'rgba(0, 0, 0, 0.1)',
                                                        },
                                                    },
                                                },
                                            }}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-500">
                                            <div className="text-center">
                                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                                <p className="mt-2">No data available</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Most Used Canned Responses Table */}
                    {cannedResponseStats?.usage_stats?.most_used_responses && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Most Used Canned Responses</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage Count</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {cannedResponseStats.usage_stats.most_used_responses.slice(0, 5).map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {item.canned_response?.name || 'Unknown Response'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {item.canned_response?.category || 'General'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">{item.usage_count}</div>
                                                    <div className="text-xs text-gray-500">uses</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                                                            <div 
                                                                className="bg-blue-600 h-2 rounded-full" 
                                                                style={{ width: `${Math.min((item.usage_count / Math.max(...cannedResponseStats.usage_stats.most_used_responses.map(r => r.usage_count))) * 100, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm text-gray-600">
                                                            {Math.round((item.usage_count / Math.max(...cannedResponseStats.usage_stats.most_used_responses.map(r => r.usage_count))) * 100)}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 