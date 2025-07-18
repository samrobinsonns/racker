import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProfileOverview({ user, readOnly = false }) {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!readOnly) {
            fetchActivities();
        } else {
            // For other profiles, we'll show their activities directly from the user prop
            setActivities(user.activities || []);
            setLoading(false);
        }
    }, [readOnly, user]);

    const fetchActivities = async () => {
        try {
            const response = await axios.get(route('profile.activities'));
            // Only keep ticket assignments
            const ticketActivities = response.data.activities.filter(activity => 
                activity.type === 'ticket_assigned'
            );
            setActivities(ticketActivities);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = () => {
        return (
            <svg className="h-5 w-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
        );
    };

    const formatTimeAgo = (date) => {
        const now = new Date();
        const past = new Date(date);
        const diffInHours = Math.floor((now - past) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return past.toLocaleDateString();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
                {/* Biography Section */}
                <div className="bg-white rounded-2xl p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Biography</h3>
                    <p className="text-gray-600">
                        {user.bio || 'No bio provided yet.'}
                    </p>
                </div>

                {/* Assigned Tickets */}
                <div className="bg-white rounded-2xl p-6 mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Assigned Tickets</h3>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="animate-pulse flex items-start space-x-3">
                                    <div className="rounded-full bg-gray-200 h-5 w-5" />
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                                        <div className="mt-2 h-3 bg-gray-200 rounded w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activities.length > 0 ? (
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }} className="space-y-4 pr-2">
                            {activities.map((activity) => (
                                <div key={activity.id} className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        {getActivityIcon()}
                                    </div>
                                    <div>
                                        <p className="text-gray-600">
                                            {activity.ticket?.id ? (
                                                <>
                                                    <a href={route('support-tickets.show', { support_ticket: activity.ticket.id })} className="text-violet-600 hover:text-violet-700">
                                                        #{activity.ticket.ticket_number}
                                                    </a>
                                                    {' - '}
                                                </>
                                            ) : null}
                                            {activity.description}
                                        </p>
                                        <p className="text-sm text-gray-500">{formatTimeAgo(activity.created_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">No tickets currently assigned</p>
                    )}
                </div>
            </div>

            {/* Side Content */}
            <div>
                {/* Professional Info Section */}
                <div className="bg-white rounded-2xl p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Info</h3>
                    <div className="space-y-4">
                        {user.title && (
                            <div className="flex items-center text-gray-600">
                                <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>{user.title}</span>
                            </div>
                        )}
                        
                        {user.company && (
                            <div className="flex items-center text-gray-600">
                                <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span>{user.company}</span>
                            </div>
                        )}
                        
                        {user.location && (
                            <div className="flex items-center text-gray-600">
                                <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{user.location}</span>
                            </div>
                        )}
                        
                        {user.website && (
                            <div className="flex items-center text-gray-600">
                                <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                                <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-700">
                                    {user.website.replace(/^https?:\/\//, '')}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 