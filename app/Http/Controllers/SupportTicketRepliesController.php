<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Services\SupportTickets\ReplyService;
use App\Services\SupportTickets\AttachmentService;
use App\Services\SupportTickets\NotificationService;
use App\Services\MentionService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class SupportTicketRepliesController extends Controller
{
    public function __construct(
        private ReplyService $replyService,
        private AttachmentService $attachmentService,
        private NotificationService $notificationService,
        private MentionService $mentionService
    ) {
        $this->middleware(['auth', 'verified']);
    }

    /**
     * Store a new reply
     */
    public function store(Request $request, SupportTicket $supportTicket): RedirectResponse
    {
        Gate::authorize('reply', $supportTicket);

        $validated = $request->validate([
            'content' => 'required|string',
            'is_internal' => 'boolean',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240', // 10MB max
        ]);

        $userId = auth()->id();

        // Create reply
        $reply = $this->replyService->createReply($supportTicket, $validated, $userId);

        // Handle file attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $this->attachmentService->uploadAttachment(
                    $supportTicket, 
                    $file, 
                    $userId, 
                    $reply->id,
                    !$validated['is_internal'] // Public attachment unless internal note
                );
            }
        }

        // Process mentions
        $this->mentionService->processMentions($reply, $validated['content'], $userId);

        // Send notifications
        $this->notificationService->notifyReplyAdded($reply);

        return back()->with('success', $validated['is_internal'] ? 'Internal note added successfully.' : 'Reply sent successfully.');
    }

    /**
     * Update a reply
     */
    public function update(Request $request, SupportTicketReply $supportTicketReply): RedirectResponse
    {
        Gate::authorize('update', $supportTicketReply);

        $validated = $request->validate([
            'content' => 'required|string',
            'is_internal' => 'boolean',
        ]);

        $this->replyService->updateReply($supportTicketReply, $validated, auth()->id());

        return back()->with('success', 'Reply updated successfully.');
    }

    /**
     * Delete a reply
     */
    public function destroy(SupportTicketReply $supportTicketReply): RedirectResponse
    {
        Gate::authorize('delete', $supportTicketReply);

        $this->replyService->deleteReply($supportTicketReply, auth()->id());

        return back()->with('success', 'Reply deleted successfully.');
    }
} 