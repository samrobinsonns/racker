import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { 
    Cog6ToothIcon,
    BellIcon,
    ClockIcon,
    EnvelopeIcon,
} from '@heroicons/react/24/outline';

export default function Settings({ settings }) {
    const { data, setData, put, processing, errors } = useForm({
        auto_assign_tickets: settings?.auto_assign_tickets ?? false,
        default_priority: settings?.default_priority ?? 'medium',
        notification_email: settings?.notification_email ?? '',
        response_time_limit: settings?.response_time_limit ?? 24,
        escalation_time: settings?.escalation_time ?? 48,
        allow_file_attachments: settings?.allow_file_attachments ?? true,
        max_file_size: settings?.max_file_size ?? 10,
        allowed_file_types: settings?.allowed_file_types ?? 'pdf,doc,docx,jpg,png',
        enable_customer_notifications: settings?.enable_customer_notifications ?? true,
        enable_agent_notifications: settings?.enable_agent_notifications ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('tenant-admin.support-tickets.settings.update'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-4">
                    <Cog6ToothIcon className="h-6 w-6 text-emerald-600" />
                    <h2 className="text-2xl font-bold leading-tight text-gray-900">
                        Support Ticket Settings
                    </h2>
                </div>
            }
        >
            <Head title="Support Ticket Settings" />

            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-12">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            General Settings
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Configure how support tickets work in your organization.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Ticket Assignment */}
                        <div className="bg-white rounded-lg">
                            <div className="flex items-center space-x-2">
                                <BellIcon className="h-5 w-5 text-emerald-600" />
                                <h4 className="text-sm font-medium text-gray-900">Ticket Assignment</h4>
                            </div>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                                            checked={data.auto_assign_tickets}
                                            onChange={(e) => setData('auto_assign_tickets', e.target.checked)}
                                        />
                                        <span className="ml-2 text-sm text-gray-600">
                                            Automatically assign new tickets to available agents
                                        </span>
                                    </label>
                                </div>

                                <div>
                                    <InputLabel htmlFor="default_priority" value="Default Priority" />
                                    <select
                                        id="default_priority"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                                        value={data.default_priority}
                                        onChange={(e) => setData('default_priority', e.target.value)}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Response Time Settings */}
                        <div className="bg-white rounded-lg">
                            <div className="flex items-center space-x-2">
                                <ClockIcon className="h-5 w-5 text-emerald-600" />
                                <h4 className="text-sm font-medium text-gray-900">Response Time Settings</h4>
                            </div>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <InputLabel htmlFor="response_time_limit" value="Response Time Limit (hours)" />
                                    <TextInput
                                        id="response_time_limit"
                                        type="number"
                                        className="mt-1 block w-full"
                                        value={data.response_time_limit}
                                        onChange={(e) => setData('response_time_limit', e.target.value)}
                                    />
                                    <InputError message={errors.response_time_limit} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="escalation_time" value="Escalation Time (hours)" />
                                    <TextInput
                                        id="escalation_time"
                                        type="number"
                                        className="mt-1 block w-full"
                                        value={data.escalation_time}
                                        onChange={(e) => setData('escalation_time', e.target.value)}
                                    />
                                    <InputError message={errors.escalation_time} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        {/* File Attachment Settings */}
                        <div className="bg-white rounded-lg">
                            <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-medium text-gray-900">File Attachment Settings</h4>
                            </div>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                                            checked={data.allow_file_attachments}
                                            onChange={(e) => setData('allow_file_attachments', e.target.checked)}
                                        />
                                        <span className="ml-2 text-sm text-gray-600">
                                            Allow file attachments
                                        </span>
                                    </label>
                                </div>

                                <div>
                                    <InputLabel htmlFor="max_file_size" value="Maximum File Size (MB)" />
                                    <TextInput
                                        id="max_file_size"
                                        type="number"
                                        className="mt-1 block w-full"
                                        value={data.max_file_size}
                                        onChange={(e) => setData('max_file_size', e.target.value)}
                                    />
                                    <InputError message={errors.max_file_size} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="allowed_file_types" value="Allowed File Types (comma-separated)" />
                                    <TextInput
                                        id="allowed_file_types"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={data.allowed_file_types}
                                        onChange={(e) => setData('allowed_file_types', e.target.value)}
                                    />
                                    <InputError message={errors.allowed_file_types} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        {/* Notification Settings */}
                        <div className="bg-white rounded-lg">
                            <div className="flex items-center space-x-2">
                                <EnvelopeIcon className="h-5 w-5 text-emerald-600" />
                                <h4 className="text-sm font-medium text-gray-900">Notification Settings</h4>
                            </div>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <InputLabel htmlFor="notification_email" value="Notification Email" />
                                    <TextInput
                                        id="notification_email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        value={data.notification_email}
                                        onChange={(e) => setData('notification_email', e.target.value)}
                                    />
                                    <InputError message={errors.notification_email} className="mt-2" />
                                </div>

                                <div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                                            checked={data.enable_customer_notifications}
                                            onChange={(e) => setData('enable_customer_notifications', e.target.checked)}
                                        />
                                        <span className="ml-2 text-sm text-gray-600">
                                            Enable customer notifications
                                        </span>
                                    </label>
                                </div>

                                <div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                                            checked={data.enable_agent_notifications}
                                            onChange={(e) => setData('enable_agent_notifications', e.target.checked)}
                                        />
                                        <span className="ml-2 text-sm text-gray-600">
                                            Enable agent notifications
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Saving...' : 'Save Changes'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 