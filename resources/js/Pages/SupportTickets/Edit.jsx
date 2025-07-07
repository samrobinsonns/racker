import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function Edit({ ticket, priorities, categories, statuses, users, auth }) {
    const { data, setData, put, processing, errors } = useForm({
        subject: ticket.subject || '',
        description: ticket.description || '',
        priority_id: ticket.priority_id || '',
        category_id: ticket.category_id || '',
        status_id: ticket.status_id || '',
        assignee_id: ticket.assigned_to || '',
        tags: ticket.tags || []
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = {
            ...data,
            assigned_to: data.assignee_id
        };
        delete formData.assignee_id;
        put(route('support-tickets.update', ticket.id), formData);
    };

    const getPriorityColor = (level) => {
        const colors = {
            1: 'text-red-700 bg-red-50 ring-red-600/20',
            2: 'text-orange-700 bg-orange-50 ring-orange-600/20', 
            3: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20',
            4: 'text-green-700 bg-green-50 ring-green-600/20',
            5: 'text-gray-700 bg-gray-50 ring-gray-600/20',
        };
        return colors[level] || colors[3];
    };

    const getStatusColor = (slug) => {
        const colors = {
            new: 'text-blue-700 bg-blue-50 ring-blue-600/20',
            open: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20',
            'in-progress': 'text-purple-700 bg-purple-50 ring-purple-600/20',
            pending: 'text-orange-700 bg-orange-50 ring-orange-600/20',
            resolved: 'text-green-700 bg-green-50 ring-green-600/20',
            closed: 'text-gray-700 bg-gray-50 ring-gray-600/20',
        };
        return colors[slug] || colors['open'];
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center space-x-4">
                    <Link
                        href={route('support-tickets.show', ticket.id)}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-1" />
                        Back to Ticket
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Edit Ticket #{ticket.ticket_number}
                    </h2>
                </div>
            }
        >
            <Head title={`Edit Ticket #${ticket.ticket_number}`} />

            <div className="py-6">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                {/* Subject */}
                                <div className="sm:col-span-2">
                                    <InputLabel htmlFor="subject" value="Subject *" />
                                    <TextInput
                                        id="subject"
                                        type="text"
                                        name="subject"
                                        value={data.subject}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('subject', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.subject} className="mt-2" />
                                </div>

                                {/* Priority */}
                                <div>
                                    <InputLabel htmlFor="priority_id" value="Priority *" />
                                    <select
                                        id="priority_id"
                                        name="priority_id"
                                        value={data.priority_id}
                                        onChange={(e) => setData('priority_id', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        required
                                    >
                                        <option value="">Select Priority</option>
                                        {priorities.map(priority => (
                                            <option key={priority.id} value={priority.id}>
                                                {priority.name}
                                                {priority.response_time_hours && 
                                                    ` (${priority.response_time_hours}h response)`
                                                }
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.priority_id} className="mt-2" />
                                    
                                    {/* Priority Preview */}
                                    {data.priority_id && (
                                        <div className="mt-2">
                                            {(() => {
                                                const selectedPriority = priorities.find(p => p.id == data.priority_id);
                                                return selectedPriority && (
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${getPriorityColor(selectedPriority.level)}`}>
                                                        {selectedPriority.name}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>

                                {/* Category */}
                                <div>
                                    <InputLabel htmlFor="category_id" value="Category" />
                                    <select
                                        id="category_id"
                                        name="category_id"
                                        value={data.category_id}
                                        onChange={(e) => setData('category_id', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.category_id} className="mt-2" />
                                </div>

                                {/* Status */}
                                <div>
                                    <InputLabel htmlFor="status_id" value="Status *" />
                                    <select
                                        id="status_id"
                                        name="status_id"
                                        value={data.status_id}
                                        onChange={(e) => setData('status_id', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        required
                                    >
                                        {statuses.map(status => (
                                            <option key={status.id} value={status.id}>
                                                {status.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.status_id} className="mt-2" />
                                    
                                    {/* Status Preview */}
                                    {data.status_id && (
                                        <div className="mt-2">
                                            {(() => {
                                                const selectedStatus = statuses.find(s => s.id == data.status_id);
                                                return selectedStatus && (
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${getStatusColor(selectedStatus.slug)}`}>
                                                        {selectedStatus.name}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>

                                {/* Assignee */}
                                <div>
                                    <InputLabel htmlFor="assignee_id" value="Assignee" />
                                    <select
                                        id="assignee_id"
                                        name="assignee_id"
                                        value={data.assignee_id}
                                        onChange={(e) => setData('assignee_id', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    >
                                        <option value="">Unassigned</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} ({user.email})
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.assignee_id} className="mt-2" />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mt-6">
                                <InputLabel htmlFor="description" value="Description *" />
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={6}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    required
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>

                            {/* Ticket Metadata */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Information</h3>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Ticket Number</label>
                                        <p className="mt-1 text-sm text-gray-900">{ticket.ticket_number}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Created</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {new Date(ticket.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Requester</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {ticket.requester_name || ticket.requester?.name}
                                            {ticket.requester_email && (
                                                <span className="block text-xs text-gray-500">{ticket.requester_email}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end space-x-3">
                            <Link
                                href={route('support-tickets.show', ticket.id)}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancel
                            </Link>
                            <PrimaryButton type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Save Changes'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 