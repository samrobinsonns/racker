import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import ContactSearch from '@/Components/ContactSearch';
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
    const { contact_id, contact_name, contact_email, contact_phone, contact_company } = usePage().props;
    
    // Mention functionality state
    const [mentionSuggestions, setMentionSuggestions] = useState([]);
    const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false);
    const [mentionSearchTerm, setMentionSearchTerm] = useState('');
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
    const [mentionCursorPosition, setMentionCursorPosition] = useState({ start: 0, end: 0 });
    const descriptionRef = useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        subject: '',
        description: '',
        priority_id: '',
        category_id: '',
        status_id: '',
        assignee_id: '',
        requester_email: contact_email || '',
        requester_name: contact_name || '',
        tags: [],
        attachments: [],
        contact_id: contact_id || ''
    });

    // Handle contact parameters from URL
    useEffect(() => {
        if (contact_id) {
            // Create a properly formatted contact object
            const contactData = {
                id: contact_id,
                display_name: contact_name, // Add display_name for the search component
                name: contact_name, // Keep name for backwards compatibility
                email: contact_email,
                phone: contact_phone,
                company: contact_company,
                // Add first_name and last_name if needed by other components
                first_name: contact_name?.split(' ')?.[0] || '',
                last_name: contact_name?.split(' ')?.[1] || ''
            };
            
            setSelectedContact(contactData);
            
            setData(prev => ({
                ...prev,
                contact_id: contact_id,
                requester_name: contact_name,
                requester_email: contact_email
            }));
        }
    }, [contact_id, contact_name, contact_email, contact_phone, contact_company]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
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
                formData.append(key, data[key]);
            }
        });

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
                reset();
                setSelectedContact(null);
                setAttachments([]);
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

    const handleContactSelect = (contact) => {
        setSelectedContact(contact);
        if (contact) {
            setData({
                ...data,
                contact_id: contact.id,
                requester_email: contact.email,
                requester_name: contact.display_name
            });
        }
    };

    const handleContactClear = () => {
        setSelectedContact(null);
        setData({
            ...data,
            contact_id: '',
            requester_email: '',
            requester_name: ''
        });
    };

    // Mention functionality
    const searchMentions = async (searchTerm) => {
        if (!searchTerm || searchTerm.length < 1) {
            setMentionSuggestions([]);
            setShowMentionAutocomplete(false);
            return;
        }

        try {
            const response = await fetch(route('mentions.search-users', { search: searchTerm }));
            if (response.ok) {
                const data = await response.json();
                setMentionSuggestions(data.users);
                setShowMentionAutocomplete(data.users.length > 0);
                setSelectedMentionIndex(0);
            }
        } catch (error) {
            console.error('Error searching mentions:', error);
        }
    };

    const handleMentionSelect = (user) => {
        const textarea = descriptionRef.current;
        if (!textarea) return;

        const beforeMention = data.description.substring(0, mentionCursorPosition.start);
        const afterMention = data.description.substring(mentionCursorPosition.end);
        const newContent = beforeMention + `@${user.name} ` + afterMention;

        setData('description', newContent);
        setShowMentionAutocomplete(false);
        setMentionSuggestions([]);
        setMentionSearchTerm('');

        // Focus back to textarea and set cursor position after the mention
        setTimeout(() => {
            textarea.focus();
            const newPosition = mentionCursorPosition.start + user.name.length + 2; // +2 for @ and space
            textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
    };

    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        setData('description', value);

        // Check for @ mentions
        const cursorPosition = e.target.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPosition);
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

        if (mentionMatch) {
            const searchTerm = mentionMatch[1];
            setMentionSearchTerm(searchTerm);
            setMentionCursorPosition({
                start: cursorPosition - searchTerm.length - 1, // -1 for @
                end: cursorPosition
            });
            searchMentions(searchTerm);
        } else {
            setShowMentionAutocomplete(false);
            setMentionSuggestions([]);
        }
    };

    const handleDescriptionKeyDown = (e) => {
        if (showMentionAutocomplete) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedMentionIndex(prev => 
                    prev < mentionSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedMentionIndex(prev => 
                    prev > 0 ? prev - 1 : mentionSuggestions.length - 1
                );
            } else if (e.key === 'Enter' && mentionSuggestions.length > 0) {
                e.preventDefault();
                handleMentionSelect(mentionSuggestions[selectedMentionIndex]);
            } else if (e.key === 'Escape') {
                setShowMentionAutocomplete(false);
                setMentionSuggestions([]);
            }
        }
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

                            {/* Contact Selection Section */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Requester Information
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Search for an existing contact or fill in the details manually
                                </p>
                                
                                <div className="space-y-6">
                                    {/* Contact Search */}
                                    <div>
                                        <InputLabel value="Search Contact" />
                                        <ContactSearch
                                            selectedContact={selectedContact}
                                            onSelect={handleContactSelect}
                                            onClear={handleContactClear}
                                            className="mt-1"
                                            error={errors.contact_id}
                                        />
                                        <p className="mt-2 text-sm text-gray-500">
                                            Search by name or email to find existing contacts
                                        </p>
                                    </div>

                                    {/* Manual Input Fields - shown only if no contact is selected */}
                                    {!selectedContact && (
                                        <>
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
                                        </>
                                    )}

                                    {/* Selected Contact Preview */}
                                    {selectedContact && (
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-900">
                                                        Selected Contact
                                                    </h4>
                                                    <div className="mt-1 text-sm text-gray-600">
                                                        <p>{selectedContact.display_name}</p>
                                                        <p>{selectedContact.email}</p>
                                                        {selectedContact.company && (
                                                            <p className="text-gray-500">{selectedContact.company}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mt-6">
                                <InputLabel htmlFor="description" value="Description *" />
                                <div className="relative">
                                    <textarea
                                        ref={descriptionRef}
                                        id="description"
                                        name="description"
                                        rows={6}
                                        value={data.description}
                                        onChange={handleDescriptionChange}
                                        onKeyDown={handleDescriptionKeyDown}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        placeholder="Detailed description of the issue, including steps to reproduce, expected behavior, and any error messages... (Use @ to mention users)"
                                        required
                                    />
                                    
                                    {/* Mention Autocomplete */}
                                    {showMentionAutocomplete && mentionSuggestions.length > 0 && (
                                        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {mentionSuggestions.map((user, index) => (
                                                <div
                                                    key={user.id}
                                                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                                                        index === selectedMentionIndex ? 'bg-gray-100' : ''
                                                    }`}
                                                    onClick={() => handleMentionSelect(user)}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div className="flex-shrink-0">
                                                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                                                <span className="text-sm font-medium text-gray-700">
                                                                    {user.name.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {user.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <InputError message={errors.description} className="mt-2" />
                                <p className="mt-2 text-sm text-gray-500">
                                    Provide as much detail as possible to help us resolve your issue quickly. Use @ to mention team members.
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