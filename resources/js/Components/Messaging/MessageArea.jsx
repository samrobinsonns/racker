import React, { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow, format, isSameDay } from 'date-fns';
import { 
    PaperAirplaneIcon, 
    UserGroupIcon,
    EllipsisVerticalIcon 
} from '@heroicons/react/24/outline';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

export default function MessageArea({ 
    conversation, 
    messages, 
    onSendMessage, 
    onTyping, 
    typingUsers, 
    currentUser 
}) {
    const [messageInput, setMessageInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus input when conversation changes
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [conversation]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;

        onSendMessage(messageInput);
        setMessageInput('');
        stopTyping();
    };

    const handleInputChange = (e) => {
        setMessageInput(e.target.value);
        
        if (!isTyping && e.target.value.trim()) {
            setIsTyping(true);
            onTyping(true);
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing
        typingTimeoutRef.current = setTimeout(() => {
            stopTyping();
        }, 1000);
    };

    const stopTyping = () => {
        if (isTyping) {
            setIsTyping(false);
            onTyping(false);
        }
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };

    const getConversationTitle = () => {
        if (conversation.name) {
            return conversation.name;
        }
        
        if (conversation.type === 'direct' && conversation.participants) {
            const otherParticipant = conversation.participants.find(p => p.user_id !== currentUser.id);
            return otherParticipant?.user?.name || 'Unknown User';
        }
        
        return `${conversation.type.charAt(0).toUpperCase() + conversation.type.slice(1)} Chat`;
    };

    const getConversationSubtitle = () => {
        if (conversation.type === 'direct') {
            const otherParticipant = conversation.participants?.find(p => p.user_id !== currentUser.id);
            return otherParticipant?.user?.email || '';
        }
        
        if (conversation.participants) {
            return `${conversation.participants.length} member${conversation.participants.length !== 1 ? 's' : ''}`;
        }
        
        return '';
    };

    const groupMessagesByDate = (messages) => {
        const grouped = [];
        let currentDate = null;
        
        messages.forEach((message, index) => {
            const messageDate = new Date(message.created_at);
            
            if (!currentDate || !isSameDay(currentDate, messageDate)) {
                currentDate = messageDate;
                grouped.push({
                    type: 'date',
                    date: messageDate,
                    id: `date-${index}`
                });
            }
            
            grouped.push(message);
        });
        
        return grouped;
    };

    const formatDateHeader = (date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (isSameDay(date, today)) {
            return 'Today';
        } else if (isSameDay(date, yesterday)) {
            return 'Yesterday';
        } else {
            return format(date, 'MMMM d, yyyy');
        }
    };

    const groupedMessages = groupMessagesByDate(messages);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            {conversation.type === 'direct' ? (
                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                                    {conversation.participants?.find(p => p.user_id !== currentUser.id)?.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white">
                                    <UserGroupIcon className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">{getConversationTitle()}</h2>
                            {getConversationSubtitle() && (
                                <p className="text-sm text-gray-500">{getConversationSubtitle()}</p>
                            )}
                        </div>
                    </div>
                    
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <EllipsisVerticalIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {groupedMessages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-gray-400 text-4xl mb-2">💬</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No messages yet</h3>
                            <p className="text-gray-500">Send the first message to start the conversation</p>
                        </div>
                    </div>
                ) : (
                    groupedMessages.map((item, index) => (
                        item.type === 'date' ? (
                            <div key={item.id} className="flex justify-center my-4">
                                <span className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                                    {formatDateHeader(item.date)}
                                </span>
                            </div>
                        ) : (
                            <MessageBubble
                                key={item.id}
                                message={item}
                                currentUser={currentUser}
                                showAvatar={
                                    index === groupedMessages.length - 1 || 
                                    groupedMessages[index + 1]?.user_id !== item.user_id ||
                                    groupedMessages[index + 1]?.type === 'date'
                                }
                            />
                        )
                    ))
                )}
                
                {/* Typing Indicators */}
                {typingUsers.length > 0 && (
                    <TypingIndicator users={typingUsers} />
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                    <div className="flex-1">
                        <textarea
                            ref={inputRef}
                            value={messageInput}
                            onChange={handleInputChange}
                            placeholder="Type a message..."
                            className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows="1"
                            style={{ minHeight: '40px', maxHeight: '120px' }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!messageInput.trim()}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    );
} 