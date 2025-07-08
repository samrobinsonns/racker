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
import { 
    Cog6ToothIcon,
    EnvelopeIcon,
    TagIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
    InboxIcon
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
    const [imapSettings, setImapSettings] = useState(emailSettings || {});
    const [imapTestResult, setImapTestResult] = useState(null);
    const [testingImapConnection, setTestingImapConnection] = useState(false);
    const { flash } = usePage().props;

    const navigation = [
        { name: 'General Settings', icon: Cog6ToothIcon, current: selectedTab === 0 },
        { name: 'SMTP Settings', icon: EnvelopeIcon, current: selectedTab === 1 },
        { name: 'IMAP Settings', icon: InboxIcon, current: selectedTab === 2 },
        { name: 'Categories', icon: TagIcon, current: selectedTab === 3 },
    ];

    // Show test result modal if we have a flash message
    useEffect(() => {
        if (flash.imap_test_result) {
            setImapTestResult(flash.imap_test_result);
        }
        if (flash.email_settings) {
            setImapSettings(flash.email_settings);
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

    // IMAP Settings Form
    const imapSettingsForm = useForm({
        imap_host: imapSettings.imap_host || '',
        imap_port: imapSettings.imap_port || 993,
        imap_username: imapSettings.imap_username || '',
        imap_password: imapSettings.imap_password || '',
        imap_encryption: imapSettings.imap_encryption || 'ssl',
        imap_folder: imapSettings.imap_folder || 'INBOX',
        imap_enabled: imapSettings.imap_enabled || false,
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

    const handleImapSettingsSubmit = (e) => {
        e.preventDefault();
        imapSettingsForm.post(route('tenant-admin.imap-settings.store'), {
            onSuccess: () => {
                // Form submission successful
            },
            preserveScroll: true
        });
    };

    const testImapConnection = () => {
        setTestingImapConnection(true);
        setImapTestResult(null);

        imapSettingsForm.post(route('tenant-admin.imap-settings.test', { settings_id: imapSettings?.id }), {
            preserveScroll: false,
            preserveState: true,
            onSuccess: () => {
                window.location.href = `${window.location.pathname}?tab=2`;
            },
            onError: (errors) => {
                setImapTestResult({
                    success: false,
                    message: 'Connection test failed: Request timed out or network error occurred.'
                });
            },
            onFinish: () => {
                setTestingImapConnection(false);
            }
        });
    };

    // Initialize selected tab from URL or default to 0
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tabIndex = parseInt(params.get('tab')) || 0;
        setSelectedTab(tabIndex);
    }, []);

    // Update URL when tab changes
    const handleTabChange = (index) => {
        setSelectedTab(index);
        const url = new URL(window.location);
        url.searchParams.set('tab', index);
        window.history.pushState({}, '', url);
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
                        <div className="flex">
                            {/* Sidebar Navigation */}
                            <div className="w-64 bg-white border-r border-gray-200">
                                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                                    <h1 className="text-lg font-medium text-gray-900">Settings</h1>
                                </div>
                                <nav className="flex flex-col p-4 space-y-1">
                                    {navigation.map((item, index) => (
                                        <button
                                            key={item.name}
                                            onClick={() => handleTabChange(index)}
                                            className={classNames(
                                                item.current
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : 'text-gray-600 hover:bg-gray-50',
                                                'group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full'
                                            )}
                                        >
                                            <item.icon
                                                className={classNames(
                                                    item.current ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-500',
                                                    'mr-3 flex-shrink-0 h-6 w-6'
                                                )}
                                                aria-hidden="true"
                                            />
                                            {item.name}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 p-6">
                                {/* General Settings Panel */}
                                {selectedTab === 0 && (
                                    <div>
                                        <div className="flex items-center space-x-4 mb-6">
                                            <Cog6ToothIcon className="h-8 w-8 text-emerald-600" />
                                            <h2 className="text-2xl font-bold text-gray-900">General Settings</h2>
                                        </div>
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
                                    </div>
                                )}

                                {/* Email Settings Panel */}
                                {selectedTab === 1 && (
                                    <div>
                                        <div className="flex items-center space-x-4 mb-6">
                                            <EnvelopeIcon className="h-8 w-8 text-emerald-600" />
                                            <h2 className="text-2xl font-bold text-gray-900">Email Configuration</h2>
                                        </div>
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
                                    </div>
                                )}

                                {/* IMAP Settings Panel */}
                                {selectedTab === 2 && (
                                    <div>
                                        <div className="flex items-center space-x-4 mb-6">
                                            <InboxIcon className="h-8 w-8 text-emerald-600" />
                                            <h2 className="text-2xl font-bold text-gray-900">IMAP Settings</h2>
                                        </div>
                                        <form onSubmit={handleImapSettingsSubmit} className="space-y-6">
                                            {/* Connection Status */}
                                            {imapSettings && (
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <div className="flex items-center space-x-3">
                                                        {imapSettings.imap_last_check_successful ? (
                                                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                                        ) : imapSettings.imap_last_check_at ? (
                                                            <XCircleIcon className="h-5 w-5 text-red-500" />
                                                        ) : (
                                                            <div className="h-5 w-5 rounded-full bg-gray-200" />
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {imapSettings.imap_last_check_at ? (
                                                                    imapSettings.imap_last_check_successful ?
                                                                    'Connection verified' :
                                                                    'Connection failed'
                                                                ) : 'Not tested'}
                                                            </p>
                                                            {imapSettings.imap_last_check_at && (
                                                                <p className="text-xs text-gray-500">
                                                                    Last checked: {new Date(imapSettings.imap_last_check_at).toLocaleString()}
                                                                </p>
                                                            )}
                                                            {imapSettings.imap_last_check_error && !imapSettings.imap_last_check_successful && (
                                                                <p className="text-xs text-red-500">{imapSettings.imap_last_check_error}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Test Results */}
                                            {imapTestResult && (
                                                <div className={`rounded-lg p-4 ${
                                                    imapTestResult.success ? 'bg-green-50' : 'bg-red-50'
                                                }`}>
                                                    <div className="flex items-center space-x-3">
                                                        {imapTestResult.success ? (
                                                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                                        ) : (
                                                            <XCircleIcon className="h-5 w-5 text-red-500" />
                                                        )}
                                                        <p className={`text-sm ${
                                                            imapTestResult.success ? 'text-green-700' : 'text-red-700'
                                                        }`}>
                                                            {imapTestResult.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <InputLabel htmlFor="imap_host" value="IMAP Host" />
                                                    <TextInput
                                                        id="imap_host"
                                                        type="text"
                                                        className="mt-1 block w-full"
                                                        value={imapSettingsForm.data.imap_host}
                                                        onChange={e => imapSettingsForm.setData('imap_host', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={imapSettingsForm.errors.imap_host} className="mt-2" />
                                                </div>
                                                <div>
                                                    <InputLabel htmlFor="imap_port" value="IMAP Port" />
                                                    <TextInput
                                                        id="imap_port"
                                                        type="number"
                                                        className="mt-1 block w-full"
                                                        value={imapSettingsForm.data.imap_port}
                                                        onChange={e => imapSettingsForm.setData('imap_port', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={imapSettingsForm.errors.imap_port} className="mt-2" />
                                                </div>
                                                <div>
                                                    <InputLabel htmlFor="imap_username" value="IMAP Username" />
                                                    <TextInput
                                                        id="imap_username"
                                                        type="text"
                                                        className="mt-1 block w-full"
                                                        value={imapSettingsForm.data.imap_username}
                                                        onChange={e => imapSettingsForm.setData('imap_username', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={imapSettingsForm.errors.imap_username} className="mt-2" />
                                                </div>
                                                <div>
                                                    <InputLabel htmlFor="imap_password" value="IMAP Password" />
                                                    <TextInput
                                                        id="imap_password"
                                                        type="password"
                                                        className="mt-1 block w-full"
                                                        value={imapSettingsForm.data.imap_password}
                                                        onChange={e => imapSettingsForm.setData('imap_password', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={imapSettingsForm.errors.imap_password} className="mt-2" />
                                                </div>
                                                <div>
                                                    <InputLabel htmlFor="imap_encryption" value="Encryption" />
                                                    <select
                                                        id="imap_encryption"
                                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                        value={imapSettingsForm.data.imap_encryption}
                                                        onChange={e => imapSettingsForm.setData('imap_encryption', e.target.value)}
                                                    >
                                                        <option value="ssl">SSL</option>
                                                        <option value="tls">TLS</option>
                                                        <option value="none">None</option>
                                                    </select>
                                                    <InputError message={imapSettingsForm.errors.imap_encryption} className="mt-2" />
                                                </div>
                                                <div>
                                                    <InputLabel htmlFor="imap_folder" value="IMAP Folder" />
                                                    <TextInput
                                                        id="imap_folder"
                                                        type="text"
                                                        className="mt-1 block w-full"
                                                        value={imapSettingsForm.data.imap_folder}
                                                        onChange={e => imapSettingsForm.setData('imap_folder', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={imapSettingsForm.errors.imap_folder} className="mt-2" />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                                                            checked={imapSettingsForm.data.imap_enabled}
                                                            onChange={e => imapSettingsForm.setData('imap_enabled', e.target.checked)}
                                                        />
                                                        <span className="ml-2 text-sm text-gray-600">
                                                            Enable IMAP Processing
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end space-x-3">
                                                <SecondaryButton
                                                    type="button"
                                                    onClick={testImapConnection}
                                                    disabled={testingImapConnection || imapSettingsForm.processing}
                                                >
                                                    {testingImapConnection ? (
                                                        <>
                                                            <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                                                            Testing...
                                                        </>
                                                    ) : (
                                                        'Test Connection'
                                                    )}
                                                </SecondaryButton>
                                                <PrimaryButton disabled={imapSettingsForm.processing}>
                                                    {imapSettingsForm.processing ? 'Saving...' : 'Save Settings'}
                                                </PrimaryButton>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* Categories Panel */}
                                {selectedTab === 3 && (
                                    <div>
                                        <div className="flex items-center space-x-4 mb-6">
                                            <TagIcon className="h-8 w-8 text-emerald-600" />
                                            <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
                                        </div>
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
                                    </div>
                                )}
                            </div>
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