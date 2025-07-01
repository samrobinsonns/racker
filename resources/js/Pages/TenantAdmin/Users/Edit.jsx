import { useForm, usePage } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import { UserIcon, EnvelopeIcon, ShieldCheckIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';

export default function EditUserModal({ show, onClose, user, availableRoles }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const { data, setData, put, processing, errors, reset } = useForm({
        name: '',
        email: '',
        role_id: '',
    });

    // Reset form when modal is opened with new user data
    useEffect(() => {
        if (show && user) {
            setData({
                name: user.name || '',
                email: user.email || '',
                role_id: user.roles && user.roles.length > 0 ? user.roles[0].id : '',
            });
        } else {
            reset();
            setShowDeleteConfirm(false);
        }
    }, [show, user]);

    const { delete: destroy, processing: deleting } = useForm();

    const submit = (e) => {
        e.preventDefault();
        put(route('tenant-admin.users.update', user.id), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const handleDelete = () => {
        destroy(route('tenant-admin.users.destroy', user.id), {
            onSuccess: () => {
                onClose();
            },
        });
    };

    const currentUser = usePage().props.auth.user;
    const canDelete = user?.id !== currentUser.id; // Cannot delete yourself

    return (
        <Transition show={show} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border-2 border-emerald-500">
                                <div className="bg-white rounded-lg">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <Dialog.Title className="text-lg font-medium text-gray-900">
                                                Edit User
                                            </Dialog.Title>
                                            <button
                                                type="button"
                                                className="text-gray-400 hover:text-gray-500"
                                                onClick={onClose}
                                            >
                                                <XMarkIcon className="h-6 w-6" />
                                            </button>
                                        </div>
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
                                        {user && (
                                            <div className="rounded-md bg-gray-50 p-4">
                                                <div className="text-sm text-gray-600">
                                                    <p><strong>User ID:</strong> {user.id}</p>
                                                    <p><strong>Status:</strong> {user.email_verified_at ? 'Active' : 'Pending Email Verification'}</p>
                                                    <p><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                                                    <p><strong>Last Updated:</strong> {new Date(user.updated_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="pt-6 border-t border-gray-200">
                                            <div className="flex justify-between">
                                                <div>
                                                    {canDelete && !showDeleteConfirm && (
                                                        <DangerButton type="button" onClick={() => setShowDeleteConfirm(true)}>
                                                            Delete User
                                                        </DangerButton>
                                                    )}
                                                    {showDeleteConfirm && (
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
                                                <div className="flex space-x-3">
                                                    <SecondaryButton type="button" onClick={onClose}>
                                                        Cancel
                                                    </SecondaryButton>
                                                    <PrimaryButton disabled={processing} className="bg-emerald-600 hover:bg-emerald-700">
                                                        {processing ? 'Updating...' : 'Update User'}
                                                    </PrimaryButton>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
} 