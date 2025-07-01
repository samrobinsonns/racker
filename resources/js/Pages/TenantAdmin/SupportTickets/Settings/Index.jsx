import { useState, useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import TenantAdminLayout from '@/Layouts/TenantAdminLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Checkbox from '@/Components/Checkbox';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import { Tab } from '@headlessui/react';
import { 
    Cog6ToothIcon,
    EnvelopeIcon,
    TagIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default function Index({ settings, emailSettings, categories, permissions }) {
    const [selectedTab, setSelectedTab] = useState(0);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTestResultModal, setShowTestResultModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [testingConnection, setTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const { flash } = usePage().props;

    // Show test result modal if we have a flash message
    useEffect(() => {
        if (flash.test_result) {
            setTestResult(flash.test_result);
            setShowTestResultModal(true);
        }
    }, [flash]);

    // Ticket Settings Form
    const ticketSettingsForm = useForm({
        auto_assign_tickets: settings.auto_assign_tickets || false,
        notify_admins_on_new_ticket: settings.notify_admins_on_new_ticket || false,
        notify_assignee_on_update: settings.notify_assignee_on_update || false,
        allow_file_attachments: settings.allow_file_attachments || false,
        max_attachment_size: settings.max_attachment_size || 10,
        allowed_file_types: settings.allowed_file_types || [],
        default_priority: settings.default_priority || 'medium',
        auto_close_resolved_after_days: settings.auto_close_resolved_after_days || 7,
    });

    // Email Settings Form
    const emailSettingsForm = useForm({
        smtp_host: emailSettings?.smtp_host || '',
        smtp_port: emailSettings?.smtp_port || '587',
        smtp_username: emailSettings?.smtp_username || '',
        smtp_password: emailSettings?.smtp_password || '',
        from_email: emailSettings?.from_email || '',
        from_name: emailSettings?.from_name || '',
        use_ssl: emailSettings?.use_ssl ?? true,
        is_active: emailSettings?.is_active ?? false,
    });

    // Category Form
    const categoryForm = useForm({
        name: '',
        description: '',
        color: '#4F46E5',
    });

    const handleTicketSettingsSubmit = (e) => {
        e.preventDefault();
        ticketSettingsForm.patch(route('tenant-admin.support-tickets.settings'));
    };

    const handleEmailSettingsSubmit = (e) => {
        e.preventDefault();
        emailSettingsForm.post(route('tenant-admin.email-settings.store'), {
            onSuccess: () => {
                // Form submission successful
            },
            preserveScroll: true
        });
    };

    const testEmailConnection = () => {
        setTestingConnection(true);
        setTestResult(null);

        emailSettingsForm.post(route('tenant-admin.email-settings.test', { settings_id: emailSettings?.id }), {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setTestingConnection(false)
        });
    };

    const handleCategorySubmit = (e) => {
        e.preventDefault();
        
        if (editingCategory) {
            categoryForm.put(route('tenant-admin.support-tickets.categories.update', editingCategory.id), {
                onSuccess: () => {
                    setShowCreateModal(false);
                    setEditingCategory(null);
                    categoryForm.reset();
                },
                preserveScroll: true
            });
        } else {
            categoryForm.post(route('tenant-admin.support-tickets.categories.store'), {
                onSuccess: () => {
                    setShowCreateModal(false);
                    categoryForm.reset();
                },
                preserveScroll: true
            });
        }
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        categoryForm.setData({
            name: category.name,
            description: category.description,
            color: category.color,
        });
        setShowCreateModal(true);
    };

    const handleDeleteCategory = (category) => {
        if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            categoryForm.delete(route('tenant-admin.support-tickets.categories.destroy', category.id));
        }
    };

    return (
        <TenantAdminLayout>
            <Head title="Support Ticket Settings" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex items-center space-x-4 mb-6">
                                <Cog6ToothIcon className="h-8 w-8 text-emerald-600" />
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Support System Settings
                                </h1>
                            </div>

                            <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                                <Tab.List className="flex space-x-1 rounded-xl bg-emerald-900/10 p-1">
                                    <Tab className={({ selected }) =>
                                        classNames(
                                            'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                                            'ring-white ring-opacity-60 ring-offset-2 focus:outline-none focus:ring-2',
                                            selected
                                                ? 'bg-white text-emerald-700 shadow'
                                                : 'text-gray-600 hover:bg-white/[0.12] hover:text-emerald-600'
                                        )
                                    }>
                                        General Settings
                                    </Tab>
                                    <Tab className={({ selected }) =>
                                        classNames(
                                            'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                                            'ring-white ring-opacity-60 ring-offset-2 focus:outline-none focus:ring-2',
                                            selected
                                                ? 'bg-white text-emerald-700 shadow'
                                                : 'text-gray-600 hover:bg-white/[0.12] hover:text-emerald-600'
                                        )
                                    }>
                                        Email Configuration
                                    </Tab>
                                    <Tab className={({ selected }) =>
                                        classNames(
                                            'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                                            'ring-white ring-opacity-60 ring-offset-2 focus:outline-none focus:ring-2',
                                            selected
                                                ? 'bg-white text-emerald-700 shadow'
                                                : 'text-gray-600 hover:bg-white/[0.12] hover:text-emerald-600'
                                        )
                                    }>
                                        Categories
                                    </Tab>
                                </Tab.List>

                                <Tab.Panels className="mt-6">
                                    {/* General Settings Panel */}
                                    <Tab.Panel>
                                        <form onSubmit={handleTicketSettingsSubmit} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Ticket Assignment */}
                                                <div className="col-span-2">
                                                    <div className="flex items-start">
                                                        <div className="flex items-center h-5">
                                                            <Checkbox
                                                                name="auto_assign_tickets"
                                                                checked={ticketSettingsForm.data.auto_assign_tickets}
                                                                onChange={e => ticketSettingsForm.setData('auto_assign_tickets', e.target.checked)}
                                                            />
                                                        </div>
                                                        <div className="ml-3 text-sm">
                                                            <InputLabel value="Automatically assign tickets" />
                                                            <p className="text-gray-500">Enable automatic ticket assignment based on workload and availability.</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Notifications */}
                                                <div className="col-span-2">
                                                    <div className="flex items-start">
                                                        <div className="flex items-center h-5">
                                                            <Checkbox
                                                                name="notify_admins_on_new_ticket"
                                                                checked={ticketSettingsForm.data.notify_admins_on_new_ticket}
                                                                onChange={e => ticketSettingsForm.setData('notify_admins_on_new_ticket', e.target.checked)}
                                                            />
                                                        </div>
                                                        <div className="ml-3 text-sm">
                                                            <InputLabel value="Notify admins on new tickets" />
                                                            <p className="text-gray-500">Send notifications to admins when new tickets are created.</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-span-2">
                                                    <div className="flex items-start">
                                                        <div className="flex items-center h-5">
                                                            <Checkbox
                                                                name="notify_assignee_on_update"
                                                                checked={ticketSettingsForm.data.notify_assignee_on_update}
                                                                onChange={e => ticketSettingsForm.setData('notify_assignee_on_update', e.target.checked)}
                                                            />
                                                        </div>
                                                        <div className="ml-3 text-sm">
                                                            <InputLabel value="Notify assignee on updates" />
                                                            <p className="text-gray-500">Send notifications to assignees when tickets are updated.</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* File Attachments */}
                                                <div className="col-span-2">
                                                    <div className="flex items-start">
                                                        <div className="flex items-center h-5">
                                                            <Checkbox
                                                                name="allow_file_attachments"
                                                                checked={ticketSettingsForm.data.allow_file_attachments}
                                                                onChange={e => ticketSettingsForm.setData('allow_file_attachments', e.target.checked)}
                                                            />
                                                        </div>
                                                        <div className="ml-3 text-sm">
                                                            <InputLabel value="Allow file attachments" />
                                                            <p className="text-gray-500">Enable file attachments on tickets and replies.</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <InputLabel htmlFor="max_attachment_size" value="Maximum attachment size (MB)" />
                                                    <TextInput
                                                        id="max_attachment_size"
                                                        type="number"
                                                        className="mt-1 block w-full"
                                                        value={ticketSettingsForm.data.max_attachment_size}
                                                        onChange={e => ticketSettingsForm.setData('max_attachment_size', e.target.value)}
                                                    />
                                                </div>

                                                <div>
                                                    <InputLabel htmlFor="default_priority" value="Default ticket priority" />
                                                    <select
                                                        id="default_priority"
                                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                        value={ticketSettingsForm.data.default_priority}
                                                        onChange={e => ticketSettingsForm.setData('default_priority', e.target.value)}
                                                    >
                                                        <option value="low">Low</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="high">High</option>
                                                        <option value="urgent">Urgent</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <InputLabel htmlFor="auto_close_resolved_after_days" value="Auto-close resolved tickets after (days)" />
                                                    <TextInput
                                                        id="auto_close_resolved_after_days"
                                                        type="number"
                                                        className="mt-1 block w-full"
                                                        value={ticketSettingsForm.data.auto_close_resolved_after_days}
                                                        onChange={e => ticketSettingsForm.setData('auto_close_resolved_after_days', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {permissions.update && (
                                                <div className="flex justify-end">
                                                    <PrimaryButton disabled={ticketSettingsForm.processing}>
                                                        {ticketSettingsForm.processing ? 'Saving...' : 'Save Settings'}
                                                    </PrimaryButton>
                                                </div>
                                            )}
                                        </form>
                                    </Tab.Panel>

                                    {/* Email Settings Panel */}
                                    <Tab.Panel>
                                        <form onSubmit={handleEmailSettingsSubmit} className="space-y-6">
                                            {/* Connection Status */}
                                            {emailSettings && (
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <div className="flex items-center space-x-3">
                                                        {emailSettings.last_test_successful ? (
                                                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                                        ) : emailSettings.last_tested_at ? (
                                                            <XCircleIcon className="h-5 w-5 text-red-500" />
                                                        ) : (
                                                            <div className="h-5 w-5 rounded-full bg-gray-200" />
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {emailSettings.last_tested_at ? (
                                                                    emailSettings.last_test_successful ? 
                                                                    'Connection verified' : 
                                                                    'Connection failed'
                                                                ) : 'Not tested'}
                                                            </p>
                                                            {emailSettings.last_tested_at && (
                                                                <p className="text-xs text-gray-500">
                                                                    Last tested: {new Date(emailSettings.last_tested_at).toLocaleString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Test Results */}
                                            {testResult && (
                                                <div className={`rounded-lg p-4 ${
                                                    testResult.success ? 'bg-green-50' : 'bg-red-50'
                                                }`}>
                                                    <div className="flex items-center space-x-3">
                                                        {testResult.success ? (
                                                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                                        ) : (
                                                            <XCircleIcon className="h-5 w-5 text-red-500" />
                                                        )}
                                                        <p className={`text-sm ${
                                                            testResult.success ? 'text-green-700' : 'text-red-700'
                                                        }`}>
                                                            {testResult.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* SendGrid Configuration - Temporarily Disabled
                                            <div className="col-span-2 bg-blue-50 p-4 rounded-lg">
                                                <div className="text-sm text-blue-700">
                                                    <strong>SendGrid Configuration:</strong> When using SendGrid, make sure to:
                                                </div>
                                                <ul className="list-disc ml-8 mt-2 text-sm text-blue-700">
                                                    <li>Use "apikey" as the SMTP Username</li>
                                                    <li>Use your SendGrid API Key as the SMTP Password</li>
                                                    <li>Keep SSL/TLS enabled</li>
                                                </ul>
                                            </div>
                                            */}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <InputLabel htmlFor="smtp_host" value="SMTP Host" />
                                                    <TextInput
                                                        id="smtp_host"
                                                        type="text"
                                                        className="mt-1 block w-full"
                                                        value={emailSettingsForm.data.smtp_host}
                                                        onChange={(e) => emailSettingsForm.setData('smtp_host', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={emailSettingsForm.errors.smtp_host} className="mt-2" />
                                                </div>

                                                <div>
                                                    <InputLabel htmlFor="smtp_port" value="SMTP Port" />
                                                    <TextInput
                                                        id="smtp_port"
                                                        type="number"
                                                        className="mt-1 block w-full"
                                                        value={emailSettingsForm.data.smtp_port}
                                                        onChange={(e) => emailSettingsForm.setData('smtp_port', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={emailSettingsForm.errors.smtp_port} className="mt-2" />
                                                </div>

                                                <div>
                                                    <InputLabel htmlFor="smtp_username" value="SMTP Username" />
                                                    <TextInput
                                                        id="smtp_username"
                                                        type="text"
                                                        className="mt-1 block w-full"
                                                        value={emailSettingsForm.data.smtp_username}
                                                        onChange={(e) => emailSettingsForm.setData('smtp_username', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={emailSettingsForm.errors.smtp_username} className="mt-2" />
                                                </div>

                                                <div>
                                                    <InputLabel htmlFor="smtp_password" value="SMTP Password" />
                                                    <TextInput
                                                        id="smtp_password"
                                                        type="password"
                                                        className="mt-1 block w-full"
                                                        value={emailSettingsForm.data.smtp_password}
                                                        onChange={(e) => emailSettingsForm.setData('smtp_password', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={emailSettingsForm.errors.smtp_password} className="mt-2" />
                                                </div>

                                                <div>
                                                    <InputLabel htmlFor="from_email" value="From Email" />
                                                    <TextInput
                                                        id="from_email"
                                                        type="email"
                                                        className="mt-1 block w-full"
                                                        value={emailSettingsForm.data.from_email}
                                                        onChange={(e) => emailSettingsForm.setData('from_email', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={emailSettingsForm.errors.from_email} className="mt-2" />
                                                </div>

                                                <div>
                                                    <InputLabel htmlFor="from_name" value="From Name" />
                                                    <TextInput
                                                        id="from_name"
                                                        type="text"
                                                        className="mt-1 block w-full"
                                                        value={emailSettingsForm.data.from_name}
                                                        onChange={(e) => emailSettingsForm.setData('from_name', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={emailSettingsForm.errors.from_name} className="mt-2" />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                                                        checked={emailSettingsForm.data.use_ssl}
                                                        onChange={(e) => emailSettingsForm.setData('use_ssl', e.target.checked)}
                                                    />
                                                    <span className="ml-2 text-sm text-gray-600">
                                                        Use SSL/TLS
                                                    </span>
                                                </label>

                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                                                        checked={emailSettingsForm.data.is_active}
                                                        onChange={(e) => emailSettingsForm.setData('is_active', e.target.checked)}
                                                    />
                                                    <span className="ml-2 text-sm text-gray-600">
                                                        Set as active configuration
                                                    </span>
                                                </label>
                                            </div>

                                            <div className="flex items-center justify-end space-x-3">
                                                {emailSettings?.id && (
                                                    <SecondaryButton
                                                        type="button"
                                                        onClick={testEmailConnection}
                                                        disabled={testingConnection || emailSettingsForm.processing}
                                                    >
                                                        {testingConnection ? (
                                                            <>
                                                                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                                                                Testing...
                                                            </>
                                                        ) : (
                                                            'Test Connection'
                                                        )}
                                                    </SecondaryButton>
                                                )}

                                                <PrimaryButton disabled={emailSettingsForm.processing}>
                                                    {emailSettingsForm.processing ? 'Saving...' : 'Save Settings'}
                                                </PrimaryButton>
                                            </div>
                                        </form>
                                    </Tab.Panel>

                                    {/* Categories Panel */}
                                    <Tab.Panel>
                                        <div className="bg-white shadow rounded-lg">
                                            <div className="px-6 py-4 border-b border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900">
                                                            Categories
                                                        </h3>
                                                        <p className="mt-1 text-sm text-gray-600">
                                                            Manage support ticket categories for your organization.
                                                        </p>
                                                    </div>
                                                    <SecondaryButton onClick={() => {
                                                        categoryForm.reset();
                                                        setEditingCategory(null);
                                                        setShowCreateModal(true);
                                                    }}>
                                                        <PlusIcon className="h-4 w-4 mr-2" />
                                                        Add Category
                                                    </SecondaryButton>
                                                </div>
                                            </div>

                                            <div className="p-6">
                                                <div className="overflow-hidden">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead>
                                                            <tr>
                                                                <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Category
                                                                </th>
                                                                <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Description
                                                                </th>
                                                                <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Tickets
                                                                </th>
                                                                <th scope="col" className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Actions
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {Array.isArray(categories) && categories.map((category) => (
                                                                <tr key={category.id}>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="flex items-center">
                                                                            <div 
                                                                                className="h-4 w-4 rounded mr-2"
                                                                                style={{ backgroundColor: category.color }}
                                                                            />
                                                                            <div className="text-sm font-medium text-gray-900">
                                                                                {category.name}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="text-sm text-gray-500">
                                                                            {category.description || '-'}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm text-gray-500">
                                                                            {category.tickets_count || 0}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                        <div className="flex items-center justify-end space-x-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleEditCategory(category)}
                                                                                className="text-gray-400 hover:text-gray-500"
                                                                            >
                                                                                <PencilIcon className="h-4 w-4" />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDeleteCategory(category)}
                                                                                className="text-gray-400 hover:text-red-500"
                                                                            >
                                                                                <TrashIcon className="h-4 w-4" />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {(!Array.isArray(categories) || categories.length === 0) && (
                                                                <tr>
                                                                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                                                                        No categories found. Create one to get started.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </Tab.Panel>
                                </Tab.Panels>
                            </Tab.Group>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Create/Edit Modal */}
            <Modal show={showCreateModal} onClose={() => {
                setShowCreateModal(false);
                setEditingCategory(null);
                categoryForm.reset();
            }}>
                <form onSubmit={handleCategorySubmit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        {editingCategory ? 'Edit Category' : 'Create Category'}
                    </h2>

                    <div className="mt-6">
                        <InputLabel htmlFor="name" value="Name" />
                        <TextInput
                            id="name"
                            type="text"
                            className="mt-1 block w-full"
                            value={categoryForm.data.name}
                            onChange={(e) => categoryForm.setData('name', e.target.value)}
                            required
                        />
                        <InputError message={categoryForm.errors.name} className="mt-2" />
                    </div>

                    <div className="mt-6">
                        <InputLabel htmlFor="description" value="Description" />
                        <TextInput
                            id="description"
                            type="text"
                            className="mt-1 block w-full"
                            value={categoryForm.data.description}
                            onChange={(e) => categoryForm.setData('description', e.target.value)}
                        />
                        <InputError message={categoryForm.errors.description} className="mt-2" />
                    </div>

                    <div className="mt-6">
                        <InputLabel htmlFor="color" value="Color" />
                        <input
                            id="color"
                            type="color"
                            className="mt-1 block w-full h-10 p-1 rounded-md border-gray-300"
                            value={categoryForm.data.color}
                            onChange={(e) => categoryForm.setData('color', e.target.value)}
                        />
                        <InputError message={categoryForm.errors.color} className="mt-2" />
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <SecondaryButton onClick={() => {
                            setShowCreateModal(false);
                            setEditingCategory(null);
                            categoryForm.reset();
                        }}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton disabled={categoryForm.processing}>
                            {categoryForm.processing ? 'Saving...' : (editingCategory ? 'Save Changes' : 'Create Category')}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Email Test Result Modal */}
            <Modal show={showTestResultModal} onClose={() => setShowTestResultModal(false)}>
                <div className="p-6">
                    <div className="flex items-center">
                        {testResult?.success ? (
                            <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
                        ) : (
                            <XCircleIcon className="h-6 w-6 text-red-500 mr-3" />
                        )}
                        <h3 className="text-lg font-medium text-gray-900">
                            {testResult?.success ? 'Connection Successful' : 'Connection Failed'}
                        </h3>
                    </div>
                    
                    <div className="mt-4">
                        <p className={`text-sm ${testResult?.success ? 'text-green-600' : 'text-red-600'}`}>
                            {testResult?.message}
                        </p>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={() => setShowTestResultModal(false)}>
                            Close
                        </SecondaryButton>
                    </div>
                </div>
            </Modal>
        </TenantAdminLayout>
    );
} 