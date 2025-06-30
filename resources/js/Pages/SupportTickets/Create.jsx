import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import ContactSelector from '@/Components/ContactSelector';
import {
    ExclamationTriangleIcon,
    PaperClipIcon,
    XMarkIcon,
    DocumentIcon,
    PhotoIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function Create({ priorities, categories, statuses, users, auth }) {
    const [attachments, setAttachments] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        subject: '',
        description: '',
        priority_id: '',
        category_id: '',
        status_id: '',
        assignee_id: '',
        requester_email: '',
        requester_name: '',
        tags: [],
        attachments: [],
        contact_id: ''
    });

    const handleContactSelect = (contact) => {
        console.log('Contact selected:', contact);
        setSelectedContact(contact);
        const updatedData = {
            ...data,
            requester_email: contact.email,
            requester_name: `${contact.first_name} ${contact.last_name}`,
            contact_id: contact.id
        };
        setData(updatedData);
        console.log('Updated form data after contact selection:', updatedData);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Ensure contact data is properly set
        if (selectedContact) {
            setData(prevData => ({
                ...prevData,
                contact_id: selectedContact.id,
                requester_email: selectedContact.email,
                requester_name: `${selectedContact.first_name} ${selectedContact.last_name}`
            }));
        }
        
        const formData = new FormData();
        
        // Add all form fields
        Object.keys(data).forEach(key => {
            if (key === 'attachments') {
                attachments.forEach((file, index) => {
                    formData.append('attachments[]', file);
                });
            } else if (key === 'tags') {
                data[key].forEach((tag, index) => {
                    formData.append('tags[]', tag);
                });
            } else if (data[key] !== null && data[key] !== '') {
                // Ensure contact_id is properly set in form data
                if (key === 'contact_id' && selectedContact) {
                    formData.append(key, selectedContact.id);
                } else {
                    formData.append(key, data[key]);
                }
            }
        });

        // Double check contact data is in form data
        if (selectedContact && !formData.get('contact_id')) {
            formData.append('contact_id', selectedContact.id);
            formData.append('requester_email', selectedContact.email);
            formData.append('requester_name', `${selectedContact.first_name} ${selectedContact.last_name}`);
        }

        console.log('Form data before submission:', {
            subject: formData.get('subject'),
            priority_id: formData.get('priority_id'),
            category_id: formData.get('category_id'),
            status_id: formData.get('status_id'),
            assignee_id: formData.get('assignee_id'),
            requester_email: formData.get('requester_email'),
            requester_name: formData.get('requester_name'),
            contact_id: formData.get('contact_id'),
            description: formData.get('description')?.substring(0, 100) + '...' // Truncate for logging
        });

        post(route('support-tickets.store'), {
            data: formData,
            forceFormData: true,
            onSuccess: () => {
                console.log('Ticket created successfully with contact:', selectedContact);
                reset();
                setSelectedContact(null);
            },
            onError: (errors) => {
                console.error('Errors creating ticket:', errors);
            }
        });
    };

    const handleFileUpload = (files) => {
        const fileArray = Array.from(files);
        const validFiles = fileArray.filter(file => {
            const maxSize = 10 * 1024 * 1024; // 10MB
            const allowedTypes = [
                'image/jpeg', 'image/png', 'image/gif',
                'application/pdf', 'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain', 'text/csv'
            ];
            
            return file.size <= maxSize && allowedTypes.includes(file.type);
        });

        setAttachments(prev => [...prev, ...validFiles]);
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileType) => {
        if (fileType.startsWith('image/')) {
            return <PhotoIcon className="h-5 w-5 text-green-500" />;
        }
        return <DocumentIcon className="h-5 w-5 text-blue-500" />;
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

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center space-x-4">
                    <Link
                        href={route('support-tickets.index')}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-1" />
                        Back to Tickets
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Create Support Ticket
                    </h2>
                </div>
            }
        >
            <Head title="Create Support Ticket" />

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
                                        placeholder="Brief description of the issue"
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
                                    <InputLabel htmlFor="category_id" value="Category *" />
                                    <select
                                        id="category_id"
                                        name="category_id"
                                        value={data.category_id}
                                        onChange={(e) => setData('category_id', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        required
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

                                {/* Assignee */}
                                <div>
                                    <InputLabel htmlFor="assignee_id" value="Assign To" />
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

                                {/* Status */}
                                <div>
                                    <InputLabel htmlFor="status_id" value="Status" />
                                    <select
                                        id="status_id"
                                        name="status_id"
                                        value={data.status_id}
                                        onChange={(e) => setData('status_id', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    >
                                        <option value="">Default Status</option>
                                        {statuses.map(status => (
                                            <option key={status.id} value={status.id}>
                                                {status.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.status_id} className="mt-2" />
                                </div>
                            </div>

                            {/* External Requester Info */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Requester Information
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Search for an existing contact or fill in the details manually
                                </p>
                                
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    {/* Contact Selector */}
                                    <div className="sm:col-span-2">
                                        <InputLabel value="Search Contact" />
                                        <ContactSelector
                                            selectedContact={selectedContact}
                                            onSelect={handleContactSelect}
                                            className="mt-1"
                                        />
                                    </div>

                                    {/* Manual Input Fields */}
                                    <div>
                                        <InputLabel htmlFor="requester_name" value="Requester Name" />
                                        <TextInput
                                            id="requester_name"
                                            type="text"
                                            name="requester_name"
                                            value={data.requester_name}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('requester_name', e.target.value)}
                                            placeholder="Full name of person requesting support"
                                        />
                                        <InputError message={errors.requester_name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="requester_email" value="Requester Email" />
                                        <TextInput
                                            id="requester_email"
                                            type="email"
                                            name="requester_email"
                                            value={data.requester_email}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('requester_email', e.target.value)}
                                            placeholder="email@example.com"
                                        />
                                        <InputError message={errors.requester_email} className="mt-2" />
                                    </div>
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
                                    placeholder="Detailed description of the issue, including steps to reproduce, expected behavior, and any error messages..."
                                    required
                                />
                                <InputError message={errors.description} className="mt-2" />
                                <p className="mt-2 text-sm text-gray-500">
                                    Provide as much detail as possible to help us resolve your issue quickly.
                                </p>
                            </div>

                            {/* File Upload */}
                            <div className="mt-6">
                                <InputLabel value="Attachments" />
                                <div
                                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                                        dragActive 
                                            ? 'border-indigo-300 bg-indigo-50' 
                                            : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <div className="space-y-1 text-center">
                                        <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600">
                                            <label
                                                htmlFor="file-upload"
                                                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                                            >
                                                <span>Upload files</span>
                                                <input
                                                    id="file-upload"
                                                    name="file-upload"
                                                    type="file"
                                                    multiple
                                                    className="sr-only"
                                                    onChange={(e) => handleFileUpload(e.target.files)}
                                                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.csv"
                                                />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            PNG, JPG, PDF, DOC up to 10MB each
                                        </p>
                                    </div>
                                </div>
                                <InputError message={errors.attachments} className="mt-2" />

                                {/* File List */}
                                {attachments.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                                            Selected Files ({attachments.length})
                                        </h4>
                                        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                                            {attachments.map((file, index) => (
                                                <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                                    <div className="flex items-center flex-1 min-w-0">
                                                        <div className="flex-shrink-0">
                                                            {getFileIcon(file.type)}
                                                        </div>
                                                        <span className="ml-2 flex-1 min-w-0 truncate">
                                                            {file.name}
                                                        </span>
                                                        <span className="ml-2 flex-shrink-0 text-gray-500">
                                                            {formatFileSize(file.size)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAttachment(index)}
                                                        className="ml-4 flex-shrink-0 text-red-600 hover:text-red-800"
                                                    >
                                                        <XMarkIcon className="h-4 w-4" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end space-x-3">
                            <Link
                                href={route('support-tickets.index')}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancel
                            </Link>
                            <PrimaryButton 
                                type="submit" 
                                disabled={processing}
                                className="inline-flex items-center"
                            >
                                {processing ? 'Creating...' : 'Create Ticket'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 