<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportTicketAttachment;
use App\Services\SupportTickets\AttachmentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SupportTicketAttachmentController extends Controller
{
    protected AttachmentService $attachmentService;

    public function __construct(AttachmentService $attachmentService)
    {
        $this->attachmentService = $attachmentService;
    }

    /**
     * Upload attachments for a ticket or reply
     */
    public function store(Request $request, SupportTicket $ticket)
    {
        $this->authorize('attachFiles', $ticket);

        $request->validate([
            'attachments' => 'required|array',
            'attachments.*' => 'required|file|max:10240', // 10MB max per file
            'reply_id' => 'nullable|exists:support_ticket_replies,id',
            'is_public' => 'boolean',
        ]);

        try {
            $attachments = $this->attachmentService->uploadAttachment(
                $ticket,
                $request->file('attachments'),
                Auth::id(),
                $request->reply_id,
                $request->boolean('is_public', true)
            );

            return response()->json([
                'success' => true,
                'message' => 'Attachments uploaded successfully!',
                'attachments' => $attachments,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload attachments: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Download an attachment
     */
    public function show(SupportTicket $ticket, SupportTicketAttachment $attachment)
    {
        $this->authorize('view', $attachment);

        try {
            return $this->attachmentService->downloadAttachment($attachment);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to download attachment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete an attachment
     */
    public function destroy(SupportTicket $ticket, SupportTicketAttachment $attachment)
    {
        $this->authorize('delete', $attachment);

        try {
            $this->attachmentService->deleteAttachment($attachment);

            return response()->json([
                'success' => true,
                'message' => 'Attachment deleted successfully!',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete attachment: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get all attachments for a ticket
     */
    public function index(SupportTicket $ticket)
    {
        $this->authorize('view', $ticket);

        try {
            $attachments = $ticket->attachments()
                ->with(['user'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'attachments' => $attachments,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch attachments: ' . $e->getMessage(),
            ], 500);
        }
    }
} 