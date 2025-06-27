import React, { useState } from 'react';
import { format } from 'date-fns';
import { CheckIcon, DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline';

export default function MessageBubble({ message, currentUser, showAvatar = true }) {
    const [showTimestamp, setShowTimestamp] = useState(false);
    const isOwnMessage = message.user_id === currentUser.id;

    const formatMessageTime = (timestamp) => {
        try {
            return format(new Date(timestamp), 'h:mm a');
        } catch (error) {
            return '';
        }
    };

    const getUserAvatar = () => {
        return (
            <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-medium">
                {message.user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
        );
    };

    const renderMessageContent = () => {
        switch (message.type) {
            case 'text':
                return (
                    <div className="whitespace-pre-wrap break-words">
                        {message.content}
                    </div>
                );
            
            case 'image':
                return (
                    <div>
                        {message.metadata?.url ? (
                            <img 
                                src={message.metadata.url} 
                                alt="Shared image"
                                className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(message.metadata.url, '_blank')}
                            />
                        ) : (
                            <div className="flex items-center space-x-2 text-gray-600">
                                <PhotoIcon className="h-5 w-5" />
                                <span>Image</span>
                            </div>
                        )}
                        {message.content && (
                            <div className="mt-2 text-sm opacity-90">
                                {message.content}
                            </div>
                        )}
                    </div>
                );
            
            case 'file':
                return (
                    <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg max-w-xs">
                        <DocumentIcon className="h-8 w-8 text-gray-600 flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {message.metadata?.filename || 'File'}
                            </p>
                            {message.metadata?.size && (
                                <p className="text-xs text-gray-500">
                                    {formatFileSize(message.metadata.size)}
                                </p>
                            )}
                            {message.content && (
                                <p className="text-xs text-gray-600 mt-1">
                                    {message.content}
                                </p>
                            )}
                        </div>
                    </div>
                );
            
            case 'system':
                return (
                    <div className="text-center">
                        <span className="px-3 py-1 text-xs text-gray-500 bg-gray-100 rounded-full">
                            {message.content}
                        </span>
                    </div>
                );
            
            default:
                return (
                    <div className="whitespace-pre-wrap break-words">
                        {message.content}
                    </div>
                );
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // System messages are centered and styled differently
    if (message.type === 'system') {
        return (
            <div className="flex justify-center my-2">
                {renderMessageContent()}
            </div>
        );
    }

    return (
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}>
            <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} space-x-2 ${isOwnMessage ? 'space-x-reverse' : ''}`}>
                {/* Avatar */}
                {!isOwnMessage && (
                    <div className="flex-shrink-0">
                        {showAvatar ? (
                            getUserAvatar()
                        ) : (
                            <div className="w-8 h-8" />
                        )}
                    </div>
                )}

                {/* Message Content */}
                <div className="flex flex-col space-y-1">
                    {/* Username for group chats */}
                    {!isOwnMessage && showAvatar && message.user && (
                        <span className="text-xs text-gray-500 px-3">
                            {message.user.name}
                        </span>
                    )}

                    {/* Message Bubble */}
                    <div 
                        className={`px-4 py-2 rounded-2xl cursor-pointer transition-all duration-200 ${
                            isOwnMessage 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-900'
                        } ${showTimestamp ? 'mb-1' : ''}`}
                        onClick={() => setShowTimestamp(!showTimestamp)}
                    >
                        {renderMessageContent()}
                        
                        {/* Read status for own messages */}
                        {isOwnMessage && (
                            <div className="flex justify-end mt-1">
                                <CheckIcon className="h-3 w-3 opacity-70" />
                            </div>
                        )}
                    </div>

                    {/* Timestamp */}
                    {showTimestamp && (
                        <div className={`text-xs text-gray-500 px-3 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                            {formatMessageTime(message.created_at)}
                            {message.is_edited && (
                                <span className="ml-1 opacity-70">(edited)</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 