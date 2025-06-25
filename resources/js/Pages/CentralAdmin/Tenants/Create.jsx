import { Head, useForm, Link } from '@inertiajs/react';
import CentralAdminLayout from '@/Layouts/CentralAdminLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { BuildingOfficeIcon, UserIcon, GlobeAltIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function Create() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        domain: '',
        admin_name: '',
        admin_email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('central-admin.tenants.store'), {
            onSuccess: () => reset(),
        });
    };

    return (
        <CentralAdminLayout
            header={
                <div className="flex items-center space-x-4">
                    <Link
                        href={route('central-admin.tenants.index')}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ← Back to Tenants
                    </Link>
                    <h2 className="text-2xl font-bold leading-tight text-gray-900">
                        Create New Tenant
                    </h2>
                </div>
            }
        >
            <Head title="Create Tenant" />

            <div className="max-w-3xl mx-auto">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Tenant Information</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Create a new tenant organization and its initial administrator account.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-6 p-6">
                        {/* Tenant Details Section */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-2 text-lg font-medium text-gray-900">
                                <BuildingOfficeIcon className="h-5 w-5 text-indigo-600" />
                                <span>Organization Details</span>
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="name" value="Organization Name" />
                                    <TextInput
                                        id="name"
                                        name="name"
                                        value={data.name}
                                        className="mt-1 block w-full"
                                        autoComplete="organization"
                                        isFocused={true}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g., Acme Corporation"
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="domain" value="Subdomain" />
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <TextInput
                                            id="domain"
                                            name="domain"
                                            value={data.domain}
                                            className="block w-full rounded-none rounded-l-md"
                                            onChange={(e) => setData('domain', e.target.value)}
                                            placeholder="acme"
                                        />
                                        <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                            .localhost
                                        </span>
                                    </div>
                                    <InputError message={errors.domain} className="mt-2" />
                                    <p className="mt-1 text-sm text-gray-500">
                                        This will be used for tenant-specific access
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Admin User Section */}
                        <div className="space-y-6 pt-6 border-t border-gray-200">
                            <div className="flex items-center space-x-2 text-lg font-medium text-gray-900">
                                <UserIcon className="h-5 w-5 text-emerald-600" />
                                <span>Administrator Account</span>
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="admin_name" value="Admin Full Name" />
                                    <TextInput
                                        id="admin_name"
                                        name="admin_name"
                                        value={data.admin_name}
                                        className="mt-1 block w-full"
                                        autoComplete="name"
                                        onChange={(e) => setData('admin_name', e.target.value)}
                                        placeholder="e.g., John Doe"
                                    />
                                    <InputError message={errors.admin_name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="admin_email" value="Admin Email" />
                                    <TextInput
                                        id="admin_email"
                                        name="admin_email"
                                        type="email"
                                        value={data.admin_email}
                                        className="mt-1 block w-full"
                                        autoComplete="email"
                                        onChange={(e) => setData('admin_email', e.target.value)}
                                        placeholder="e.g., admin@acme.com"
                                    />
                                    <InputError message={errors.admin_email} className="mt-2" />
                                    <p className="mt-1 text-sm text-gray-500">
                                        This user will become the tenant administrator
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="rounded-md bg-blue-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <GlobeAltIcon className="h-5 w-5 text-blue-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">
                                        What happens when you create a tenant?
                                    </h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <ul className="list-disc space-y-1 pl-5">
                                            <li>A new tenant organization will be created</li>
                                            <li>Tenant-specific roles will be automatically set up</li>
                                            <li>The admin user will be created with full tenant permissions</li>
                                            <li>The default password will be "password" (should be changed immediately)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-6 border-t border-gray-200">
                            <div className="flex justify-end space-x-3">
                                <SecondaryButton>
                                    <Link href={route('central-admin.tenants.index')}>
                                        Cancel
                                    </Link>
                                </SecondaryButton>
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Creating...' : 'Create Tenant'}
                                </PrimaryButton>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Additional Info */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-gray-900">
                                After Creation
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                                The tenant admin will need to log in with their email and the default password "password". 
                                They should change their password immediately and can then start managing their organization.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </CentralAdminLayout>
    );
} 