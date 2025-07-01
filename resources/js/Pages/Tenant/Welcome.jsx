import GuestLayout from '@/Layouts/GuestLayout';
import { Link } from '@inertiajs/react';

export default function Welcome({ tenant }) {
    return (
        <GuestLayout>
            <div className="text-center">
                <h1 className="mb-6 text-3xl font-bold text-gray-900">
                    Welcome to {tenant.name} Portal
                </h1>
                
                <p className="mb-8 text-gray-600">
                    Please log in to access your account and manage your resources.
                </p>

                <Link
                    href="/login"
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    Login to Your Account
                </Link>
            </div>
        </GuestLayout>
    );
} 