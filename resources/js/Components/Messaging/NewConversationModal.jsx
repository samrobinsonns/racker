import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import PrimaryButton from '../PrimaryButton';
import SecondaryButton from '../SecondaryButton';
import TextInput from '../TextInput';
import InputLabel from '../InputLabel';
import InputError from '../InputError';
import { UserPlusIcon, UserGroupIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function NewConversationModal({ show, onClose, onCreateConversation, tenantId }) {
    const [conversationType, setConversationType] = useState('direct');
    const [conversationName, setConversationName] = useState('');
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (show) {
            fetchAvailableUsers();
            // Reset form
            setConversationType('direct');
            setConversationName('');
            setDescription('');
            setIsPrivate(false);
            setSelectedUsers([]);
            setUserSearchQuery('');
            setErrors({});
        }
    }, [show]);

    const fetchAvailableUsers = async () => {
        try {
            const params = tenantId ? `?tenant_id=${tenantId}` : '';
            const response = await fetch(`/api/users${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setAvailableUsers(data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleUserSelect = (user) => {
        if (!selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers([...selectedUsers, user]);
        }
        setUserSearchQuery('');
    };

    const handleUserRemove = (userId) => {
        setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
    };

    const filteredUsers = availableUsers.filter(user => 
        user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
    ).filter(user => !selectedUsers.find(u => u.id === user.id));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        // Validation
        const newErrors = {};
        
        if (conversationType !== 'direct' && !conversationName.trim()) {
            newErrors.name = 'Conversation name is required for group conversations';
        }
        
        if (selectedUsers.length === 0) {
            newErrors.users = 'Please select at least one user';
        }
        
        if (conversationType === 'direct' && selectedUsers.length > 1) {
            newErrors.users = 'Direct conversations can only have one other participant';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setLoading(false);
            return;
        }

        try {
            const conversationData = {
                type: conversationType,
                name: conversationType === 'direct' ? null : conversationName.trim(),
                description: conversationType === 'direct' ? null : (description.trim() || null),
                is_private: conversationType === 'direct' ? true : isPrivate,
                participant_ids: selectedUsers.map(u => u.id)
            };

            await onCreateConversation(conversationData);
        } catch (error) {
            console.error('Error creating conversation:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ general: 'Failed to create conversation. Please try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">New Conversation</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Conversation Type */}
                    <div>
                        <InputLabel value="Conversation Type" />
                        <div className="mt-2 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setConversationType('direct')}
                                className={`flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
                                    conversationType === 'direct'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <UserPlusIcon className="h-5 w-5 mr-2" />
                                Direct Message
                            </button>
                            <button
                                type="button"
                                onClick={() => setConversationType('group')}
                                className={`flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
                                    conversationType === 'group'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <UserGroupIcon className="h-5 w-5 mr-2" />
                                Group Chat
                            </button>
                        </div>
                    </div>

                    {/* Conversation Name (for groups) */}
                    {conversationType !== 'direct' && (
                        <div>
                            <InputLabel htmlFor="name" value="Conversation Name" />
                            <TextInput
                                id="name"
                                type="text"
                                className="mt-1 block w-full"
                                value={conversationName}
                                onChange={(e) => setConversationName(e.target.value)}
                                placeholder="Enter conversation name"
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>
                    )}

                    {/* Description (for groups) */}
                    {conversationType !== 'direct' && (
                        <div>
                            <InputLabel htmlFor="description" value="Description (Optional)" />
                            <textarea
                                id="description"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                rows="3"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter conversation description"
                            />
                        </div>
                    )}

                    {/* Privacy Setting (for groups) */}
                    {conversationType !== 'direct' && (
                        <div className="flex items-center">
                            <input
                                id="is_private"
                                type="checkbox"
                                checked={isPrivate}
                                onChange={(e) => setIsPrivate(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="is_private" className="ml-2 block text-sm text-gray-900">
                                Make this conversation private
                            </label>
                        </div>
                    )}

                    {/* User Selection */}
                    <div>
                        <InputLabel value={`Select ${conversationType === 'direct' ? 'User' : 'Users'}`} />
                        
                        {/* Selected Users */}
                        {selectedUsers.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {selectedUsers.map(user => (
                                    <span
                                        key={user.id}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                                    >
                                        {user.name}
                                        <button
                                            type="button"
                                            onClick={() => handleUserRemove(user.id)}
                                            className="ml-2 text-blue-600 hover:text-blue-800"
                                        >
                                            <XMarkIcon className="h-4 w-4" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* User Search */}
                        <div className="mt-2 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Search users..."
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* User List */}
                        {userSearchQuery && (
                            <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map(user => (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => handleUserSelect(user)}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-medium">
                                                {user.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-sm text-gray-500">
                                        No users found
                                    </div>
                                )}
                            </div>
                        )}

                        <InputError message={errors.users} className="mt-2" />
                    </div>

                    {/* General Error */}
                    {errors.general && (
                        <InputError message={errors.general} />
                    )}

                    {/* Form Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={loading || selectedUsers.length === 0}>
                            {loading ? 'Creating...' : 'Create Conversation'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
} 