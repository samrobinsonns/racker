import React, { useState, useEffect } from 'react';

export default function TicketStats() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/support-tickets/stats');
            const data = await response.json();
            
            if (data.success) {
                setStats(data.stats);
            } else {
                console.error('Failed to fetch stats:', data.message);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-white rounded-lg shadow p-6">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!stats) {
        return null;
    }

    const statCards = [
        {
            title: 'Open Tickets',
            value: stats.open_tickets,
            color: 'bg-blue-500',
            textColor: 'text-blue-500',
        },
        {
            title: 'High Priority',
            value: stats.high_priority_tickets,
            color: 'bg-red-500',
            textColor: 'text-red-500',
        },
        {
            title: 'Unassigned',
            value: stats.unassigned_tickets,
            color: 'bg-yellow-500',
            textColor: 'text-yellow-500',
        },
        {
            title: 'Resolved Today',
            value: stats.resolved_today,
            color: 'bg-green-500',
            textColor: 'text-green-500',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
                <div
                    key={index}
                    className="bg-white rounded-lg shadow overflow-hidden"
                >
                    <div className={`h-1 ${stat.color}`}></div>
                    <div className="p-6">
                        <h3 className="text-sm font-medium text-gray-500">
                            {stat.title}
                        </h3>
                        <p className={`mt-2 text-3xl font-semibold ${stat.textColor}`}>
                            {stat.value}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
} 