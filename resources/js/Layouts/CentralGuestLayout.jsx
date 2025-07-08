import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function CentralGuestLayout({ children }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
            <div className="flex min-h-screen flex-col items-center pt-6 sm:justify-center sm:pt-0">
                <div className="mb-8 flex flex-col items-center">
                    <ApplicationLogo className="h-20 w-20 fill-indigo-500" />
                    <h1 className="mt-4 text-3xl font-bold text-indigo-900">Central Admin Portal</h1>
                    <p className="mt-2 text-gray-600">Manage your entire organization</p>
                </div>

                <div className="w-full overflow-hidden bg-white px-6 py-4 shadow-xl sm:max-w-md sm:rounded-xl sm:border sm:border-indigo-100">
                    {children}
                </div>

                <footer className="mt-8 text-center text-sm text-gray-500">
                    <p>Central Administration System</p>
                    <p className="mt-1">Access restricted to authorized personnel only</p>
                </footer>
            </div>
        </div>
    );
} 