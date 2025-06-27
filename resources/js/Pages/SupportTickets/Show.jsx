import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';
import {
    ArrowLeftIcon,
    PaperClipIcon,
    EllipsisVerticalIcon,
    ChatBubbleLeftIcon,
    ClockIcon,
    UserIcon,
    TagIcon,
    ExclamationTriangleIcon,
    ArrowTrendingUpIcon,
    CheckCircleIcon,
    XCircleIcon,
    PencilIcon,
    DocumentArrowDownIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function Show({ 
    ticket, 
    replies, 
    attachments, 
    priorities, 
    categories, 
    statuses, 
    users, 
    permissions,
    auth 
}) {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyType, setReplyType] = useState('public'); // 'public' or 'internal'
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);

    const { data: replyData, setData: setReplyData, post: postReply, processing: replyProcessing, errors: replyErrors, reset: resetReply } = useForm({
        content: '',
        is_internal: false,
        attachments: []
    });

    const { data: statusData, setData: setStatusData, post: postStatus, processing: statusProcessing, errors: statusErrors } = useForm({
        status_id: ticket.status_id,
        reason: ''
    });

    const { data: assignData, setData: setAssignData, post: postAssign, processing: assignProcessing, errors: assignErrors } = useForm({
        assignee_id: ticket.assignee_id || ''
    });

    const handleReplySubmit = (e) => {
        e.preventDefault();
        postReply(route('support-tickets.replies.store', ticket.id), {
            onSuccess: () => {
                resetReply();
                setShowReplyForm(false);
            }
        });
    };

    const handleStatusChange = (e) => {
        e.preventDefault();
        postStatus(route('support-tickets.change-status', ticket.id), {
            onSuccess: () => setShowStatusModal(false)
        });
    };

    const handleAssignChange = (e) => {
        e.preventDefault();
        postAssign(route('support-tickets.assign', ticket.id), {
            onSuccess: () => setShowAssignModal(false)
        });
    };

    const escalateTicket = () => {
        const reason = prompt('Please provide a reason for escalation:');
        if (reason) {
            router.post(route('support-tickets.escalate', ticket.id), { reason });
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            1: 'text-red-700 bg-red-50 ring-red-600/20',
            2: 'text-orange-700 bg-orange-50 ring-orange-600/20',
            3: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20',
            4: 'text-green-700 bg-green-50 ring-green-600/20',
            5: 'text-gray-700 bg-gray-50 ring-gray-600/20',
        };
        return colors[priority.level] || colors[3];
    };

    const getStatusColor = (status) => {
        const colors = {
            new: 'text-blue-700 bg-blue-50 ring-blue-600/20',
            open: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20',
            'in-progress': 'text-purple-700 bg-purple-50 ring-purple-600/20',
            pending: 'text-orange-700 bg-orange-50 ring-orange-600/20',
            resolved: 'text-green-700 bg-green-50 ring-green-600/20',
            closed: 'text-gray-700 bg-gray-50 ring-gray-600/20',
        };
        return colors[status.slug] || colors['open'];
    };

    const formatDateTime = (date) => {
        return new Date(date).toLocaleString();
    };

    const formatTimeAgo = (date) => {
        const now = new Date();
        const created = new Date(date);
        const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return created.toLocaleDateString();
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href={route('support-tickets.index')}
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeftIcon className="h-4 w-4 mr-1" />
                            Back to Tickets
                        </Link>
                        <div>
                            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                                #{ticket.ticket_number}
                            </h2>
                            <p className="text-sm text-gray-600">{ticket.subject}</p>
                        </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center space-x-3">
                        {permissions.update && (
                            <Link
                                href={route('support-tickets.edit', ticket.id)}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <PencilIcon className="h-4 w-4 mr-2" />
                                Edit
                            </Link>
                        )}

                        <Menu as="div" className="relative inline-block text-left">
                            <Menu.Button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Actions
                                <EllipsisVerticalIcon className="h-4 w-4 ml-2" />
                            </Menu.Button>

                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="py-1">
                                        {permissions.assign && (
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        onClick={() => setShowAssignModal(true)}
                                                        className={`${
                                                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                                        } group flex items-center px-4 py-2 text-sm w-full text-left`}
                                                    >
                                                        <UserIcon className="mr-3 h-4 w-4" />
                                                        Assign/Reassign
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        )}
                                        
                                        {permissions.update && (
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        onClick={() => setShowStatusModal(true)}
                                                        className={`${
                                                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                                        } group flex items-center px-4 py-2 text-sm w-full text-left`}
                                                    >
                                                        <TagIcon className="mr-3 h-4 w-4" />
                                                        Change Status
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        )}

                                        {permissions.manage && !ticket.is_escalated && (
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        onClick={escalateTicket}
                                                        className={`${
                                                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                                        } group flex items-center px-4 py-2 text-sm w-full text-left`}
                                                    >
                                                        <ArrowTrendingUpIcon className="mr-3 h-4 w-4" />
                                                        Escalate Ticket
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        )}
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    </div>
                </div>
            }
        >
            <Head title={`Ticket #${ticket.ticket_number}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Ticket Header */}
                            <div className="bg-white shadow rounded-lg p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                            {ticket.subject}
                                        </h1>
                                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                                            <span>Created {formatTimeAgo(ticket.created_at)}</span>
                                            <span>•</span>
                                            <span>By {ticket.requester_name || ticket.requester?.name}</span>
                                            {ticket.requester_email && (
                                                <>
                                                    <span>•</span>
                                                    <span>{ticket.requester_email}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {ticket.is_escalated && (
                                            <ArrowTrendingUpIcon className="h-5 w-5 text-red-500" title="Escalated" />
                                        )}
                                        {ticket.is_overdue && (
                                            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" title="Overdue" />
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="mt-6">
                                    <div className="prose max-w-none">
                                        <p className="whitespace-pre-wrap">{ticket.description}</p>
                                    </div>
                                </div>

                                {/* Initial Attachments */}
                                {attachments.filter(att => !att.reply_id).length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="text-sm font-medium text-gray-900 mb-3">Attachments</h3>
                                        <div className="space-y-2">
                                            {attachments.filter(att => !att.reply_id).map((attachment) => (
                                                <div key={attachment.id} className="flex items-center p-2 border border-gray-200 rounded-md">
                                                    <PaperClipIcon className="h-4 w-4 text-gray-400 mr-2" />
                                                    <span className="text-sm text-gray-900 flex-1">{attachment.original_filename}</span>
                                                    <a
                                                        href={route('support-tickets.attachments.download', attachment.id)}
                                                        className="text-sm text-indigo-600 hover:text-indigo-500 ml-2"
                                                    >
                                                        <DocumentArrowDownIcon className="h-4 w-4" />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Replies */}
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Communication ({replies.length})
                                    </h3>
                                </div>

                                <div className="divide-y divide-gray-200">
                                    {replies.map((reply) => (
                                        <div key={reply.id} className={`p-6 ${reply.is_internal ? 'bg-yellow-50' : ''}`}>
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0">
                                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {reply.author_name?.charAt(0) || '?'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {reply.author_name}
                                                            </span>
                                                            {reply.is_internal && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                    <EyeSlashIcon className="h-3 w-3 mr-1" />
                                                                    Internal Note
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-gray-500">
                                                                {formatDateTime(reply.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 prose max-w-none">
                                                        <p className="whitespace-pre-wrap text-sm text-gray-700">
                                                            {reply.content}
                                                        </p>
                                                    </div>

                                                    {/* Reply Attachments */}
                                                    {attachments.filter(att => att.reply_id === reply.id).length > 0 && (
                                                        <div className="mt-3">
                                                            <div className="flex flex-wrap gap-2">
                                                                {attachments.filter(att => att.reply_id === reply.id).map((attachment) => (
                                                                    <a
                                                                        key={attachment.id}
                                                                        href={route('support-tickets.attachments.download', attachment.id)}
                                                                        className="inline-flex items-center px-2 py-1 border border-gray-200 rounded text-xs text-gray-700 hover:bg-gray-50"
                                                                    >
                                                                        <PaperClipIcon className="h-3 w-3 mr-1" />
                                                                        {attachment.original_filename}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Reply Form */}
                                {permissions.reply && (
                                    <div className="p-6 border-t border-gray-200">
                                        {!showReplyForm ? (
                                            <div className="flex space-x-3">
                                                <PrimaryButton
                                                    onClick={() => {
                                                        setReplyType('public');
                                                        setReplyData('is_internal', false);
                                                        setShowReplyForm(true);
                                                    }}
                                                >
                                                    <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
                                                    Reply to Customer
                                                </PrimaryButton>
                                                {permissions.manage && (
                                                    <SecondaryButton
                                                        onClick={() => {
                                                            setReplyType('internal');
                                                            setReplyData('is_internal', true);
                                                            setShowReplyForm(true);
                                                        }}
                                                    >
                                                        <EyeSlashIcon className="h-4 w-4 mr-2" />
                                                        Add Internal Note
                                                    </SecondaryButton>
                                                )}
                                            </div>
                                        ) : (
                                            <form onSubmit={handleReplySubmit} className="space-y-4">
                                                <div className="flex items-center space-x-2 text-sm">
                                                    <span className="font-medium">
                                                        {replyType === 'internal' ? 'Internal Note' : 'Public Reply'}
                                                    </span>
                                                    {replyType === 'internal' && (
                                                        <span className="text-yellow-600">(Not visible to customer)</span>
                                                    )}
                                                </div>
                                                
                                                <textarea
                                                    value={replyData.content}
                                                    onChange={(e) => setReplyData('content', e.target.value)}
                                                    rows={4}
                                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder={replyType === 'internal' ? 'Add an internal note...' : 'Type your reply...'}
                                                    required
                                                />
                                                <InputError message={replyErrors.content} />

                                                <div className="flex items-center space-x-3">
                                                    <PrimaryButton type="submit" disabled={replyProcessing}>
                                                        {replyProcessing ? 'Sending...' : (replyType === 'internal' ? 'Add Note' : 'Send Reply')}
                                                    </PrimaryButton>
                                                    <SecondaryButton
                                                        type="button"
                                                        onClick={() => {
                                                            setShowReplyForm(false);
                                                            resetReply();
                                                        }}
                                                    >
                                                        Cancel
                                                    </SecondaryButton>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Ticket Details */}
                            <div className="bg-white shadow rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Details</h3>
                                
                                <dl className="space-y-3">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                                        <dd className="mt-1">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${getStatusColor(ticket.status)}`}>
                                                {ticket.status.name}
                                            </span>
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Priority</dt>
                                        <dd className="mt-1">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${getPriorityColor(ticket.priority)}`}>
                                                {ticket.priority.name}
                                            </span>
                                        </dd>
                                    </div>

                                    {ticket.category && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Category</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{ticket.category.name}</dd>
                                        </div>
                                    )}

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Assignee</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {ticket.assignee ? ticket.assignee.name : 'Unassigned'}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Created</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{formatDateTime(ticket.created_at)}</dd>
                                    </div>

                                    {ticket.first_response_at && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">First Response</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{formatDateTime(ticket.first_response_at)}</dd>
                                        </div>
                                    )}

                                    {ticket.resolved_at && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Resolved</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{formatDateTime(ticket.resolved_at)}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            {/* Activity Log */}
                            {ticket.activity_logs && ticket.activity_logs.length > 0 && (
                                <div className="bg-white shadow rounded-lg p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Activity</h3>
                                    <div className="flow-root">
                                        <ul className="-mb-8">
                                            {ticket.activity_logs.slice(0, 5).map((log, index) => (
                                                <li key={log.id}>
                                                    <div className="relative pb-8">
                                                        {index !== ticket.activity_logs.slice(0, 5).length - 1 && (
                                                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                                                        )}
                                                        <div className="relative flex items-start space-x-3">
                                                            <div className="relative">
                                                                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center ring-8 ring-white">
                                                                    <ClockIcon className="h-4 w-4 text-gray-500" />
                                                                </div>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div>
                                                                    <div className="text-sm">
                                                                        <span className="font-medium text-gray-900">
                                                                            {log.user?.name || 'System'}
                                                                        </span>
                                                                    </div>
                                                                    <p className="mt-0.5 text-sm text-gray-500">
                                                                        {formatTimeAgo(log.created_at)}
                                                                    </p>
                                                                </div>
                                                                <div className="mt-2 text-sm text-gray-700">
                                                                    {log.description}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 