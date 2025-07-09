import { useState } from 'react';
import AvatarUploader from '@/Components/User/AvatarUploader';
import BackgroundImageUploader from '@/Components/User/BackgroundImageUploader';

export default function ProfileHeader({ user, activeTab, onTabChange }) {
    const tabs = [
        { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { id: 'basic', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { id: 'security', label: 'Security', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
        { id: 'preferences', label: 'Preferences', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    ];

    return (
        <div className="relative">
            {/* Background Section */}
            <div 
                className="relative h-64 bg-violet-600 rounded-b-[40px] overflow-hidden"
                style={user.background_image_url ? {
                    backgroundImage: `url(${user.background_image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                } : {}}
            >
                {/* Dark overlay for better text visibility when background image is present */}
                {user.background_image_url && (
                    <div className="absolute inset-0 bg-black/30 z-10" />
                )}
                
                <BackgroundImageUploader className="relative h-full" user={user} />

                {/* Profile Content */}
                <div className="absolute inset-x-0 bottom-0 pb-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="relative h-32">
                            {/* Avatar */}
                            <div className="absolute left-0 top-0 z-30">
                                <div className="relative">
                                    <AvatarUploader 
                                        user={user} 
                                        className="h-32 w-32 rounded-full border-4 border-white"
                                    />
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="h-full flex flex-col justify-center ml-40">
                                <div className="flex items-center">
                                    <h2 className="text-2xl font-semibold text-white">{user.name}</h2>
                                </div>
                                <div>
                                    <p className="text-base text-purple-100 mt-1">{user.email}</p>
                                    <p className="text-base text-purple-100 mt-1">
                                        {user.title && user.location ? `${user.title} • ${user.location}` : 
                                         user.title || user.location || 'No title or location set'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex space-x-8 mt-4" aria-label="Profile tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex items-center space-x-2 pb-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                activeTab === tab.id
                                    ? 'border-violet-500 text-violet-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                            </svg>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
} 