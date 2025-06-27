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
    const messagesRef = useRef(messages);
    const conversationsRef = useRef(conversations);
    const channelRef = useRef(null);

    // Keep refs in sync with state
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    // Initialize Echo connection
    useEffect(() => {
        echo.current = window.Echo;
        
        // Subscribe to tenant-wide notifications
        if (auth.user.tenant_id) {
            const notificationChannel = echo.current.private(`tenant.${auth.user.tenant_id}.notifications`);
            
            notificationChannel
                .listen('.conversation.created', (e) => {
                    console.log('New conversation created:', e);
                    fetchConversations();
                })
                .listen('.conversation.updated', (e) => {
                    console.log('Conversation updated:', e);
                    // Update the conversation in the list with the new data
                    setConversations(prevConversations => {
                        return prevConversations.map(conv => {
                            if (conv.id === e.conversation.id) {
                                // If this is not the selected conversation, update unread count
                                const unreadCount = !selectedConversation || selectedConversation.id !== conv.id
                                    ? (e.conversation.participants_data[auth.user.id]?.unread_count || 0)
                                    : 0;
                                
                                return {
                                    ...conv,
                                    ...e.conversation,
                                    unread_count: unreadCount,
                                    last_message: e.conversation.last_message
                                };
                            }
                            return conv;
                        }).sort((a, b) => {
                            const aTime = a.last_message?.created_at || a.created_at;
                            const bTime = b.last_message?.created_at || b.created_at;
                            return new Date(bTime) - new Date(aTime);
                        });
                    });
                })
                .error((error) => {
                    console.error('Notifications channel error:', error);
                });

            return () => {
                notificationChannel.stopListening('.conversation.created');
                notificationChannel.stopListening('.conversation.updated');
                echo.current.leave(`tenant.${auth.user.tenant_id}.notifications`);
            };
        }
    }, [auth.user.tenant_id, selectedConversation?.id]);

    // Fetch conversations on component mount
    useEffect(() => {
        fetchConversations();
    }, []);

    // Subscribe to conversation when selected
    useEffect(() => {
        const subscribeToConversation = async () => {
            // Cleanup previous subscription
            if (channelRef.current) {
                console.log('Cleaning up previous subscription');
                channelRef.current.stopListening('.message.sent');
                channelRef.current.stopListening('typing');
                channelRef.current = null;
            }

            if (selectedConversation && echo.current) {
                const channelName = `tenant.${auth.user.tenant_id}.conversation.${selectedConversation.id}`;
                console.log('Subscribing to channel:', channelName, 'Type:', selectedConversation.type);
                
                // Always use private channel
                const channel = echo.current.private(channelName);
                channelRef.current = channel;
                
                channel.subscribed(() => {
                    console.log('Successfully subscribed to channel:', channelName);
                }).error((error) => {
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
                    
                    console.log('Adding new message to state:', newMessage);
                    
                    // Update messages state
                    setMessages(prevMessages => {
                        // Check if message already exists (including optimistic ones)
                        if (prevMessages.some(msg => 
                            msg.id === newMessage.id || 
                            (msg.id.toString().startsWith('temp-') && 
                             msg.content === newMessage.content && 
                             msg.user.id === newMessage.user.id)
                        )) {
                            console.log('Message already exists in state');
                            return prevMessages;
                        }
                        
                        // If this is our own message in a group chat, remove the optimistic version
                        if (selectedConversation.type === 'group' && newMessage.user.id === auth.user.id) {
                            const updatedMessages = prevMessages.filter(msg => !msg.id.toString().startsWith('temp-'));
                            return [...updatedMessages, newMessage];
                        }
                        
                        const updatedMessages = [...prevMessages, newMessage];
                        console.log('New messages state:', updatedMessages);
                        return updatedMessages;
                    });

                    // Update conversation list
                    const updatedConversation = {
                        ...selectedConversation,
                        last_message: newMessage,
                        updated_at: newMessage.created_at
                    };
                    updateConversationInList(updatedConversation);
                });

                // Listen for typing events
                channel.listenForWhisper('typing', (e) => {
                    console.log('Typing event received:', e);
                    if (e.user.id === auth.user.id) return;
                    
                    setTypingUsers(prev => ({
                        ...prev,
                        [e.user.id]: {
                            ...e.user,
                            isTyping: e.isTyping,
                            timestamp: e.timestamp
                        }
                    }));
                });
            }
        };

        subscribeToConversation();

        // Cleanup function
        return () => {
            if (channelRef.current) {
                console.log('Cleaning up subscription on unmount');
                channelRef.current.stopListening('.message.sent');
                channelRef.current.stopListening('typing');
                if (selectedConversation) {
                    const channelName = `tenant.${auth.user.tenant_id}.conversation.${selectedConversation.id}`;
                    echo.current.leave(`private-${channelName}`);
                }
                channelRef.current = null;
            }
        };
    }, [selectedConversation?.id, auth.user.tenant_id]); // Only re-run if conversation ID changes

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
            // Create optimistic message
            const optimisticMessage = {
                id: `temp-${Date.now()}`,
                conversation_id: selectedConversation.id,
                content: content.trim(),
                type,
                metadata: metadata ? (Array.isArray(metadata) ? metadata : [metadata]) : null,
                created_at: new Date().toISOString(),
                formatted_date: new Date().toLocaleString(),
                time_ago: 'Just now',
                user: {
                    id: auth.user.id,
                    name: auth.user.name,
                    email: auth.user.email
                }
            };

            // For direct messages, show optimistic update immediately
            // For group messages, wait for the broadcast
            if (selectedConversation.type === 'direct') {
                setMessages(prevMessages => [...prevMessages, optimisticMessage]);
                updateConversationInList({
                    ...selectedConversation,
                    last_message: optimisticMessage,
                    updated_at: optimisticMessage.created_at
                });
            }

            const body = {
                content: content.trim(),
                type,
                ...(metadata ? { metadata: Array.isArray(metadata) ? metadata : [metadata] } : {}),
                ...(auth.user.is_central_admin ? { tenant_id: auth.user.tenant_id } : {})
            };

            console.log('Sending message:', body);

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
            console.log('Message sent successfully:', data);

            // For direct messages, replace the optimistic message with the real one
            if (selectedConversation.type === 'direct') {
                setMessages(prevMessages => {
                    const updatedMessages = prevMessages.filter(msg => msg.id !== optimisticMessage.id);
                    return [...updatedMessages, data.message];
                });
                
                updateConversationInList({
                    ...selectedConversation,
                    last_message: data.message,
                    updated_at: data.message.created_at
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Remove optimistic message on error (only for direct messages)
            if (selectedConversation.type === 'direct') {
                setMessages(prevMessages => prevMessages.filter(msg => msg.id !== optimisticMessage.id));
            }
            
            // Show error to user
            alert('Failed to send message. Please try again.');
        }
    };

    const updateConversationInList = (updatedConversation) => {
        console.log('Updating conversation in list:', updatedConversation);
        
        setConversations(prevConversations => {
            // Find the conversation in the list
            const index = prevConversations.findIndex(c => c.id === updatedConversation.id);
            
            if (index === -1) {
                console.log('Conversation not found in list, adding it');
                return [updatedConversation, ...prevConversations];
            }

            // Create new array with updated conversation
            const newConversations = [...prevConversations];
            newConversations[index] = {
                ...newConversations[index],
                ...updatedConversation,
                // Preserve unread count based on selection state
                unread_count: selectedConversation?.id === updatedConversation.id 
                    ? 0 
                    : (newConversations[index].unread_count || 0) + (updatedConversation.last_message?.user?.id !== auth.user.id ? 1 : 0)
            };

            // Sort conversations by last message time
            const sortedConversations = newConversations.sort((a, b) => {
                const aTime = a.last_message?.created_at || a.created_at;
                const bTime = b.last_message?.created_at || b.created_at;
                return new Date(bTime) - new Date(aTime);
            });

            console.log('Updated conversations list:', sortedConversations);
            return sortedConversations;
        });

        // Update selected conversation if it's the one being updated
        if (selectedConversation?.id === updatedConversation.id) {
            console.log('Updating selected conversation');
            setSelectedConversation(prev => ({
                ...prev,
                ...updatedConversation,
                unread_count: 0 // Always 0 for selected conversation
            }));
        }
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