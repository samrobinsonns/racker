import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ProfileHeader from '@/Components/User/ProfileHeader';
import ProfileOverview from '@/Components/User/ProfileOverview';

export default function Show({ auth, profileUser }) {
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`${profileUser.name}'s Profile`} />

            <div className="relative">
                {/* Background Section */}
                <div 
                    className="relative h-64 bg-violet-600 rounded-b-[40px] overflow-hidden"
                    style={profileUser.background_image_url ? {
                        backgroundImage: `url(${profileUser.background_image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    } : {}}
                >
                    {/* Dark overlay for better text visibility when background image is present */}
                    {profileUser.background_image_url && (
                        <div className="absolute inset-0 bg-black/30 z-10" />
                    )}

                    {/* Profile Content */}
                    <div className="absolute inset-x-0 bottom-0 pb-8">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="relative h-32">
                                {/* Avatar */}
                                <div className="absolute left-0 top-0 z-30">
                                    <div className="relative">
                                        <div 
                                            className="h-32 w-32 rounded-full border-4 border-white bg-violet-100 flex items-center justify-center overflow-hidden"
                                        >
                                            {profileUser.avatar_url ? (
                                                <img src={profileUser.avatar_url} alt={profileUser.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-3xl font-medium text-violet-700">
                                                    {profileUser.name.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* User Info */}
                                <div className="h-full flex flex-col justify-center ml-40">
                                    <div className="flex items-center space-x-3">
                                        <h2 className="text-2xl font-semibold text-white">{profileUser.name}</h2>
                                        {profileUser.roles?.length > 0 && (
                                            <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                                {profileUser.roles[0].name}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-base text-purple-100 mt-1">{profileUser.email}</p>
                                        <p className="text-base text-purple-100 mt-1">
                                            {profileUser.title && profileUser.location ? `${profileUser.title} • ${profileUser.location}` : 
                                             profileUser.title || profileUser.location || 'No title or location set'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <ProfileOverview 
                        user={profileUser}
                        readOnly={true}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 