import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import CentralAdminLayout from '@/Layouts/CentralAdminLayout';
import { 
    BuildingOffice2Icon, 
    UsersIcon, 
    CogIcon,
    PlusIcon,
    MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';

export default function Index({ tenants }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTenants = tenants.filter(tenant =>
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <CentralAdminLayout
            header={
                <div>
                    <h2 className="text-2xl font-bold leading-tight text-gray-900">
                        Navigation Builder
                    </h2>
                    <p className="mt-2 text-gray-600">
                        Create and manage custom navigation layouts for tenants
                    </p>
                </div>
            }
        >
            <Head title="Navigation Builder" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <BuildingOffice2Icon className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Tenants
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {tenants.length}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <UsersIcon className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Users
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {tenants.reduce((sum, tenant) => sum + tenant.users.length, 0)}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <CogIcon className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Configurations
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                Active
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="mb-6">
                        <div className="relative max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                placeholder="Search tenants..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Tenants Grid */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Select Tenant for Navigation Building
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Choose a tenant to create or modify their navigation layout
                            </p>
                        </div>
                        
                        {filteredTenants.length === 0 ? (
                            <div className="text-center py-12">
                                <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No tenants found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm ? 'Try adjusting your search terms' : 'No tenants have been created yet.'}
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {filteredTenants.map((tenant) => (
                                    <li key={tenant.id}>
                                        <Link
                                            href={route('central-admin.navigation.builder', { tenant_id: tenant.id })}
                                            className="block hover:bg-gray-50 transition-colors duration-150"
                                        >
                                            <div className="px-4 py-4 sm:px-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0">
                                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                                                                <BuildingOffice2Icon className="h-6 w-6 text-white" />
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="flex items-center">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {tenant.name}
                                                                </div>
                                                                <div className="ml-2 flex-shrink-0">
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                        Active
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center mt-1">
                                                                <div className="text-sm text-gray-500">
                                                                    ID: {tenant.id}
                                                                </div>
                                                                <div className="ml-4 flex items-center text-sm text-gray-500">
                                                                    <UsersIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                                                    {tenant.users.length} users
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="text-right">
                                                            <div className="text-sm text-gray-500">Click to build</div>
                                                            <div className="text-xs text-gray-400">navigation</div>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                                <CogIcon className="h-4 w-4 text-purple-600" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </CentralAdminLayout>
    );
} 