import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import TenantAdminLayout from '@/Layouts/TenantAdminLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Checkbox from '@/Components/Checkbox';
import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';

export default function Index({ settings, permissions }) {
    const { data, setData, patch, processing, errors } = useForm({
        auto_assign_tickets: settings.auto_assign_tickets || false,
        notify_admins_on_new_ticket: settings.notify_admins_on_new_ticket || false,
        notify_assignee_on_update: settings.notify_assignee_on_update || false,
        allow_file_attachments: settings.allow_file_attachments || false,
        max_attachment_size: settings.max_attachment_size || 10,
        allowed_file_types: settings.allowed_file_types || [],
        default_priority: settings.default_priority || 'medium',
        auto_close_resolved_after_days: settings.auto_close_resolved_after_days || 7,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('tenant-admin.support-tickets.settings'));
    };

    return (
        <TenantAdminLayout>
            <Head title="Support Ticket Settings" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h2 className="text-lg font-medium text-gray-900">
                                Support Ticket Settings
                            </h2>

                            <p className="mt-1 text-sm text-gray-600">
                                Configure how support tickets work in your organization.
                            </p>

                            <form onSubmit={submit} className="mt-6 space-y-6">
                                {/* Ticket Assignment */}
                                <div>
                                    <div className="flex items-start">
                                        <div className="flex items-center h-5">
                                            <Checkbox
                                                name="auto_assign_tickets"
                                                checked={data.auto_assign_tickets}
                                                onChange={e => setData('auto_assign_tickets', e.target.checked)}
                                            />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <InputLabel value="Automatically assign tickets" />
                                            <p className="text-gray-500">Enable automatic ticket assignment based on workload and availability.</p>
                                        </div>
                                    </div>
                                    <InputError message={errors.auto_assign_tickets} className="mt-2" />
                                </div>

                                {/* Notifications */}
                                <div>
                                    <div className="flex items-start">
                                        <div className="flex items-center h-5">
                                            <Checkbox
                                                name="notify_admins_on_new_ticket"
                                                checked={data.notify_admins_on_new_ticket}
                                                onChange={e => setData('notify_admins_on_new_ticket', e.target.checked)}
                                            />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <InputLabel value="Notify admins on new tickets" />
                                            <p className="text-gray-500">Send notifications to admins when new tickets are created.</p>
                                        </div>
                                    </div>
                                    <InputError message={errors.notify_admins_on_new_ticket} className="mt-2" />
                                </div>

                                <div>
                                    <div className="flex items-start">
                                        <div className="flex items-center h-5">
                                            <Checkbox
                                                name="notify_assignee_on_update"
                                                checked={data.notify_assignee_on_update}
                                                onChange={e => setData('notify_assignee_on_update', e.target.checked)}
                                            />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <InputLabel value="Notify assignee on updates" />
                                            <p className="text-gray-500">Send notifications to assignees when tickets are updated.</p>
                                        </div>
                                    </div>
                                    <InputError message={errors.notify_assignee_on_update} className="mt-2" />
                                </div>

                                {/* File Attachments */}
                                <div>
                                    <div className="flex items-start">
                                        <div className="flex items-center h-5">
                                            <Checkbox
                                                name="allow_file_attachments"
                                                checked={data.allow_file_attachments}
                                                onChange={e => setData('allow_file_attachments', e.target.checked)}
                                            />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <InputLabel value="Allow file attachments" />
                                            <p className="text-gray-500">Enable file attachments on tickets and replies.</p>
                                        </div>
                                    </div>
                                    <InputError message={errors.allow_file_attachments} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="max_attachment_size" value="Maximum attachment size (MB)" />
                                    <TextInput
                                        id="max_attachment_size"
                                        type="number"
                                        className="mt-1 block w-full"
                                        value={data.max_attachment_size}
                                        onChange={e => setData('max_attachment_size', e.target.value)}
                                    />
                                    <InputError message={errors.max_attachment_size} className="mt-2" />
                                </div>

                                {/* Default Priority */}
                                <div>
                                    <InputLabel htmlFor="default_priority" value="Default ticket priority" />
                                    <select
                                        id="default_priority"
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        value={data.default_priority}
                                        onChange={e => setData('default_priority', e.target.value)}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                    <InputError message={errors.default_priority} className="mt-2" />
                                </div>

                                {/* Auto-close Settings */}
                                <div>
                                    <InputLabel htmlFor="auto_close_resolved_after_days" value="Auto-close resolved tickets after (days)" />
                                    <TextInput
                                        id="auto_close_resolved_after_days"
                                        type="number"
                                        className="mt-1 block w-full"
                                        value={data.auto_close_resolved_after_days}
                                        onChange={e => setData('auto_close_resolved_after_days', e.target.value)}
                                    />
                                    <InputError message={errors.auto_close_resolved_after_days} className="mt-2" />
                                </div>

                                {permissions.update && (
                                    <div className="flex items-center gap-4">
                                        <PrimaryButton disabled={processing}>Save Settings</PrimaryButton>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </TenantAdminLayout>
    );
} 