import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { ArrowLeftIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

export default function Edit({ tenant }) {
    const { data, setData, put, processing, errors } = useForm({
        name: tenant.name || '',
        status: tenant.status || 'active',
        plan: tenant.plan || 'basic',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('central-admin.tenants.update', tenant.id), {
            data: {
                name: data.name,
                status: data.status,
                plan: data.plan,
            }
        });
    };

    const getStatusOptions = () => [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'suspended', label: 'Suspended' },
    ];

    const getPlanOptions = () => [
        { value: 'basic', label: 'Basic' },
        { value: 'pro', label: 'Pro' },
        { value: 'enterprise', label: 'Enterprise' },
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Edit Tenant: {tenant.data?.name || tenant.id}
                </h2>
            }
        >
            <Head title="Edit Tenant" />

            <div className="max-w-2xl mx-auto">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                            <BuildingOfficeIcon className="h-5 w-5 text-indigo-600" />
                            <h3 className="text-lg font-medium text-gray-900">
                                Edit Tenant Information
                            </h3>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                            Update the tenant's basic information and settings.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-6 p-6">
                        {/* Tenant Name */}
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

                        {/* Status */}
                        <div>
                            <InputLabel htmlFor="status" value="Status" />
                            <select
                                id="status"
                                name="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                {getStatusOptions().map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.status} className="mt-2" />
                            <p className="mt-1 text-sm text-gray-500">
                                Controls whether the tenant can access their organization
                            </p>
                        </div>

                        {/* Plan */}
                        <div>
                            <InputLabel htmlFor="plan" value="Plan" />
                            <select
                                id="plan"
                                name="plan"
                                value={data.plan}
                                onChange={(e) => setData('plan', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                {getPlanOptions().map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.plan} className="mt-2" />
                            <p className="mt-1 text-sm text-gray-500">
                                Determines the features and limits available to this tenant
                            </p>
                        </div>

                        {/* Tenant Info Box */}
                        <div className="rounded-md bg-gray-50 p-4">
                            <div className="text-sm text-gray-600">
                                <p><strong>Tenant ID:</strong> {tenant.id}</p>
                                {tenant.domains && tenant.domains.length > 0 && (
                                    <p><strong>Domain:</strong> {tenant.domains[0].domain}</p>
                                )}
                                <p><strong>Created:</strong> {new Date(tenant.created_at).toLocaleDateString()}</p>
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
                                    {processing ? 'Updating...' : 'Update Tenant'}
                                </PrimaryButton>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 