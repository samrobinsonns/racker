import React, { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';
import { useForm } from '@inertiajs/react';
import { 
    PencilIcon, 
    TrashIcon, 
    PlusIcon,
    MagnifyingGlassIcon,
    TagIcon,
    FolderIcon
} from '@heroicons/react/24/outline';

export default function CannedResponseModal({ show, onClose }) {
    const [activeTab, setActiveTab] = useState('list'); // 'list', 'create', 'edit'
    const [cannedResponses, setCannedResponses] = useState([]);
    const [filteredResponses, setFilteredResponses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [categories, setCategories] = useState([]);
    const [editingResponse, setEditingResponse] = useState(null);
    const [loading, setLoading] = useState(false);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        content: '',
        category: 'general',
        tags: [],
        is_active: true
    });

    // Load canned responses when modal opens
    useEffect(() => {
        if (show) {
            loadCannedResponses();
        }
    }, [show]);

    // Filter responses based on search and category
    useEffect(() => {
        let filtered = cannedResponses;

        if (searchTerm) {
            filtered = filtered.filter(response => 
                response.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                response.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                response.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(response => response.category === selectedCategory);
        }

        setFilteredResponses(filtered);
    }, [cannedResponses, searchTerm, selectedCategory]);

    const loadCannedResponses = async () => {
        try {
            setLoading(true);
            const url = new URL(route('canned-responses.search'));
            url.searchParams.append('search', '');
            url.searchParams.append('limit', '100');
            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setCannedResponses(data.responses);
                
                // Extract unique categories
                const uniqueCategories = [...new Set(data.responses.map(r => r.category))];
                setCategories(uniqueCategories);
            } else {
                console.error('Failed to load canned responses:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error loading canned responses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch(route('canned-responses.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                reset();
                setActiveTab('list');
                loadCannedResponses();
            } else {
                const errorData = await response.json();
                console.error('Failed to create canned response:', errorData);
            }
        } catch (error) {
            console.error('Error creating canned response:', error);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch(route('canned-responses.update', editingResponse.id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                reset();
                setActiveTab('list');
                setEditingResponse(null);
                loadCannedResponses();
            } else {
                const errorData = await response.json();
                console.error('Failed to update canned response:', errorData);
            }
        } catch (error) {
            console.error('Error updating canned response:', error);
        }
    };

    const handleDelete = async (response) => {
        if (confirm(`Are you sure you want to delete "${response.name}"?`)) {
            try {
                const result = await fetch(route('canned-responses.destroy', response.id), {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    }
                });

                if (result.ok) {
                    loadCannedResponses();
                } else {
                    const errorData = await result.json();
                    console.error('Failed to delete canned response:', errorData);
                }
            } catch (error) {
                console.error('Error deleting canned response:', error);
            }
        }
    };

    const startEdit = (response) => {
        setEditingResponse(response);
        setData({
            name: response.name,
            content: response.content,
            category: response.category,
            tags: response.tags || [],
            is_active: response.is_active
        });
        setActiveTab('edit');
    };

    const handleClose = () => {
        reset();
        setActiveTab('list');
        setEditingResponse(null);
        setSearchTerm('');
        setSelectedCategory('all');
        onClose();
    };

    const addTag = (tagValue) => {
        if (tagValue && !data.tags.includes(tagValue)) {
            setData('tags', [...data.tags, tagValue]);
        }
    };

    const removeTag = (tagToRemove) => {
        setData('tags', data.tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="2xl">
            <div className="bg-white">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                            Canned Responses
                        </h3>
                        <div className="flex items-center space-x-2">
                            {activeTab === 'list' && (
                                <PrimaryButton
                                    type="button"
                                    onClick={() => {
                                        reset();
                                        setActiveTab('create');
                                    }}
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    New Response
                                </PrimaryButton>
                            )}
                        </div>
                    </div>
                    
                    {/* Tabs */}
                    <div className="mt-4">
                        <nav className="flex space-x-8">
                            <button
                                onClick={() => setActiveTab('list')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'list'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                All Responses
                            </button>
                            {activeTab === 'create' && (
                                <button className="py-2 px-1 border-b-2 border-indigo-500 text-indigo-600 font-medium text-sm">
                                    Create New
                                </button>
                            )}
                            {activeTab === 'edit' && (
                                <button className="py-2 px-1 border-b-2 border-indigo-500 text-indigo-600 font-medium text-sm">
                                    Edit Response
                                </button>
                            )}
                        </nav>
                    </div>
                </div>

                <div className="px-6 py-4">
                    {/* List View */}
                    {activeTab === 'list' && (
                        <div className="space-y-4">
                            {/* Search and Filter */}
                            <div className="flex items-center space-x-4">
                                <div className="flex-1 relative">
                                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search responses..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div className="relative">
                                    <FolderIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map((category) => (
                                            <option key={category} value={category}>
                                                {category.charAt(0).toUpperCase() + category.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Responses List */}
                            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
                                {loading ? (
                                    <div className="p-4 text-center text-gray-500">Loading...</div>
                                ) : filteredResponses.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                        {searchTerm || selectedCategory !== 'all' 
                                            ? 'No responses match your criteria'
                                            : 'No canned responses found'
                                        }
                                    </div>
                                ) : (
                                    filteredResponses.map((response) => (
                                        <div key={response.id} className="p-4 hover:bg-gray-50">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                                            {response.name}
                                                        </h4>
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                            {response.category}
                                                        </span>
                                                        {response.usage_count > 0 && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                Used {response.usage_count} times
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                                        {response.content}
                                                    </p>
                                                    {response.tags && response.tags.length > 0 && (
                                                        <div className="mt-2 flex items-center space-x-1">
                                                            <TagIcon className="h-3 w-3 text-gray-400" />
                                                            <div className="flex flex-wrap gap-1">
                                                                {response.tags.map((tag, index) => (
                                                                    <span
                                                                        key={index}
                                                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs text-gray-600 bg-gray-100"
                                                                    >
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4 flex items-center space-x-2 flex-shrink-0">
                                                    <button
                                                        onClick={() => startEdit(response)}
                                                        className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                                        title="Edit response"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(response)}
                                                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                        title="Delete response"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Create/Edit Form */}
                    {(activeTab === 'create' || activeTab === 'edit') && (
                        <form onSubmit={activeTab === 'create' ? handleCreate : handleUpdate} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Response Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter a descriptive name"
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div>
                                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                                    Response Content
                                </label>
                                <textarea
                                    id="content"
                                    rows={6}
                                    value={data.content}
                                    onChange={(e) => setData('content', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter your response template. Use {customer_name}, {agent_name}, {ticket_number} for dynamic content."
                                    required
                                />
                                <InputError message={errors.content} />
                                <p className="mt-1 text-xs text-gray-500">
                                    Available placeholders: {'{customer_name}'}, {'{agent_name}'}, {'{ticket_number}'}, {'{date}'}, {'{time}'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                                        Category
                                    </label>
                                    <select
                                        id="category"
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="general">General</option>
                                        <option value="greetings">Greetings</option>
                                        <option value="resolution">Resolution</option>
                                        <option value="information">Information</option>
                                        <option value="follow-up">Follow-up</option>
                                        <option value="escalation">Escalation</option>
                                        <option value="account">Account</option>
                                        <option value="billing">Billing</option>
                                        <option value="technical">Technical</option>
                                        <option value="closing">Closing</option>
                                    </select>
                                    <InputError message={errors.category} />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Status
                                    </label>
                                    <div className="mt-1">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={data.is_active}
                                                onChange={(e) => setData('is_active', e.target.checked)}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span className="ml-2 text-sm text-gray-600">Active</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Tags
                                </label>
                                <div className="mt-1">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {data.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTag(tag)}
                                                    className="ml-1 text-indigo-600 hover:text-indigo-500"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Add tags (press Enter)"
                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addTag(e.target.value.trim());
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <SecondaryButton
                                    type="button"
                                    onClick={() => setActiveTab('list')}
                                >
                                    Cancel
                                </SecondaryButton>
                                <PrimaryButton type="submit" disabled={processing}>
                                    {processing 
                                        ? (activeTab === 'create' ? 'Creating...' : 'Updating...') 
                                        : (activeTab === 'create' ? 'Create Response' : 'Update Response')
                                    }
                                </PrimaryButton>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </Modal>
    );
} 