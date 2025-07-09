import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ContactSelector from '@/Components/ContactSelector';
import Avatar from '@/Components/User/Avatar';
import CannedResponseModal from '@/Components/CannedResponseModal';
import EditTicketModal from '@/Components/EditTicketModal';

// Add CSS for email content styling
const emailStyles = `
    .email-content {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: inherit;
        max-width: 100%;
        margin: 0 auto;
        /* Preserve original email text alignment */
        text-align: left;
    }
    
    .email-content * { 
        max-width: 100% !important;
    }
    
    /* Let most elements inherit color, but preserve button/link colors */
    .email-content *:not(a):not(button):not([role="button"]) { 
        color: inherit !important; 
    }
    
    .email-content p {
        margin-bottom: 1rem;
    }
    
    .email-content br {
        display: block;
        margin: 0.5rem 0;
    }
    
    .email-content strong, .email-content b {
        font-weight: 600;
        color: #111827;
    }
    
    .email-content em, .email-content i {
        font-style: italic;
    }
    
    .email-content a {
        color: #2563eb;
        text-decoration: underline;
    }
    
    .email-content a:hover {
        color: #1d4ed8;
    }
    
    /* Remove borders and clean up email tables */
    .email-content table {
        border-collapse: collapse;
        margin: 0.5rem 0;
        border: none !important;
        width: auto !important;
        max-width: 100% !important;
    }
    
    .email-content td, .email-content th {
        padding: 0.25rem 0.5rem;
        border: none !important;
        vertical-align: top;
    }
    
    /* Hide common email client artifacts */
    .email-content table[style*="border"] {
        border: none !important;
    }
    
    .email-content td[style*="border"], 
    .email-content th[style*="border"] {
        border: none !important;
    }
    
    /* Remove excessive spacing from email layouts */
    .email-content table table {
        margin: 0 !important;
    }
    
    .email-content td table,
    .email-content th table {
        margin: 0 !important;
    }
    
    /* Clean up email wrapper elements */
    .email-content > table:first-child {
        margin-top: 0;
    }
    
    .email-content > table:last-child {
        margin-bottom: 0;
    }
    
    /* Preserve original email layout and alignment attributes */
    .email-content table[align="center"],
    .email-content div[align="center"],
    .email-content td[align="center"],
    .email-content th[align="center"] {
        text-align: center !important;
    }
    
    .email-content table[align="left"],
    .email-content div[align="left"],
    .email-content td[align="left"],
    .email-content th[align="left"] {
        text-align: left !important;
    }
    
    .email-content table[align="right"],
    .email-content div[align="right"],
    .email-content td[align="right"],
    .email-content th[align="right"] {
        text-align: right !important;
    }
    
    .email-content table[width="100%"],
    .email-content table[style*="width: 100%"] {
        width: 100% !important;
    }
    
    /* Hide email client spacer elements */
    .email-content img[width="1"],
    .email-content img[height="1"],
    .email-content img[src*="spacer"],
    .email-content img[src*="pixel"],
    .email-content img[alt=""],
    .email-content img:not([alt]):not([title]) {
        display: none !important;
    }
    
    /* Style actual content images properly */
    .email-content img[alt]:not([alt=""]),
    .email-content img[title] {
        max-width: 100%;
        height: auto;
        border-radius: 0.375rem;
        display: block;
        margin: 1rem 0;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    }
    
    .email-content img[src^="data:"] {
        max-width: 100%;
        height: auto;
    }
    
    .email-content img[src^="cid:"] {
        display: none;
    }
    
    .email-content img[src^="http"] {
        max-width: 100%;
        height: auto;
    }
    
    /* Remove email signature styles */
    .email-content div[style*="font-size: 8pt"],
    .email-content div[style*="font-size: 9pt"],
    .email-content div[style*="font-size: 10pt"],
    .email-content span[style*="font-size: 8pt"],
    .email-content span[style*="font-size: 9pt"],
    .email-content span[style*="font-size: 10pt"] {
        font-size: 0.875rem !important;
        color: #6b7280 !important;
    }
    
    /* Clean up blockquotes */
    .email-content blockquote {
        border-left: 4px solid #d1d5db;
        padding-left: 1rem;
        margin: 1rem 0;
        color: #6b7280;
        background: transparent !important;
    }
    
    .email-content ul, .email-content ol {
        padding-left: 1.5rem;
        margin: 1rem 0;
    }
    
    .email-content li {
        margin-bottom: 0.25rem;
    }
    
    /* Preserve important styling for buttons and key elements */
    .email-content a[style*="background-color"],
    .email-content button,
    .email-content input[type="button"],
    .email-content input[type="submit"],
    .email-content *[role="button"] {
        background-color: revert !important;
        color: revert !important;
        padding: revert !important;
        border-radius: revert !important;
        text-decoration: none !important;
        display: inline-block !important;
        font-weight: revert !important;
        text-align: center !important;
        border: revert !important;
    }
    
    /* Remove unwanted background colors and patterns for non-interactive elements */
    .email-content div:not([style*="background-color"]),
    .email-content span:not([style*="background-color"]),
    .email-content p:not([style*="background-color"]) {
        background-image: none !important;
        background-color: transparent !important;
    }
    
    /* Override email client font styling */
    .email-content font {
        font-family: inherit !important;
    }
    
    /* Preserve text alignment from original email styling */
    .email-content *[style*="text-align: center"] {
        text-align: center !important;
    }
    
    .email-content *[style*="text-align: left"] {
        text-align: left !important;
    }
    
    .email-content *[style*="text-align: right"] {
        text-align: right !important;
    }
    
    .email-content *[style*="text-align: justify"] {
        text-align: justify !important;
    }
    
    /* Default to left alignment for most content unless explicitly styled */
    .email-content p:not([style*="text-align"]),
    .email-content div:not([style*="text-align"]):not([align]) {
        text-align: left;
    }
    
    /* Style email links that look like buttons */
    .email-content a[style*="background"] {
        padding: 0.75rem 1.5rem !important;
        border-radius: 0.375rem !important;
        text-decoration: none !important;
        display: inline-block !important;
        font-weight: 600 !important;
        text-align: center !important;
        min-width: 120px !important;
    }
    
    /* Preserve font sizes and weights */
    .email-content *[style*="font-weight: bold"],
    .email-content *[style*="font-weight: 700"],
    .email-content *[style*="font-weight: 600"] {
        font-weight: 600 !important;
    }
    
    .email-content *[style*="font-size"] {
        font-size: revert !important;
    }
    
    /* Clean up divs used for layout */
    .email-content div {
        margin: 0;
        padding: 0;
    }
    
    .email-content div:not(:empty) {
        margin-bottom: 0.5rem;
    }
    
    .email-content div:last-child {
        margin-bottom: 0;
    }
    
    /* Hide email tracking pixels and spacers */
    .email-content img[width="0"],
    .email-content img[height="0"],
    .email-content img[style*="width: 0"],
    .email-content img[style*="height: 0"],
    .email-content img[style*="display: none"] {
        display: none !important;
    }
    
    /* Responsive images for mobile */
    @media (max-width: 640px) {
        .email-content img {
            max-width: 100%;
            height: auto;
            margin: 0.5rem 0;
        }
        
        .email-content table {
            width: 100% !important;
        }
    }

    /* Mention autocomplete styles */
    .mention-autocomplete {
        position: absolute;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 50;
        max-height: 200px;
        overflow-y: auto;
        min-width: 200px;
    }

    .mention-suggestion {
        padding: 0.5rem 0.75rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .mention-suggestion:hover {
        background-color: #f3f4f6;
    }

    .mention-suggestion.selected {
        background-color: #e5e7eb;
    }

    .mention-avatar {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        background-color: #6b7280;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .mention-text {
        color: #2563eb;
        font-weight: 500;
    }

    /* Active mention state for textarea */
    .textarea-mention-active {
        border-color: #2563eb !important;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
        outline: none !important;
    }

    /* Canned response autocomplete styles */
    .canned-response-autocomplete {
        position: absolute;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 50;
        max-height: 300px;
        overflow-y: auto;
        min-width: 300px;
    }

    .canned-response-suggestion {
        padding: 0.75rem;
        cursor: pointer;
        border-bottom: 1px solid #f3f4f6;
    }

    .canned-response-suggestion:hover {
        background-color: #f3f4f6;
    }

    .canned-response-suggestion.selected {
        background-color: #e5e7eb;
    }

    .canned-response-suggestion:last-child {
        border-bottom: none;
    }

    /* Active canned response state for textarea */
    .textarea-canned-response-active {
        border-color: #059669 !important;
        box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1) !important;
        outline: none !important;
    }
`;
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
    EyeSlashIcon,
    TrashIcon,
    ChatBubbleBottomCenterTextIcon,
    CalendarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDownIcon
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
    const [replyType, setReplyType] = useState('public');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showCannedResponseModal, setShowCannedResponseModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [messagesReversed, setMessagesReversed] = useState(true);
    const [activitiesReversed, setActivitiesReversed] = useState(true);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(ticket.due_date || null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [activityKey, setActivityKey] = useState(0);
    const [isActivityCollapsed, setIsActivityCollapsed] = useState(false);
    const datePickerRef = useRef(null);
    
    // Add state for number of activities to show
    const [visibleActivities, setVisibleActivities] = useState(5);

    // Function to show more activities
    const showMoreActivities = () => {
        setVisibleActivities(prev => prev + 5);
    };

    // Mention functionality state
    const [mentionSuggestions, setMentionSuggestions] = useState([]);
    const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false);
    const [mentionSearchTerm, setMentionSearchTerm] = useState('');
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
    const [mentionCursorPosition, setMentionCursorPosition] = useState({ start: 0, end: 0 });
    const textareaRef = useRef(null);

    // Canned response functionality state
    const [cannedResponseSuggestions, setCannedResponseSuggestions] = useState([]);
    const [showCannedResponseAutocomplete, setShowCannedResponseAutocomplete] = useState(false);
    const [cannedResponseSearchTerm, setCannedResponseSearchTerm] = useState('');
    const [selectedCannedResponseIndex, setSelectedCannedResponseIndex] = useState(0);
    const [cannedResponseCursorPosition, setCannedResponseCursorPosition] = useState({ start: 0, end: 0 });

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

    // Canned response functionality
    const searchCannedResponses = async (searchTerm) => {
        if (!searchTerm || searchTerm.length < 1) {
            setCannedResponseSuggestions([]);
            setShowCannedResponseAutocomplete(false);
            return;
        }

        try {
            const response = await fetch(route('canned-responses.search', { search: searchTerm, limit: 10 }));
            if (response.ok) {
                const data = await response.json();
                setCannedResponseSuggestions(data.responses);
                setShowCannedResponseAutocomplete(data.responses.length > 0);
                setSelectedCannedResponseIndex(0);
            }
        } catch (error) {
            console.error('Error searching canned responses:', error);
        }
    };

    const handleMentionSelect = (user) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const beforeMention = replyData.content.substring(0, mentionCursorPosition.start);
        const afterMention = replyData.content.substring(mentionCursorPosition.end);
        const newContent = beforeMention + `@${user.name} ` + afterMention;

        setReplyData('content', newContent);
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

    const handleCannedResponseSelect = (cannedResponse) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        // Process the canned response content with placeholders
        const processedContent = cannedResponse.content
            .replace(/{customer_name}/g, ticket.requester_name || ticket.requester?.name || 'Customer')
            .replace(/{agent_name}/g, auth.user.name)
            .replace(/{ticket_number}/g, ticket.ticket_number)
            .replace(/{date}/g, new Date().toLocaleDateString())
            .replace(/{time}/g, new Date().toLocaleTimeString());

        const beforeCannedResponse = replyData.content.substring(0, cannedResponseCursorPosition.start);
        const afterCannedResponse = replyData.content.substring(cannedResponseCursorPosition.end);
        const newContent = beforeCannedResponse + processedContent + afterCannedResponse;

        setReplyData('content', newContent);
        setShowCannedResponseAutocomplete(false);
        setCannedResponseSuggestions([]);
        setCannedResponseSearchTerm('');

        // Focus back to textarea and set cursor position after the canned response
        setTimeout(() => {
            textarea.focus();
            const newPosition = cannedResponseCursorPosition.start + processedContent.length;
            textarea.setSelectionRange(newPosition, newPosition);
        }, 0);

        // Track usage
        try {
            fetch(route('canned-responses.track-usage'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({
                    canned_response_id: cannedResponse.id,
                    ticket_id: ticket.id
                })
            });
        } catch (error) {
            console.error('Error tracking canned response usage:', error);
        }
    };

    const handleTextareaChange = (e) => {
        const value = e.target.value;
        setReplyData('content', value);

        const cursorPosition = e.target.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPosition);

        // Check for @ mentions
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
        // Check for / canned responses
        const cannedResponseMatch = textBeforeCursor.match(/\/(\w*)$/);

        if (mentionMatch) {
            const searchTerm = mentionMatch[1];
            setMentionSearchTerm(searchTerm);
            setMentionCursorPosition({
                start: cursorPosition - searchTerm.length - 1, // -1 for @
                end: cursorPosition
            });
            searchMentions(searchTerm);
            // Hide canned response autocomplete if mention is active
            setShowCannedResponseAutocomplete(false);
            setCannedResponseSuggestions([]);
        } else if (cannedResponseMatch) {
            const searchTerm = cannedResponseMatch[1];
            setCannedResponseSearchTerm(searchTerm);
            setCannedResponseCursorPosition({
                start: cursorPosition - searchTerm.length - 1, // -1 for /
                end: cursorPosition
            });
            searchCannedResponses(searchTerm);
            // Hide mention autocomplete if canned response is active
            setShowMentionAutocomplete(false);
            setMentionSuggestions([]);
        } else {
            // Hide both autocompletion systems
            setShowMentionAutocomplete(false);
            setMentionSuggestions([]);
            setShowCannedResponseAutocomplete(false);
            setCannedResponseSuggestions([]);
        }
    };

    const handleTextareaKeyDown = (e) => {
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
        } else if (showCannedResponseAutocomplete) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedCannedResponseIndex(prev => 
                    prev < cannedResponseSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedCannedResponseIndex(prev => 
                    prev > 0 ? prev - 1 : cannedResponseSuggestions.length - 1
                );
            } else if (e.key === 'Enter' && cannedResponseSuggestions.length > 0) {
                e.preventDefault();
                handleCannedResponseSelect(cannedResponseSuggestions[selectedCannedResponseIndex]);
            } else if (e.key === 'Escape') {
                setShowCannedResponseAutocomplete(false);
                setCannedResponseSuggestions([]);
            }
        }
    };

    const handleReplySubmit = (e) => {
        e.preventDefault();
        postReply(route('support-tickets.replies.store', ticket.id), {
            onSuccess: () => {
                resetReply();
                setShowReplyForm(false);
                setShowMentionAutocomplete(false);
                setMentionSuggestions([]);
                setShowCannedResponseAutocomplete(false);
                setCannedResponseSuggestions([]);
                reloadActivity(); // Add activity reload after reply
            }
        });
    };

    const handleStatusChange = (e) => {
        e.preventDefault();
        postStatus(route('support-tickets.status', ticket.id), {
            onSuccess: () => {
                setShowStatusModal(false);
                reloadActivity();
            }
        });
    };

    const handleAssignChange = (e) => {
        e.preventDefault();
        postAssign(route('support-tickets.update', ticket.id), {
            onSuccess: () => {
                setShowAssignModal(false);
                reloadActivity();
            }
        });
    };

    const escalateTicket = () => {
        const reason = prompt('Please provide a reason for escalation:');
        if (reason) {
            router.post(route('support-tickets.escalate', ticket.id), { reason }, {
                onSuccess: () => {
                    reloadActivity();
                }
            });
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

    const formatTimeRemaining = (date) => {
        const now = new Date();
        const dueDate = new Date(date);
        const diffInHours = Math.floor((dueDate - now) / (1000 * 60 * 60));
        
        if (diffInHours < 0) return 'Overdue';
        if (diffInHours < 1) return 'Due soon';
        if (diffInHours < 24) return `${diffInHours}h remaining`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d remaining`;
        const diffInWeeks = Math.floor(diffInDays / 7);
        if (diffInWeeks < 4) return `${diffInWeeks}w remaining`;
        return dueDate.toLocaleDateString();
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Function to process mentions in content and convert them to profile links
    const processMentionsInContent = (content) => {
        if (!content) return content;
        // Regex to match @ followed by one or more words (including spaces), stopping at line break or punctuation
        // This will match @Name, @First Last, etc.
        const mentionRegex = /@([\w][\w ]*[\w])/g;
        let lastIndex = 0;
        const elements = [];
        let match;
        while ((match = mentionRegex.exec(content)) !== null) {
            // Push text before the mention
            if (match.index > lastIndex) {
                elements.push(
                    <span key={lastIndex}>{content.slice(lastIndex, match.index)}</span>
                );
            }
            const mentionText = match[0]; // e.g., @CCS Admin
            const username = match[1]; // e.g., CCS Admin
            // Find the user by name (case-insensitive, trimmed)
            const user = users.find(u => u.name.trim().toLowerCase() === username.trim().toLowerCase());
            if (user) {
                elements.push(
                    <Link
                        key={match.index}
                        href={route('profile.show', { user: user.id })}
                        className="font-medium text-gray-900 hover:text-violet-600"
                    >
                        {mentionText}
                    </Link>
                );
            } else {
                // If not found, just render as plain text
                elements.push(
                    <span key={match.index}>{mentionText}</span>
                );
            }
            lastIndex = match.index + mentionText.length;
        }
        // Push any remaining text after the last mention
        if (lastIndex < content.length) {
            elements.push(
                <span key={lastIndex}>{content.slice(lastIndex)}</span>
            );
        }
        return elements;
    };

    const getFileIcon = (mimeType) => {
        if (mimeType?.startsWith('image/')) return '🖼️';
        if (mimeType?.startsWith('video/')) return '🎥';
        if (mimeType?.startsWith('audio/')) return '🎵';
        if (mimeType === 'application/pdf') return '📄';
        if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝';
        if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📊';
        if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return '📈';
        if (mimeType?.includes('zip') || mimeType?.includes('archive')) return '📦';
        return '📎';
    };

    const updateTicketField = (field, value) => {
        // Map frontend field names to database field names
        const fieldMapping = {
            assignee_id: 'assigned_to'
        };

        // Use the mapped field name if it exists, otherwise use the original
        const dbField = fieldMapping[field] || field;
        
        // Special handling for status changes - use the dedicated status change endpoint
        if (field === 'status_id') {
            router.post(route('support-tickets.status', ticket.id), {
                status_id: value,
                reason: ''  // Optional reason for the status change
            }, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    // Refresh the page to get updated data and reload activity
                    router.reload();
                    reloadActivity();
                },
                onError: (errors) => {
                    console.error('Error updating ticket status:', errors);
                }
            });
            return;
        }

        // For all other fields, use the regular update endpoint
        const data = {
            subject: ticket.subject,
            description: ticket.description,
            priority_id: ticket.priority_id,
            status_id: ticket.status_id,
            category_id: ticket.category_id,
            due_date: ticket.due_date,
            [dbField]: value
        };

        router.put(route('support-tickets.update', ticket.id), data, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                // Force reload to get fresh data and reload activity
                router.reload();
                reloadActivity();
            },
            onError: (errors) => {
                console.error('Error updating ticket:', errors);
            }
        });
    };

    // Close date picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setShowDatePicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Update selected date when ticket.due_date changes
    useEffect(() => {
        setSelectedDate(ticket.due_date || null);
    }, [ticket.due_date]);

    // Calendar helper functions
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const formatDateForInput = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleDateSelect = (day) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        
        // If there's an existing time, preserve it
        if (selectedDate) {
            const existingDate = new Date(selectedDate);
            newDate.setHours(existingDate.getHours(), existingDate.getMinutes());
        } else {
            // Default to end of business day
            newDate.setHours(17, 0);
        }
        
        setSelectedDate(newDate.toISOString());
        updateTicketField('due_date', newDate.toISOString());
        setShowDatePicker(false);
    };

    const handleTimeChange = (time) => {
        if (!selectedDate) return;
        
        const [hours, minutes] = time.split(':');
        const newDate = new Date(selectedDate);
        newDate.setHours(parseInt(hours), parseInt(minutes));
        
        setSelectedDate(newDate.toISOString());
        updateTicketField('due_date', newDate.toISOString());
    };

    const navigateMonth = (direction) => {
        setCurrentMonth(prev => {
            const newMonth = new Date(prev);
            newMonth.setMonth(prev.getMonth() + direction);
            return newMonth;
        });
    };

    const clearDueDate = () => {
        setSelectedDate(null);
        updateTicketField('due_date', null);
        setShowDatePicker(false);
    };

    // Debug: log users and reply for troubleshooting avatar issues
    useEffect(() => {
        if (users && replies) {
            // Only log once on mount
            // eslint-disable-next-line no-console
            console.log('SupportTicket users:', users);
            // eslint-disable-next-line no-console
            console.log('SupportTicket replies:', replies);
        }
    }, [users, replies]);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center">
                        <Link
                            href={route('support-tickets.index')}
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeftIcon className="h-4 w-4 mr-1" />
                            Back to Tickets
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Ticket #${ticket.ticket_number} - ${ticket.subject}`}>
                <style>{emailStyles}</style>
            </Head>

            <div className="py-6">
                <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Ticket Header */}
                            <div className="bg-white shadow rounded-lg p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                            #{ticket.ticket_number} - {ticket.subject}
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
                                    {ticket.raw_html ? (
                                        <div className="email-content" dangerouslySetInnerHTML={{ __html: ticket.raw_html }} />
                                    ) : (
                                        <p className="whitespace-pre-wrap">{ticket.description}</p>
                                    )}
                                </div>

                                {/* Initial Attachments */}
                                {attachments.filter(att => !att.reply_id).length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="text-sm font-medium text-gray-900 mb-3">Attachments ({attachments.filter(att => !att.reply_id).length})</h3>
                                        <div className="space-y-2">
                                            {attachments.filter(att => !att.reply_id).map((attachment) => (
                                                <div key={attachment.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <span className="text-lg mr-3">{getFileIcon(attachment.mime_type)}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                            {attachment.original_filename}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatFileSize(attachment.file_size)} • {attachment.mime_type}
                                                            {attachment.is_from_email && (
                                                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                    From Email
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={route('support-tickets.attachments.download', { ticket: ticket.id, attachment: attachment.id })}
                                                        className="text-sm text-indigo-600 hover:text-indigo-500 ml-3 p-1 rounded hover:bg-indigo-50 transition-colors"
                                                        title="Download attachment"
                                                    >
                                                        <DocumentArrowDownIcon className="h-4 w-4" />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reply Buttons and Forms */}
                            {permissions.reply && (
                                <div className="bg-white shadow rounded-lg mb-6">
                                    <div className="p-6">
                                        <div className="flex space-x-3">
                                            <PrimaryButton
                                                onClick={() => {
                                                    setReplyType('public');
                                                    setReplyData('is_internal', false);
                                                    setShowReplyForm(true);
                                                }}
                                                className="bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
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

                                        {/* Reply Forms */}
                                        {showReplyForm && (
                                            <div className="mt-6">
                                                <form onSubmit={handleReplySubmit} className="space-y-4">
                                                    <div className="flex items-center space-x-2 text-sm">
                                                        <span className="font-medium">
                                                            {replyType === 'internal' ? 'Internal Note' : 'Public Reply'}
                                                        </span>
                                                        {replyType === 'internal' && (
                                                            <span className="text-yellow-600">(Not visible to customer)</span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="relative">
                                                        <textarea
                                                            ref={textareaRef}
                                                            value={replyData.content}
                                                            onChange={handleTextareaChange}
                                                            onKeyDown={handleTextareaKeyDown}
                                                            rows={4}
                                                            className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${showMentionAutocomplete ? 'textarea-mention-active' : ''} ${showCannedResponseAutocomplete ? 'textarea-canned-response-active' : ''}`}
                                                            placeholder={replyType === 'internal' ? 'Add an internal note... (Use @ to mention users, / for canned responses)' : 'Type your reply... (Use @ to mention users, / for canned responses)'}
                                                            required
                                                        />
                                                        
                                                        {/* Mention Autocomplete */}
                                                        {showMentionAutocomplete && mentionSuggestions.length > 0 && (
                                                            <div className="mention-autocomplete">
                                                                {mentionSuggestions.map((user, index) => (
                                                                    <div
                                                                        key={user.id}
                                                                        className={`mention-suggestion ${index === selectedMentionIndex ? 'selected' : ''}`}
                                                                        onClick={() => handleMentionSelect(user)}
                                                                    >
                                                                        <span className="mention-avatar">
                                                                            <Avatar user={user} size="sm" />
                                                                        </span>
                                                                        <div>
                                                                            <div className="text-sm font-medium text-gray-900">
                                                                                {user.name}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">
                                                                                {user.email}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Canned Response Autocomplete */}
                                                        {showCannedResponseAutocomplete && cannedResponseSuggestions.length > 0 && (
                                                            <div className="canned-response-autocomplete">
                                                                {cannedResponseSuggestions.map((response, index) => (
                                                                    <div
                                                                        key={response.id}
                                                                        className={`canned-response-suggestion ${index === selectedCannedResponseIndex ? 'selected' : ''}`}
                                                                        onClick={() => handleCannedResponseSelect(response)}
                                                                    >
                                                                        <div className="flex items-start justify-between">
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                                                    {response.name}
                                                                                </div>
                                                                                <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                                                    {response.content.substring(0, 100)}...
                                                                                </div>
                                                                                <div className="flex items-center space-x-2 mt-1">
                                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                                        {response.category}
                                                                                    </span>
                                                                                    {response.usage_count > 0 && (
                                                                                        <span className="text-xs text-gray-400">
                                                                                            Used {response.usage_count} times
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <InputError message={replyErrors.content} />

                                                    <div className="flex items-center space-x-3">
                                                        <PrimaryButton 
                                                            type="submit" 
                                                            disabled={replyProcessing}
                                                            className={replyType === 'internal' ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'}
                                                        >
                                                            {replyProcessing ? 'Sending...' : (replyType === 'internal' ? 'Add Note' : 'Send Reply')}
                                                        </PrimaryButton>
                                                        <SecondaryButton
                                                            type="button"
                                                            onClick={() => {
                                                                setShowReplyForm(false);
                                                                resetReply();
                                                                setShowMentionAutocomplete(false);
                                                                setMentionSuggestions([]);
                                                                setShowCannedResponseAutocomplete(false);
                                                                setCannedResponseSuggestions([]);
                                                            }}
                                                        >
                                                            Cancel
                                                        </SecondaryButton>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Replies */}
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Communication ({replies.length})
                                    </h3>
                                    <button
                                        onClick={() => setMessagesReversed(!messagesReversed)}
                                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        {messagesReversed ? (
                                            <>
                                                <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
                                                Newest First
                                            </>
                                        ) : (
                                            <>
                                                <ArrowTrendingUpIcon className="h-4 w-4 mr-2 transform rotate-180" />
                                                Oldest First
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="divide-y divide-gray-200">
                                    {(messagesReversed ? [...replies].reverse() : replies).map((reply) => (
                                        <div key={reply.id} className={`p-6 ${reply.is_internal ? 'bg-yellow-50' : ''}`}>
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0">
                                                    {/* Use reply.user if available, fallback to users array */}
                                                    {(() => {
                                                        let authorUser = reply.user;
                                                        if (!authorUser) {
                                                            // Prefer email match, fallback to name (case-insensitive, trimmed)
                                                            authorUser = users.find(u => {
                                                                if (reply.author_email && u.email && u.email.toLowerCase() === reply.author_email?.toLowerCase()) {
                                                                    return true;
                                                                }
                                                                if (u.name && reply.author_name && u.name.trim().toLowerCase() === reply.author_name.trim().toLowerCase()) {
                                                                    return true;
                                                                }
                                                                return false;
                                                            });
                                                        }
                                                        if (authorUser) {
                                                            return (
                                                                <Link href={route('profile.show', { user: authorUser.id })} title={authorUser.name}>
                                                                    <Avatar user={authorUser} size="sm" />
                                                                </Link>
                                                            );
                                                        } else {
                                                            // fallback: initials only
                                                            return (
                                                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                                    <span className="text-sm font-medium text-gray-700">
                                                                        {reply.author_name?.charAt(0) || '?'}
                                                                    </span>
                                                                </div>
                                                            );
                                                        }
                                                    })()}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            {/* Author name as link if user found */}
                                                            {(() => {
                                                                let authorUser = reply.user;
                                                                if (!authorUser) {
                                                                    authorUser = users.find(u => {
                                                                        if (reply.author_email && u.email && u.email.toLowerCase() === reply.author_email?.toLowerCase()) {
                                                                            return true;
                                                                        }
                                                                        if (u.name && reply.author_name && u.name.trim().toLowerCase() === reply.author_name.trim().toLowerCase()) {
                                                                            return true;
                                                                        }
                                                                        return false;
                                                                    });
                                                                }
                                                                if (authorUser) {
                                                                    return (
                                                                        <Link
                                                                            href={route('profile.show', { user: authorUser.id })}
                                                                            className="text-sm font-medium text-gray-900 hover:text-violet-600"
                                                                        >
                                                                            {reply.author_name}
                                                                        </Link>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <span className="text-sm font-medium text-gray-900">
                                                                            {reply.author_name}
                                                                        </span>
                                                                    );
                                                                }
                                                            })()}
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
                                                        <div className="whitespace-pre-wrap text-sm text-gray-700">
                                                            {processMentionsInContent(reply.content)}
                                                        </div>
                                                    </div>

                                                    {/* Reply Attachments */}
                                                    {attachments.filter(att => att.reply_id === reply.id).length > 0 && (
                                                        <div className="mt-3">
                                                            <div className="text-xs font-medium text-gray-500 mb-2">
                                                                Attachments ({attachments.filter(att => att.reply_id === reply.id).length})
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {attachments.filter(att => att.reply_id === reply.id).map((attachment) => (
                                                                    <a
                                                                        key={attachment.id}
                                                                        href={route('support-tickets.attachments.download', { ticket: ticket.id, attachment: attachment.id })}
                                                                        className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-xs text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                                                                        title={`${attachment.original_filename} (${formatFileSize(attachment.file_size)})`}
                                                                    >
                                                                        <span className="mr-2">{getFileIcon(attachment.mime_type)}</span>
                                                                        <span className="truncate max-w-32">{attachment.original_filename}</span>
                                                                        <span className="ml-2 text-gray-400">({formatFileSize(attachment.file_size)})</span>
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
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Ticket Details */}
                            <div className="bg-white shadow rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Details</h3>
                                
                                <dl className="space-y-3">
                                    {/* Contact Information */}
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 flex items-center space-x-2">
                                            <UserIcon className="h-4 w-4" />
                                            <span>Contact Information</span>
                                        </dt>
                                        <dd className="mt-2">
                                            {ticket.contact ? (
                                                <div className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0">
                                                        {ticket.contact.profile_picture_url ? (
                                                            <img
                                                                src={ticket.contact.profile_picture_url}
                                                                alt={`${ticket.contact.first_name} ${ticket.contact.last_name}`}
                                                                className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                                <span className="text-sm font-medium text-gray-600">
                                                                    {ticket.contact.first_name?.[0]}{ticket.contact.last_name?.[0]}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {ticket.contact.first_name} {ticket.contact.last_name}
                                                        </div>
                                                        <div className="text-sm text-gray-500 mt-1">
                                                            <div className="flex items-center space-x-2 min-w-0">
                                                                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                                <span className="truncate" title={ticket.contact.email}>{ticket.contact.email}</span>
                                                            </div>
                                                            {ticket.contact.phone && (
                                                                <div className="flex items-center space-x-2 mt-1 min-w-0">
                                                                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                                    </svg>
                                                                    <span className="truncate" title={ticket.contact.phone}>{ticket.contact.phone}</span>
                                                                </div>
                                                            )}
                                                            {ticket.contact.company && (
                                                                <div className="flex items-center space-x-2 mt-1 min-w-0">
                                                                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                                    </svg>
                                                                    <span className="truncate" title={ticket.contact.company}>{ticket.contact.company}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
                                                    <div className="flex items-center space-x-2">
                                                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                                                        <span>No contact assigned to this ticket</span>
                                                    </div>
                                                </div>
                                            )}
                                        </dd>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                                        <dd className="mt-1">
                                            {permissions.update ? (
                                                <select
                                                    value={ticket.status_id || ''}
                                                    onChange={(e) => updateTicketField('status_id', e.target.value)}
                                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                                >
                                                    <option value="">Select Status</option>
                                                    {statuses.map((status) => (
                                                        <option key={status.id} value={status.id}>
                                                            {status.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status.name}
                                                </span>
                                            )}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Priority</dt>
                                        <dd className="mt-1">
                                            {permissions.update ? (
                                                <select
                                                    value={ticket.priority_id || ''}
                                                    onChange={(e) => updateTicketField('priority_id', e.target.value)}
                                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                                >
                                                    <option value="">Select Priority</option>
                                                    {priorities.map((priority) => (
                                                        <option key={priority.id} value={priority.id}>
                                                            {priority.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.priority.name}
                                                </span>
                                            )}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Category</dt>
                                        <dd className="mt-1">
                                            {permissions.update ? (
                                                <select
                                                    value={ticket.category_id || ''}
                                                    onChange={(e) => updateTicketField('category_id', e.target.value)}
                                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                                >
                                                    <option value="">Select Category</option>
                                                    {categories.map((category) => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-sm text-gray-900">
                                                    {ticket.category ? ticket.category.name : 'Uncategorized'}
                                                </span>
                                            )}
                                        </dd>
                                    </div>

                                    {/* Assignee */}
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Assignee</dt>
                                        <dd className="mt-1">
                                            {permissions.assign ? (
                                                <select
                                                    value={ticket.assigned_to || 'unassigned'}
                                                    onChange={(e) => {
                                                        console.log('Selected value:', e.target.value);
                                                        updateTicketField('assignee_id', e.target.value);
                                                    }}
                                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                                >
                                                    <option value="unassigned">Unassigned</option>
                                                    {users.map((user) => (
                                                        <option key={user.id} value={user.id}>
                                                            {user.name} ({user.email})
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="flex items-center space-x-2 min-w-0">
                                                    {ticket.assignee ? (
                                                        <>
                                                            <div className="flex-shrink-0">
                                                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                                    <span className="text-sm font-medium text-gray-600">
                                                                        {ticket.assignee.name.charAt(0)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {ticket.assignee.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500 truncate" title={ticket.assignee.email}>
                                                                    {ticket.assignee.email}
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm text-gray-500">Unassigned</span>
                                                    )}
                                                </div>
                                            )}
                                        </dd>
                                    </div>

                                                                        {/* Due Date */}
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 flex items-center space-x-2">
                                            <span>Due Date</span>
                                        </dt>
                                        <dd className="mt-1">
                                            {permissions.update ? (
                                                <div className="space-y-2">
                                                    <div className="relative" ref={datePickerRef}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowDatePicker(!showDatePicker)}
                                                            className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                        >
                                                            <span className={selectedDate ? 'text-gray-900' : 'text-gray-500'}>
                                                                {selectedDate ? formatDateForInput(selectedDate) : 'Select due date...'}
                                                            </span>
                                                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                                                        </button>

                                                        {/* Date Picker Dropdown */}
                                                        {showDatePicker && (
                                                            <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72">
                                                                {/* Calendar Header */}
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => navigateMonth(-1)}
                                                                        className="p-1 hover:bg-gray-100 rounded"
                                                                    >
                                                                        <ChevronLeftIcon className="h-4 w-4" />
                                                                    </button>
                                                                    <h3 className="text-sm font-semibold">
                                                                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                                    </h3>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => navigateMonth(1)}
                                                                        className="p-1 hover:bg-gray-100 rounded"
                                                                    >
                                                                        <ChevronRightIcon className="h-4 w-4" />
                                                                    </button>
                                                                </div>

                                                                {/* Calendar Grid */}
                                                                <div className="grid grid-cols-7 gap-1 mb-4">
                                                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                                                                        <div key={day} className="text-xs font-medium text-gray-500 text-center py-2">
                                                                            {day}
                                                                        </div>
                                                                    ))}
                                                                    {Array.from({ length: getFirstDayOfMonth(currentMonth) }, (_, i) => (
                                                                        <div key={`empty-${i}`} className="py-2"></div>
                                                                    ))}
                                                                    {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => {
                                                                        const day = i + 1;
                                                                        const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();
                                                                        const isSelected = selectedDate && new Date(selectedDate).toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();
                                                                        
                                                                        return (
                                                                            <button
                                                                                key={day}
                                                                                type="button"
                                                                                onClick={() => handleDateSelect(day)}
                                                                                className={`py-2 text-sm rounded hover:bg-gray-100 ${
                                                                                    isSelected
                                                                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                                                        : isToday
                                                                                        ? 'bg-indigo-100 text-indigo-600 font-semibold'
                                                                                        : 'text-gray-700'
                                                                                }`}
                                                                            >
                                                                                {day}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {/* Time Picker */}
                                                                {selectedDate && (
                                                                    <div className="border-t pt-3">
                                                                        <label className="block text-xs font-medium text-gray-700 mb-2">
                                                                            Time
                                                                        </label>
                                                                        <input
                                                                            type="time"
                                                                            value={selectedDate ? new Date(selectedDate).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '17:00'}
                                                                            onChange={(e) => handleTimeChange(e.target.value)}
                                                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                                        />
                                                                    </div>
                                                                )}

                                                                {/* Quick Presets */}
                                                                <div className="border-t pt-3 mt-3">
                                                                    <label className="block text-xs font-medium text-gray-700 mb-2">
                                                                        Quick Select
                                                                    </label>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const today = new Date();
                                                                                today.setHours(17, 0, 0, 0);
                                                                                setSelectedDate(today.toISOString());
                                                                                updateTicketField('due_date', today.toISOString());
                                                                            }}
                                                                            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                                                                        >
                                                                            Today 5PM
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const tomorrow = new Date();
                                                                                tomorrow.setDate(tomorrow.getDate() + 1);
                                                                                tomorrow.setHours(17, 0, 0, 0);
                                                                                setSelectedDate(tomorrow.toISOString());
                                                                                updateTicketField('due_date', tomorrow.toISOString());
                                                                            }}
                                                                            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                                                                        >
                                                                            Tomorrow
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const nextWeek = new Date();
                                                                                nextWeek.setDate(nextWeek.getDate() + 7);
                                                                                nextWeek.setHours(17, 0, 0, 0);
                                                                                setSelectedDate(nextWeek.toISOString());
                                                                                updateTicketField('due_date', nextWeek.toISOString());
                                                                            }}
                                                                            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                                                                        >
                                                                            Next Week
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const nextMonth = new Date();
                                                                                nextMonth.setMonth(nextMonth.getMonth() + 1);
                                                                                nextMonth.setHours(17, 0, 0, 0);
                                                                                setSelectedDate(nextMonth.toISOString());
                                                                                updateTicketField('due_date', nextMonth.toISOString());
                                                                            }}
                                                                            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                                                                        >
                                                                            Next Month
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Action Buttons */}
                                                                <div className="flex items-center justify-between pt-3 border-t mt-3">
                                                                    <button
                                                                        type="button"
                                                                        onClick={clearDueDate}
                                                                        className="text-xs text-red-600 hover:text-red-500"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                    <div className="flex space-x-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setShowDatePicker(false)}
                                                                            className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setShowDatePicker(false)}
                                                                            className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                                                        >
                                                                            Done
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {selectedDate && (
                                                        <div className="text-xs text-gray-500">
                                                            {formatTimeRemaining(selectedDate)}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-2">
                                                    {ticket.due_date ? (
                                                        <>
                                                            <ClockIcon className="h-4 w-4 text-gray-400" />
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {formatDateTime(ticket.due_date)}
                                                                </div>
                                                                <div className={`text-xs font-medium ${new Date(ticket.due_date) < new Date() ? 'text-red-600' : 'text-gray-500'}`}>
                                                                    {formatTimeRemaining(ticket.due_date)}
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm text-gray-500">No due date set</span>
                                                    )}
                                                </div>
                                            )}
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

                            {/* Actions Panel */}
                            <div className="bg-white shadow rounded-lg p-6">
                                <div className="space-y-3">
                                    {permissions.update && (
                                        <button
                                            onClick={() => setShowEditModal(true)}
                                            className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            <PencilIcon className="h-4 w-4 mr-2" />
                                            Edit Ticket
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowCannedResponseModal(true)}
                                        className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <ChatBubbleBottomCenterTextIcon className="h-4 w-4 mr-2" />
                                        Manage Canned Responses
                                    </button>
                                    {permissions.delete && (
                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
                                                    router.delete(route('support-tickets.destroy', ticket.id), {
                                                        onSuccess: () => {
                                                            router.visit(route('support-tickets.index'));
                                                        },
                                                    });
                                                }
                                            }}
                                            className="w-full inline-flex items-center justify-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            <TrashIcon className="h-4 w-4 mr-2" />
                                            Delete Ticket
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Activity Log */}
                            {ticket.activity_logs && ticket.activity_logs.length > 0 && (
                                <div key={activityKey} className="bg-white shadow rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            Activity ({ticket.activity_logs.length})
                                        </h3>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setActivitiesReversed(!activitiesReversed)}
                                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                title={activitiesReversed ? "Newest First" : "Oldest First"}
                                            >
                                                <ArrowTrendingUpIcon className={`h-4 w-4 ${!activitiesReversed ? 'transform rotate-180' : ''}`} />
                                            </button>
                                            <button
                                                onClick={() => setIsActivityCollapsed(!isActivityCollapsed)}
                                                className="inline-flex items-center px-2 py-1 text-sm text-gray-600 hover:text-gray-900"
                                            >
                                                {isActivityCollapsed ? (
                                                    <>
                                                        <ChevronRightIcon className="h-5 w-5" />
                                                        <span className="ml-1">Show All</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDownIcon className="h-5 w-5" />
                                                        <span className="ml-1">Collapse</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div className={`flow-root transition-all duration-200 ease-in-out ${isActivityCollapsed ? 'h-0 overflow-hidden' : ''}`}>
                                        <ul className="-mb-8">
                                            {(activitiesReversed ? [...ticket.activity_logs].reverse() : ticket.activity_logs).map((log, index, array) => (
                                                <li key={log.id}>
                                                    <div className="relative pb-8">
                                                        {index !== array.length - 1 && (
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
                                                                        {log.user ? (
                                                                            <Link
                                                                                href={route('profile.show', { user: log.user.id })}
                                                                                className="font-medium text-gray-900 hover:text-violet-600"
                                                                            >
                                                                                {log.user.name}
                                                                            </Link>
                                                                        ) : (
                                                                            <span className="font-medium text-gray-900">System</span>
                                                                        )}
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

            {/* Canned Response Modal */}
            <CannedResponseModal
                show={showCannedResponseModal}
                onClose={() => setShowCannedResponseModal(false)}
            />

            {/* Edit Ticket Modal */}
            <EditTicketModal
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                ticket={ticket}
                priorities={priorities}
                categories={categories}
                statuses={statuses}
                users={users}
            />
        </AuthenticatedLayout>
    );
} 