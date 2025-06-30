import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import ProfileHeader from '@/Components/User/ProfileHeader';
import ProfileOverview from '@/Components/User/ProfileOverview';
import ProfileForm from '@/Components/User/ProfileForm';
import UpdatePasswordForm from './UpdatePasswordForm';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <>
            <ProfileHeader 
                user={user} 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
            />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {activeTab === 'overview' && (
                        <ProfileOverview user={user} />
                    )}
                    
                    {activeTab === 'basic' && (
                        <ProfileForm 
                            user={user}
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />
                    )}

                    {activeTab === 'security' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-2xl p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Password</h3>
                                    <UpdatePasswordForm />
                                </div>
                            </div>
                            <div>
                                <div className="bg-white rounded-2xl p-6">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Add an extra layer of security to your account by enabling two-factor authentication.
                                            </p>
                                            <div className="mt-4">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                                                >
                                                    Coming Soon
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-2xl p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Theme & Display</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900">Theme</h4>
                                            <p className="text-sm text-gray-500">Choose your preferred color theme.</p>
                                            <div className="mt-4">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                                                >
                                                    Coming Soon
                                                </button>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-gray-200">
                                            <h4 className="text-sm font-medium text-gray-900">Language</h4>
                                            <p className="text-sm text-gray-500">Select your preferred language.</p>
                                            <div className="mt-4">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                                                >
                                                    Coming Soon
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="bg-white rounded-2xl p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Accessibility</h3>
                                    <p className="text-sm text-gray-500">
                                        Configure accessibility settings to enhance your experience.
                                    </p>
                                    <div className="mt-6">
                                        <button
                                            type="button"
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                                        >
                                            Coming Soon
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
