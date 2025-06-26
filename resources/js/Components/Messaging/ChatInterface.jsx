import React, { useState, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import ConversationList from './ConversationList';
import MessageArea from './MessageArea';
import NewConversationModal from './NewConversationModal';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

export default function ChatInterface({ className = '' }) {
    const { auth } = usePage().props;
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewConversationModal, setShowNewConversationModal] = useState(false);
    const [typingUsers, setTypingUsers] = useState({});
    const echo = useRef(null);

    // Initialize Echo connection
    useEffect(() => {
        echo.current = window.Echo;
        
        // Subscribe to tenant-wide notifications
        if (auth.user.tenant_id) {
            echo.current.private(`tenant.${auth.user.tenant_id}.notifications`)
                .listen('ConversationCreated', (e) => {
                    fetchConversations();
                });
        }

        return () => {
            // Cleanup Echo subscriptions
            if (echo.current && auth.user.tenant_id) {
                echo.current.leave(`tenant.${auth.user.tenant_id}.notifications`);
            }
        };
    }, [auth.user.tenant_id]);

    // Fetch conversations on component mount
    useEffect(() => {
        fetchConversations();
    }, []);

    // Subscribe to conversation when selected
    useEffect(() => {
        if (selectedConversation && echo.current) {
            const channelName = `tenant.${auth.user.tenant_id}.conversation.${selectedConversation.id}`;
            console.log('Subscribing to channel:', channelName);
            
            const channel = echo.current.private(channelName);
            
            // Debug logging for connection status
            channel.subscribed(() => {
                console.log('Successfully subscribed to channel:', channelName);
            });
            
            // Debug logging for subscription error
            channel.error((error) => {
                console.error('Channel subscription error:', error);
            });
            
            // Listen for messages
            channel.listen('.message.sent', (e) => {
                console.log('Received message event:', e);
                const newMessage = {
                    id: e.id,
                    conversation_id: e.conversation_id,
                    content: e.content,
                    type: e.type,
                    metadata: e.metadata,
                    created_at: e.created_at,
                    formatted_date: e.formatted_date,
                    time_ago: e.time_ago,
                    user: e.user
                };
                setMessages(prev => [...prev, newMessage]);
                updateConversationLastMessage(selectedConversation.id, newMessage);
            });

            // Cleanup subscription on unmount
            return () => {
                console.log('Unsubscribing from channel:', channelName);
                channel.unsubscribe();
            };
        }
    }, [selectedConversation, auth.user]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const params = auth.user.is_central_admin ? `?tenant_id=${auth.user.tenant_id}` : '';
            const response = await fetch(`/api/messaging/conversations${params}`, {
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
            setConversations(data.conversations);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId) => {
        try {
            const params = auth.user.is_central_admin ? `?tenant_id=${auth.user.tenant_id}` : '';
            const response = await fetch(`/api/messaging/conversations/${conversationId}/messages${params}`, {
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
            setMessages(data.messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const selectConversation = (conversation) => {
        setSelectedConversation(conversation);
        setMessages([]);
        setTypingUsers({});
        fetchMessages(conversation.id);
    };

    const sendMessage = async (content, type = 'text', metadata = null) => {
        if (!selectedConversation || !content.trim()) return;

        try {
            const body = {
                content: content.trim(),
                type,
                ...(metadata ? { metadata: Array.isArray(metadata) ? metadata : [metadata] } : {}),
                ...(auth.user.is_central_admin ? { tenant_id: auth.user.tenant_id } : {})
            };

            const response = await fetch(`/api/messaging/conversations/${selectedConversation.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(body),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Message will be added via WebSocket broadcast
            // But we can add it optimistically for immediate UI feedback
            const newMessage = data.message;
            setMessages(prev => [...prev, newMessage]);
            updateConversationLastMessage(selectedConversation.id, newMessage);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const updateConversationLastMessage = (conversationId, message) => {
        setConversations(prev => prev.map(conv => 
            conv.id === conversationId 
                ? { ...conv, last_message: message, unread_count: conv.id === selectedConversation?.id ? 0 : conv.unread_count + 1 }
                : conv
        ));
    };

    const handleTyping = (isTyping) => {
        if (!selectedConversation) return;

        const body = {
            is_typing: isTyping,
            ...(auth.user.is_central_admin ? { tenant_id: auth.user.tenant_id } : {})
        };

        fetch(`/api/messaging/conversations/${selectedConversation.id}/typing`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify(body),
            credentials: 'same-origin'
        }).catch(error => {
            console.error('Error sending typing indicator:', error);
        });
    };

    const createConversation = async (conversationData) => {
        try {
            const body = {
                ...conversationData,
                ...(auth.user.is_central_admin ? { tenant_id: auth.user.tenant_id } : {})
            };

            const response = await fetch('/api/messaging/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(body),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Validation errors:', errorData);
                throw new Error(`HTTP error! status: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            const newConversation = data.conversation;
            setConversations(prev => [newConversation, ...prev]);
            setSelectedConversation(newConversation);
            setMessages([]);
            setShowNewConversationModal(false);
            
            return newConversation;
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
    };

    return (
        <div className={`flex h-full bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
            {/* Conversation List Sidebar */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                        <button
                            onClick={() => setShowNewConversationModal(true)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="New Conversation"
                        >
                            <PlusCircleIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                
                <ConversationList
                    conversations={conversations}
                    selectedConversation={selectedConversation}
                    onSelectConversation={selectConversation}
                    loading={loading}
                    currentUser={auth.user}
                />
            </div>

            {/* Message Area */}
            <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <MessageArea
                        conversation={selectedConversation}
                        messages={messages}
                        onSendMessage={sendMessage}
                        onTyping={handleTyping}
                        typingUsers={Object.values(typingUsers).filter(Boolean)}
                        currentUser={auth.user}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <div className="text-gray-400 text-lg mb-2">💬</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No conversation selected</h3>
                            <p className="text-gray-500">Choose a conversation to start messaging</p>
                        </div>
                    </div>
                )}
            </div>

            {/* New Conversation Modal */}
            {showNewConversationModal && (
                <NewConversationModal
                    show={showNewConversationModal}
                    onClose={() => setShowNewConversationModal(false)}
                    onCreateConversation={createConversation}
                    tenantId={auth.user.tenant_id}
                />
            )}
        </div>
    );
} 