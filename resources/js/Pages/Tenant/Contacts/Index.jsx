import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import ContactDrawer from '@/Components/Contacts/ContactDrawer';
import { MagnifyingGlassIcon, PlusIcon, UserIcon, EnvelopeIcon, PhoneIcon, BuildingOfficeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import debounce from 'lodash/debounce';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

function CreateContactModal({ show, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        mobile: '',
        job_title: '',
        company: '',
        department: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('tenant.contacts.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
                router.visit(route('tenant.contacts.index'), {
                    only: ['contacts'],
                    preserveScroll: true,
                });
            },
            onError: () => {
                // Stay on the form if there are errors
            },
        });
    };

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
                            <Dialog.Panel className="relative transform rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border-2 border-indigo-500">
                                <div className="bg-white rounded-lg">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <UserIcon className="h-5 w-5 text-indigo-600" />
                                                <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                                                    Add New Contact
                                                </Dialog.Title>
                                            </div>
                                            <button
                                                type="button"
                                                className="text-gray-400 hover:text-gray-500"
                                                onClick={onClose}
                                            >
                                                <XMarkIcon className="h-6 w-6" />
                                            </button>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600">
                                            Add a new contact to your directory. Fill in the details below.
                                        </p>
                                    </div>

                                    <form onSubmit={submit} className="p-6">
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                            <div>
                                                <InputLabel htmlFor="first_name" value="First Name" />
                                                <div className="mt-1 relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <UserIcon className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <TextInput
                                                        id="first_name"
                                                        type="text"
                                                        value={data.first_name}
                                                        className="pl-10 block w-full"
                                                        onChange={(e) => setData('first_name', e.target.value)}
                                                        isFocused={true}
                                                    />
                                                </div>
                                                <InputError message={errors.first_name} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="last_name" value="Last Name" />
                                                <div className="mt-1 relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <UserIcon className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <TextInput
                                                        id="last_name"
                                                        type="text"
                                                        value={data.last_name}
                                                        className="pl-10 block w-full"
                                                        onChange={(e) => setData('last_name', e.target.value)}
                                                    />
                                                </div>
                                                <InputError message={errors.last_name} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="email" value="Email" />
                                                <div className="mt-1 relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <TextInput
                                                        id="email"
                                                        type="email"
                                                        value={data.email}
                                                        className="pl-10 block w-full"
                                                        onChange={(e) => setData('email', e.target.value)}
                                                    />
                                                </div>
                                                <InputError message={errors.email} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="phone" value="Phone" />
                                                <div className="mt-1 relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <TextInput
                                                        id="phone"
                                                        type="tel"
                                                        value={data.phone}
                                                        className="pl-10 block w-full"
                                                        onChange={(e) => setData('phone', e.target.value)}
                                                    />
                                                </div>
                                                <InputError message={errors.phone} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="mobile" value="Mobile" />
                                                <div className="mt-1 relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <TextInput
                                                        id="mobile"
                                                        type="tel"
                                                        value={data.mobile}
                                                        className="pl-10 block w-full"
                                                        onChange={(e) => setData('mobile', e.target.value)}
                                                    />
                                                </div>
                                                <InputError message={errors.mobile} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="job_title" value="Job Title" />
                                                <div className="mt-1 relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <TextInput
                                                        id="job_title"
                                                        type="text"
                                                        value={data.job_title}
                                                        className="pl-10 block w-full"
                                                        onChange={(e) => setData('job_title', e.target.value)}
                                                    />
                                                </div>
                                                <InputError message={errors.job_title} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="company" value="Company" />
                                                <div className="mt-1 relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <TextInput
                                                        id="company"
                                                        type="text"
                                                        value={data.company}
                                                        className="pl-10 block w-full"
                                                        onChange={(e) => setData('company', e.target.value)}
                                                    />
                                                </div>
                                                <InputError message={errors.company} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="department" value="Department" />
                                                <div className="mt-1 relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <TextInput
                                                        id="department"
                                                        type="text"
                                                        value={data.department}
                                                        className="pl-10 block w-full"
                                                        onChange={(e) => setData('department', e.target.value)}
                                                    />
                                                </div>
                                                <InputError message={errors.department} className="mt-2" />
                                            </div>
                                        </div>

                                        <div className="mt-6 flex justify-end space-x-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={onClose}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                            >
                                                {processing ? 'Creating...' : 'Create Contact'}
                                            </Button>
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

export default function Index({ auth, contacts }) {
    const [selectedContact, setSelectedContact] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const handleContactClick = (contact) => {
        setSelectedContact(contact);
        setDrawerOpen(true);
    };

    const refreshContacts = () => {
        router.reload({ only: ['contacts'] });
    };

    const handleSearch = debounce((value) => {
        router.get(route('tenant.contacts.index'), 
            { search: value }, 
            { preserveState: true }
        );
    }, 300);

    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title="Contacts" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Title Section */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h1 className="text-3xl font-bold text-gray-900">Contact Directory</h1>
                            <p className="mt-2 text-sm text-gray-600">View and manage all your contacts in one place. Use the search below to find specific contacts.</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex gap-4 items-center">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search contacts..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            handleSearch(e.target.value);
                                        }}
                                        className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    />
                                </div>
                                <Button
                                    onClick={() => setShowCreateModal(true)}
                                    size="sm"
                                    className="shrink-0"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add Contact
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Contacts Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Phone
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Company
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {contacts.data.map((contact) => (
                                        <tr
                                            key={contact.id}
                                            onClick={() => handleContactClick(contact)}
                                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {contact.first_name} {contact.last_name}
                                                </div>
                                                {contact.job_title && (
                                                    <div className="text-sm text-gray-500">
                                                        {contact.job_title}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {contact.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {contact.phone || contact.mobile}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {contact.company}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <CreateContactModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />

            {selectedContact && (
                <ContactDrawer
                    key={selectedContact.id}
                    contact={selectedContact}
                    isOpen={drawerOpen}
                    onClose={() => {
                        setDrawerOpen(false);
                        setTimeout(() => setSelectedContact(null), 300);
                    }}
                    onSuccess={() => {
                        refreshContacts();
                        setDrawerOpen(false);
                        setTimeout(() => setSelectedContact(null), 300);
                    }}
                />
            )}
        </AuthenticatedLayout>
    );
} 