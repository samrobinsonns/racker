export default function ProfileOverview({ user }) {
    const activities = [
        {
            id: 1,
            type: 'comment',
            content: 'Commented on PR #123: "Add new authentication features"',
            date: '2 hours ago',
            icon: (
                <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
        },
        {
            id: 2,
            type: 'commit',
            content: 'Pushed 3 commits to feature/user-settings',
            date: '5 hours ago',
            icon: (
                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
            ),
        },
    ];

    const projects = [
        { id: 1, name: 'Project Alpha', status: 'In Progress', progress: 75 },
        { id: 2, name: 'Project Beta', status: 'Planning', progress: 25 },
        { id: 3, name: 'Project Gamma', status: 'Completed', progress: 100 },
    ];

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

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl p-6 mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {activities.map((activity) => (
                            <div key={activity.id} className="flex items-start space-x-3">
                                <div className="flex-shrink-0">{activity.icon}</div>
                                <div>
                                    <p className="text-gray-600">{activity.content}</p>
                                    <p className="text-sm text-gray-500">{activity.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
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

                {/* Projects Section */}
                <div className="bg-white rounded-2xl p-6 mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Projects</h3>
                    <div className="space-y-4">
                        {projects.map((project) => (
                            <div key={project.id} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-900 font-medium">{project.name}</span>
                                    <span className="text-sm text-gray-500">{project.status}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-violet-600 h-2 rounded-full"
                                        style={{ width: `${project.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
} 