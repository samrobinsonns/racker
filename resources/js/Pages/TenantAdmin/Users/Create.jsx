import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { UserIcon, EnvelopeIcon, KeyIcon, ShieldCheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function Create({ availableRoles, tenantId }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        role_id: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('tenant-admin.users.store'), {
            onSuccess: () => reset(),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-4">
                    <Link
                        href={route('tenant-admin.users.index')}
                        className="text-gray-500 hover:text-gray-700 flex items-center"
                    >
                        <ArrowLeftIcon className="h-5 w-5 mr-1" />
                        Back to Users
                    </Link>
                    <h2 className="text-2xl font-bold leading-tight text-gray-900">
                        Add New User
                    </h2>
                </div>
            }
        >
            <Head title="Add New User" />

            <div className="max-w-2xl mx-auto">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                            <UserIcon className="h-5 w-5 text-emerald-600" />
                            <h3 className="text-lg font-medium text-gray-900">
                                User Information
                            </h3>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                            Add a new user to your organization. They will receive an email invitation to set their password.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-6 p-6">
                        {/* User Details */}
                        <div className="space-y-6">
                            <div>
                                <InputLabel htmlFor="name" value="Full Name" />
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <TextInput
                                        id="name"
                                        name="name"
                                        value={data.name}
                                        className="pl-10 block w-full"
                                        autoComplete="name"
                                        isFocused={true}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g., John Doe"
                                    />
                                </div>
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="email" value="Email Address" />
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <TextInput
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={data.email}
                                        className="pl-10 block w-full"
                                        autoComplete="email"
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="e.g., john@company.com"
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-2" />
                                <p className="mt-1 text-sm text-gray-500">
                                    User will receive an invitation email to set their password
                                </p>
                            </div>

                            <div>
                                <InputLabel htmlFor="role_id" value="Role" />
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select
                                        id="role_id"
                                        name="role_id"
                                        value={data.role_id}
                                        onChange={(e) => setData('role_id', e.target.value)}
                                        className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    >
                                        <option value="">Select a role...</option>
                                        {availableRoles.map((role) => (
                                            <option key={role.id} value={role.id}>
                                                {role.display_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <InputError message={errors.role_id} className="mt-2" />
                                <p className="mt-1 text-sm text-gray-500">
                                    Determines what the user can access within your organization
                                </p>
                            </div>
                        </div>

                        {/* Role Information */}
                        {data.role_id && (
                            <div className="rounded-md bg-emerald-50 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <ShieldCheckIcon className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-emerald-800">
                                            Role Information
                                        </h3>
                                        <div className="mt-2 text-sm text-emerald-700">
                                            {(() => {
                                                const selectedRole = availableRoles.find(role => role.id == data.role_id);
                                                return selectedRole ? (
                                                    <div>
                                                        <p><strong>{selectedRole.display_name}</strong></p>
                                                        <p className="mt-1">{selectedRole.description || 'Role with specific permissions within your organization.'}</p>
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Notice */}
                        <div className="rounded-md bg-gray-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <KeyIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-gray-900">
                                        Password & Security
                                    </h3>
                                    <div className="mt-2 text-sm text-gray-600">
                                        <ul className="list-disc space-y-1 pl-5">
                                            <li>User will be created with a temporary password: "password"</li>
                                            <li>They should change it immediately upon first login</li>
                                            <li>Consider implementing email verification for enhanced security</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-6 border-t border-gray-200">
                            <div className="flex justify-end space-x-3">
                                <SecondaryButton>
                                    <Link href={route('tenant-admin.users.index')}>
                                        Cancel
                                    </Link>
                                </SecondaryButton>
                                <PrimaryButton disabled={processing} className="bg-emerald-600 hover:bg-emerald-700">
                                    {processing ? 'Creating User...' : 'Create User'}
                                </PrimaryButton>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 