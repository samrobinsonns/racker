import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { UserGroupIcon, UserIcon } from '@heroicons/react/24/outline';

export default function ConversationList({ 
    conversations, 
    selectedConversation, 
    onSelectConversation, 
    loading, 
    currentUser 
}) {
    const getConversationDisplayName = (conversation) => {
        if (conversation.name) {
            return conversation.name;
        }
        
        // For direct conversations, show the other user's name
        if (conversation.type === 'direct' && conversation.participants) {
            const otherParticipant = conversation.participants.find(p => p.user_id !== currentUser.id);
            return otherParticipant?.user?.name || 'Unknown User';
        }
        
        return `${conversation.type.charAt(0).toUpperCase() + conversation.type.slice(1)} Chat`;
    };

    const getConversationAvatar = (conversation) => {
        if (conversation.type === 'direct') {
            const otherParticipant = conversation.participants?.find(p => p.user_id !== currentUser.id);
            return (
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {otherParticipant?.user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
            );
        } else {
            return (
                <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center text-white">
                    <UserGroupIcon className="w-6 h-6" />
                </div>
            );
        }
    };

    const formatLastMessageTime = (timestamp) => {
        if (!timestamp) return '';
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch (error) {
            return '';
        }
    };

    const getLastMessagePreview = (conversation) => {
        if (!conversation.last_message) return 'No messages yet';
        
        const message = conversation.last_message;
        const isOwnMessage = message.user_id === currentUser.id;
        const prefix = isOwnMessage ? 'You: ' : '';
        
        switch (message.type) {
            case 'text':
                return `${prefix}${message.content}`;
            case 'image':
                return `${prefix}📷 Image`;
            case 'file':
                return `${prefix}📎 File`;
            case 'system':
                return message.content;
            default:
                return `${prefix}${message.content}`;
        }
    };

    if (loading) {
        return (
            <div className="flex-1 p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                    <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No conversations yet</h3>
                    <p className="text-gray-500 text-sm">Start a new conversation to begin messaging</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => (
                <div
                    key={conversation.id}
                    onClick={() => onSelectConversation(conversation)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                >
                    <div className="flex items-start space-x-3">
                        {getConversationAvatar(conversation)}
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className={`text-sm font-medium truncate ${
                                    selectedConversation?.id === conversation.id ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                    {getConversationDisplayName(conversation)}
                                </h3>
                                
                                <div className="flex items-center space-x-2">
                                    {conversation.last_message && (
                                        <span className="text-xs text-gray-500">
                                            {formatLastMessageTime(conversation.last_message.created_at)}
                                        </span>
                                    )}
                                    
                                    {conversation.unread_count > 0 && (
                                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px] h-5">
                                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <p className={`text-sm truncate ${
                                conversation.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                            }`}>
                                {getLastMessagePreview(conversation)}
                            </p>
                            
                            {conversation.type !== 'direct' && conversation.participants && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {conversation.participants.length} participant{conversation.participants.length !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
} 