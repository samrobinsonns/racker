import React from 'react';
import { useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import Modal from '@/Components/Modal';

export default function EditTicketModal({ show, onClose, ticket, priorities, categories, statuses, users }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        subject: ticket.subject || '',
        description: ticket.description || '',
        priority_id: ticket.priority_id || '',
        category_id: ticket.category_id || '',
        status_id: ticket.status_id || '',
        assignee_id: ticket.assignee_id || '',
        tags: ticket.tags || []
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('support-tickets.update', ticket.id), {
            onSuccess: () => {
                onClose();
                reset();
            },
            preserveScroll: true
        });
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
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">
                            Edit Ticket #{ticket.ticket_number}
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Update the ticket details below.
                        </p>
                    </div>

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
                    <div>
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

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3">
                        <SecondaryButton onClick={onClose}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </PrimaryButton>
                    </div>
                </div>
            </form>
        </Modal>
    );
} 