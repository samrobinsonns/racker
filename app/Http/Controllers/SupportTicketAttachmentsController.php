<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use App\Models\SupportTicketAttachment;
use App\Services\SupportTickets\AttachmentService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SupportTicketAttachmentsController extends Controller
{
    public function __construct(
        private AttachmentService $attachmentService
    ) {
        $this->middleware(['auth', 'verified']);
    }

    /**
     * Upload attachment to ticket
     */
    public function store(Request $request, SupportTicket $supportTicket): RedirectResponse
    {
        Gate::authorize('view', $supportTicket);

        $validated = $request->validate([
            'attachments' => 'required|array',
            'attachments.*' => 'file|max:10240', // 10MB max
            'is_public' => 'boolean',
        ]);

        $userId = auth()->id();
        $isPublic = $validated['is_public'] ?? true;

        $uploadedCount = 0;
        foreach ($request->file('attachments') as $file) {
            try {
                $this->attachmentService->uploadAttachment($supportTicket, $file, $userId, null, $isPublic);
                $uploadedCount++;
            } catch (\Exception $e) {
                return back()->with('error', 'Failed to upload file: ' . $file->getClientOriginalName() . '. ' . $e->getMessage());
            }
        }

        return back()->with('success', "Successfully uploaded {$uploadedCount} file(s).");
    }

    /**
     * Download attachment
     */
    public function download(SupportTicket $ticket, SupportTicketAttachment $attachment): StreamedResponse|RedirectResponse
    {
        $response = $this->attachmentService->downloadAttachment($attachment, auth()->user());
        
        if (!$response) {
            return back()->with('error', 'File not found or access denied.');
        }

        return $response;
    }

    /**
     * Delete attachment
     */
    public function destroy(SupportTicketAttachment $supportTicketAttachment): RedirectResponse
    {
        Gate::authorize('delete', $supportTicketAttachment);

        $success = $this->attachmentService->deleteAttachment($supportTicketAttachment, auth()->id());

        if ($success) {
            return back()->with('success', 'Attachment deleted successfully.');
        }

        return back()->with('error', 'Failed to delete attachment.');
    }
} 