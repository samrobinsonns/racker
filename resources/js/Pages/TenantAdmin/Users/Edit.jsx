import { Head, useForm, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import { UserIcon, EnvelopeIcon, ShieldCheckIcon, ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function Edit({ user, availableRoles, tenantId }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const { data, setData, put, processing, errors } = useForm({
        name: user.name || '',
        email: user.email || '',
        role_id: user.roles && user.roles.length > 0 ? user.roles[0].id : '',
    });

    const { delete: destroy, processing: deleting } = useForm();

    const submit = (e) => {
        e.preventDefault();
        put(route('tenant-admin.users.update', user.id));
    };

    const handleDelete = () => {
        destroy(route('tenant-admin.users.destroy', user.id));
    };

    const currentUser = usePage().props.auth.user;
    const canDelete = user.id !== currentUser.id; // Cannot delete yourself

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
                        Edit User
                    </h2>
                </div>
            }
        >
            <Head title={`Edit ${user.name}`} />

            <div className="max-w-2xl mx-auto space-y-6">
                {/* User Information */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                            <UserIcon className="h-5 w-5 text-emerald-600" />
                            <h3 className="text-lg font-medium text-gray-900">
                                User Information
                            </h3>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                            Update user details and role assignments.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-6 p-6">
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
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-2" />
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
                                        <option value="">No role assigned</option>
                                        {availableRoles.map((role) => (
                                            <option key={role.id} value={role.id}>
                                                {role.display_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <InputError message={errors.role_id} className="mt-2" />
                            </div>
                        </div>

                        {/* User Status Info */}
                        <div className="rounded-md bg-gray-50 p-4">
                            <div className="text-sm text-gray-600">
                                <p><strong>User ID:</strong> {user.id}</p>
                                <p><strong>Status:</strong> {user.email_verified_at ? 'Active' : 'Pending Email Verification'}</p>
                                <p><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                                <p><strong>Last Updated:</strong> {new Date(user.updated_at).toLocaleDateString()}</p>
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
                                    {processing ? 'Updating...' : 'Update User'}
                                </PrimaryButton>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Danger Zone */}
                {canDelete && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-red-200">
                            <div className="flex items-center space-x-2">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                                <h3 className="text-lg font-medium text-red-900">
                                    Danger Zone
                                </h3>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Delete User</h4>
                                    <p className="text-sm text-gray-600">
                                        Permanently remove this user from your organization. This action cannot be undone.
                                    </p>
                                </div>
                                {!showDeleteConfirm ? (
                                    <DangerButton onClick={() => setShowDeleteConfirm(true)}>
                                        Delete User
                                    </DangerButton>
                                ) : (
                                    <div className="flex items-center space-x-3">
                                        <span className="text-sm text-gray-600">Are you sure?</span>
                                        <SecondaryButton onClick={() => setShowDeleteConfirm(false)}>
                                            Cancel
                                        </SecondaryButton>
                                        <DangerButton 
                                            onClick={handleDelete}
                                            disabled={deleting}
                                        >
                                            {deleting ? 'Deleting...' : 'Confirm Delete'}
                                        </DangerButton>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
} 