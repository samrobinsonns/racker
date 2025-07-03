<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Services\SupportTickets\ReplyService;
use App\Services\SupportTickets\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SupportTicketReplyController extends Controller
{
    protected ReplyService $replyService;
    protected NotificationService $notificationService;

    public function __construct(ReplyService $replyService, NotificationService $notificationService)
    {
        $this->replyService = $replyService;
        $this->notificationService = $notificationService;
    }

    /**
     * Get replies for a ticket
     */
    public function index(SupportTicket $ticket)
    {
        $this->authorize('view', $ticket);

        try {
            $replies = $this->replyService->getTicketReplies($ticket);

            return response()->json([
                'success' => true,
                'replies' => $replies,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch replies: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new reply
     */
    public function store(Request $request, SupportTicket $ticket)
    {
        $this->authorize('reply', $ticket);

        $validatedData = $request->validate([
            'content' => 'required|string',
            'is_internal' => 'boolean',
            'attachments.*' => 'nullable|file|max:10240', // 10MB max per file
        ]);

        try {
            $reply = $this->replyService->createReply(
                $ticket,
                $validatedData,
                Auth::id()
            );

            // Send notifications
            $this->notificationService->notifyReplyAdded($reply);

            return response()->json([
                'success' => true,
                'message' => 'Reply added successfully!',
                'reply' => $reply,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create reply: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Update a reply
     */
    public function update(Request $request, SupportTicket $ticket, SupportTicketReply $reply)
    {
        $this->authorize('update', $reply);

        $validatedData = $request->validate([
            'content' => 'required|string',
            'is_internal' => 'boolean',
        ]);

        try {
            $reply = $this->replyService->updateReply($reply, $validatedData);

            return response()->json([
                'success' => true,
                'message' => 'Reply updated successfully!',
                'reply' => $reply,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update reply: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Delete a reply
     */
    public function destroy(SupportTicket $ticket, SupportTicketReply $reply)
    {
        $this->authorize('delete', $reply);

        try {
            $this->replyService->deleteReply($reply);

            return response()->json([
                'success' => true,
                'message' => 'Reply deleted successfully!',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete reply: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Create an internal note
     */
    public function storeInternalNote(Request $request, SupportTicket $ticket)
    {
        $this->authorize('createInternalNote', $ticket);

        $validatedData = $request->validate([
            'content' => 'required|string',
            'attachments.*' => 'nullable|file|max:10240', // 10MB max per file
        ]);

        try {
            $reply = $this->replyService->createInternalNote(
                $ticket,
                $validatedData['content'],
                Auth::id()
            );

            // Send notifications
            $this->notificationService->notifyReplyAdded($reply);

            return response()->json([
                'success' => true,
                'message' => 'Internal note added successfully!',
                'reply' => $reply,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create internal note: ' . $e->getMessage(),
            ], 422);
        }
    }
} 