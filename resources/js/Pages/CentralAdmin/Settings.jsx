import { Head, useForm } from '@inertiajs/react';
import CentralAdminLayout from '@/Layouts/CentralAdminLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { 
    CogIcon, 
    ShieldCheckIcon, 
    UsersIcon, 
    BuildingOfficeIcon,
    EnvelopeIcon,
    GlobeAltIcon,
    CircleStackIcon,
    BellIcon
} from '@heroicons/react/24/outline';

export default function Settings({ settings, roles, stats }) {
    const { data, setData, patch, processing, errors } = useForm({
        app_name: settings?.app_name || 'Racker',
        app_url: settings?.app_url || 'http://localhost',
        admin_email: settings?.admin_email || 'admin@racker.com',
        tenant_creation_enabled: settings?.tenant_creation_enabled || true,
        user_registration_enabled: settings?.user_registration_enabled || true,
        email_verification_required: settings?.email_verification_required || true,
        max_tenants_per_admin: settings?.max_tenants_per_admin || 0,
        default_tenant_storage_limit: settings?.default_tenant_storage_limit || 1024,
        maintenance_mode: settings?.maintenance_mode || false,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('central-admin.settings.update'));
    };

    return (
        <CentralAdminLayout
            header={
                <h2 className="text-2xl font-bold leading-tight text-gray-900">
                    System Settings
                </h2>
            }
        >
            <Head title="System Settings" />

            {/* Stats Overview */}
            <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <BuildingOfficeIcon className="h-6 w-6 text-indigo-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Tenants</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats?.total_tenants || 0}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <UsersIcon className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats?.total_users || 0}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ShieldCheckIcon className="h-6 w-6 text-purple-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Active Roles</dt>
                                    <dd className="text-lg font-medium text-gray-900">{roles?.length || 0}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                            <CircleStackIcon className="h-6 w-6 text-blue-400" />
                        </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Storage Used</dt>
                                    <dd className="text-lg font-medium text-gray-900">2.4 GB</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* General Settings */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <CogIcon className="h-5 w-5 mr-2 text-indigo-600" />
                            General Settings
                        </h3>
                    </div>
                    
                    <form onSubmit={submit} className="p-6 space-y-6">
                        <div>
                            <InputLabel htmlFor="app_name" value="Application Name" />
                            <TextInput
                                id="app_name"
                                name="app_name"
                                value={data.app_name}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('app_name', e.target.value)}
                            />
                            <InputError message={errors.app_name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="app_url" value="Application URL" />
                            <TextInput
                                id="app_url"
                                name="app_url"
                                type="url"
                                value={data.app_url}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('app_url', e.target.value)}
                            />
                            <InputError message={errors.app_url} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="admin_email" value="Admin Email" />
                            <TextInput
                                id="admin_email"
                                name="admin_email"
                                type="email"
                                value={data.admin_email}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('admin_email', e.target.value)}
                            />
                            <InputError message={errors.admin_email} className="mt-2" />
                        </div>

                        <div className="flex justify-end">
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Saving...' : 'Save Changes'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>

                {/* System Permissions */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <ShieldCheckIcon className="h-5 w-5 mr-2 text-emerald-600" />
                            System Permissions
                        </h3>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-900">
                                    Tenant Creation
                                </label>
                                <p className="text-sm text-gray-500">
                                    Allow creation of new tenants
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={data.tenant_creation_enabled}
                                    onChange={(e) => setData('tenant_creation_enabled', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-900">
                                    User Registration
                                </label>
                                <p className="text-sm text-gray-500">
                                    Allow new user registration
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={data.user_registration_enabled}
                                    onChange={(e) => setData('user_registration_enabled', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-900">
                                    Email Verification
                                </label>
                                <p className="text-sm text-gray-500">
                                    Require email verification for new users
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={data.email_verification_required}
                                    onChange={(e) => setData('email_verification_required', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-900">
                                    Maintenance Mode
                                </label>
                                <p className="text-sm text-gray-500">
                                    Put system in maintenance mode
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={data.maintenance_mode}
                                    onChange={(e) => setData('maintenance_mode', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Tenant Limits */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-600" />
                            Tenant Limits
                        </h3>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div>
                            <InputLabel htmlFor="max_tenants_per_admin" value="Max Tenants per Admin (0 = unlimited)" />
                            <TextInput
                                id="max_tenants_per_admin"
                                name="max_tenants_per_admin"
                                type="number"
                                min="0"
                                value={data.max_tenants_per_admin}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('max_tenants_per_admin', parseInt(e.target.value))}
                            />
                            <InputError message={errors.max_tenants_per_admin} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="default_tenant_storage_limit" value="Default Storage Limit (MB)" />
                            <TextInput
                                id="default_tenant_storage_limit"
                                name="default_tenant_storage_limit"
                                type="number"
                                min="1"
                                value={data.default_tenant_storage_limit}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('default_tenant_storage_limit', parseInt(e.target.value))}
                            />
                            <InputError message={errors.default_tenant_storage_limit} className="mt-2" />
                        </div>
                    </div>
                </div>

                {/* Role Management */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <UsersIcon className="h-5 w-5 mr-2 text-purple-600" />
                            Role Management
                        </h3>
                    </div>
                    
                    <div className="p-6">
                        <div className="space-y-3">
                            {roles?.map((role) => (
                                <div key={role.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">
                                            {role.display_name}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            {role.type === 'central' ? 'System-wide role' : 'Tenant-specific role'}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            role.type === 'central' 
                                                ? 'bg-purple-100 text-purple-800' 
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {role.type}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {role.users_count || 0} users
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-6">
                            <SecondaryButton>
                                Manage Roles & Permissions
                            </SecondaryButton>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Status */}
            <div className="mt-8 bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <BellIcon className="h-5 w-5 mr-2 text-yellow-600" />
                        System Status
                    </h3>
                </div>
                
                <div className="p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="flex items-center p-4 bg-green-50 rounded-lg">
                            <div className="flex-shrink-0">
                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">Database</p>
                                <p className="text-sm text-green-600">Connected</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center p-4 bg-green-50 rounded-lg">
                            <div className="flex-shrink-0">
                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">Cache</p>
                                <p className="text-sm text-green-600">Active</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
                            <div className="flex-shrink-0">
                                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-yellow-800">Email</p>
                                <p className="text-sm text-yellow-600">Not Configured</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CentralAdminLayout>
    );
} 