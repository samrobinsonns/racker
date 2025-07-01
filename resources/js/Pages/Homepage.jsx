import { Link } from '@inertiajs/react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

export default function Homepage({ canLogin, canRegister }) {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex flex-shrink-0 items-center">
                            <span className="text-2xl font-bold text-indigo-600">Racker</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            {canLogin && (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600"
                                    >
                                        Log in
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={route('register')}
                                            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                                        >
                                            Register
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative isolate overflow-hidden bg-gradient-to-b from-indigo-100/20">
                <div className="mx-auto max-w-7xl px-6 pt-32 sm:pt-40 lg:px-8 lg:pt-44">
                    <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
                        <div className="w-full max-w-xl lg:shrink-0 xl:max-w-2xl">
                            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                                Multi-Tenant Platform for Modern Business
                            </h1>
                            <p className="relative mt-6 text-lg leading-8 text-gray-600 sm:max-w-md lg:max-w-none">
                                Racker is a powerful multi-tenant application platform that helps organizations manage their resources, users, and operations efficiently. Built with Laravel and React, it provides enterprise-grade features with a modern user experience.
                            </p>
                            <div className="mt-10 flex items-center gap-x-6">
                                <Link
                                    href={route('register')}
                                    className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                >
                                    Get started
                                </Link>
                                <Link
                                    href={route('login')}
                                    className="text-sm font-semibold leading-6 text-gray-900"
                                >
                                    Learn more <span aria-hidden="true">→</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
                <div className="mx-auto max-w-2xl lg:mx-0">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Powerful Features</h2>
                    <p className="mt-6 text-lg leading-8 text-gray-600">
                        Everything you need to manage your organization efficiently.
                    </p>
                </div>
                <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 text-base leading-7 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                    {[
                        {
                            name: 'Multi-Tenancy',
                            description: 'Secure isolation between organizations with shared infrastructure for cost-effectiveness.',
                        },
                        {
                            name: 'User Management',
                            description: 'Comprehensive user management with roles and permissions for fine-grained access control.',
                        },
                        {
                            name: 'Custom Navigation',
                            description: 'Build custom navigation experiences for different user types and roles.',
                        },
                        {
                            name: 'Analytics & Reporting',
                            description: 'Detailed insights and reporting capabilities for data-driven decisions.',
                        },
                        {
                            name: 'Modern UI/UX',
                            description: 'Beautiful, responsive interface built with React and Tailwind CSS.',
                        },
                        {
                            name: 'Enterprise Ready',
                            description: 'Built for scale with Laravel, featuring robust security and performance.',
                        },
                    ].map((feature) => (
                        <div key={feature.name}>
                            <dt className="font-semibold text-gray-900">{feature.name}</dt>
                            <dd className="mt-1 text-gray-600">{feature.description}</dd>
                        </div>
                    ))}
                </dl>
            </div>

            {/* CTA Section */}
            <div className="mx-auto mt-32 max-w-7xl sm:mt-40 sm:px-6 lg:px-8">
                <div className="relative isolate overflow-hidden bg-gray-900 px-6 py-24 shadow-2xl sm:rounded-3xl sm:px-24 xl:py-32">
                    <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Ready to transform your organization?
                    </h2>
                    <p className="mx-auto mt-2 max-w-xl text-center text-lg leading-8 text-gray-300">
                        Join the growing number of organizations using Racker to manage their operations efficiently.
                    </p>
                    <div className="mt-10 flex justify-center">
                        <Link
                            href={route('register')}
                            className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                            Get started today
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="mx-auto mt-32 max-w-7xl px-6 pb-8 lg:px-8">
                <div className="border-t border-gray-900/10 pt-8">
                    <p className="text-sm leading-5 text-gray-500">&copy; {new Date().getFullYear()} Racker. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
} 