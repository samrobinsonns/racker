<?php

namespace App\Services\SupportTickets;

use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Models\SupportTicketAttachment;
use App\Models\SupportTicketActivityLog;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AttachmentService
{
    /**
     * Upload an attachment to a ticket
     */
    public function uploadAttachment(
        SupportTicket $ticket, 
        UploadedFile $file, 
        ?int $userId = null, 
        ?int $replyId = null,
        bool $isPublic = true
    ): SupportTicketAttachment {
        // Validate file
        $this->validateFile($file);

        // Generate storage path
        $storagePath = $this->generateStoragePath($file);
        
        // Store the file
        $path = $file->storeAs(dirname($storagePath), basename($storagePath), 'local');

        // Calculate file hash
        $fileHash = hash_file('sha256', $file->getPathname());

        // Create attachment record
        $attachment = SupportTicketAttachment::create([
            'ticket_id' => $ticket->id,
            'reply_id' => $replyId,
            'uploaded_by' => $userId,
            'original_filename' => $file->getClientOriginalName(),
            'stored_filename' => basename($storagePath),
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'file_hash' => $fileHash,
            'is_from_email' => false,
            'is_public' => $isPublic,
        ]);

        // Log the attachment
        if ($userId) {
            SupportTicketActivityLog::create([
                'ticket_id' => $ticket->id,
                'user_id' => $userId,
                'action_type' => 'attachment_added',
                'description' => "File attached: {$file->getClientOriginalName()}",
                'metadata' => [
                    'attachment_id' => $attachment->id,
                    'filename' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        }

        return $attachment;
    }

    /**
     * Create attachment from email
     */
    public function createEmailAttachment(
        SupportTicket $ticket,
        array $attachmentData,
        ?int $replyId = null
    ): SupportTicketAttachment {
        // Generate storage path
        $extension = pathinfo($attachmentData['filename'], PATHINFO_EXTENSION);
        $storagePath = $this->generateStoragePathFromData($attachmentData['filename']);

        // Store the file content
        Storage::put($storagePath, $attachmentData['content']);

        // Calculate file hash
        $fileHash = hash('sha256', $attachmentData['content']);

        return SupportTicketAttachment::create([
            'ticket_id' => $ticket->id,
            'reply_id' => $replyId,
            'uploaded_by' => null,
            'original_filename' => $attachmentData['filename'],
            'stored_filename' => basename($storagePath),
            'file_path' => $storagePath,
            'mime_type' => $attachmentData['mime_type'] ?? 'application/octet-stream',
            'file_size' => strlen($attachmentData['content']),
            'file_hash' => $fileHash,
            'is_from_email' => true,
            'microsoft365_attachment_id' => $attachmentData['attachment_id'] ?? null,
            'is_public' => true,
        ]);
    }

    /**
     * Download an attachment
     */
    public function downloadAttachment(SupportTicketAttachment $attachment, User $user): ?\Symfony\Component\HttpFoundation\StreamedResponse
    {
        // Check permissions
        if (!$this->canDownloadAttachment($attachment, $user)) {
            return null;
        }

        // Check if file exists
        if (!$attachment->fileExists()) {
            return null;
        }

        // Check virus scan
        if ($attachment->virus_scan_passed === false) {
            return null;
        }

        return Storage::download(
            $attachment->file_path,
            $attachment->original_filename,
            ['Content-Type' => $attachment->mime_type]
        );
    }

    /**
     * Delete an attachment
     */
    public function deleteAttachment(SupportTicketAttachment $attachment, ?int $userId = null): bool
    {
        $ticket = $attachment->ticket;
        $filename = $attachment->original_filename;

        // Delete the attachment record (file will be deleted via model event)
        $deleted = $attachment->delete();

        if ($deleted && $userId) {
            // Log the deletion
            SupportTicketActivityLog::create([
                'ticket_id' => $ticket->id,
                'user_id' => $userId,
                'action_type' => 'attachment_removed',
                'description' => "File removed: {$filename}",
                'metadata' => [
                    'filename' => $filename,
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        }

        return $deleted;
    }

    /**
     * Get attachments for a ticket
     */
    public function getTicketAttachments(SupportTicket $ticket, bool $publicOnly = false): \Illuminate\Support\Collection
    {
        $query = $ticket->attachments()->with(['uploader', 'reply']);

        if ($publicOnly) {
            $query->public();
        }

        return $query->orderBy('created_at')->get();
    }

    /**
     * Get attachments for a reply
     */
    public function getReplyAttachments(SupportTicketReply $reply): \Illuminate\Support\Collection
    {
        return $reply->attachments()->with('uploader')->orderBy('created_at')->get();
    }

    /**
     * Validate uploaded file
     */
    private function validateFile(UploadedFile $file): void
    {
        // Check file type
        if (!SupportTicketAttachment::isAllowedFileType($file->getMimeType())) {
            throw new \InvalidArgumentException('File type not allowed: ' . $file->getMimeType());
        }

        // Check file size
        if (!SupportTicketAttachment::isAllowedFileSize($file->getSize())) {
            $maxSize = config('support-tickets.max_attachment_size', 10 * 1024 * 1024);
            throw new \InvalidArgumentException('File size exceeds limit: ' . number_format($maxSize / 1024 / 1024, 1) . 'MB');
        }

        // Additional security checks
        $this->performSecurityChecks($file);
    }

    /**
     * Perform security checks on uploaded file
     */
    private function performSecurityChecks(UploadedFile $file): void
    {
        $filename = $file->getClientOriginalName();
        $extension = strtolower($file->getClientOriginalExtension());

        // Check for dangerous file extensions
        $dangerousExtensions = [
            'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
            'php', 'php3', 'php4', 'php5', 'phtml', 'asp', 'aspx', 'jsp'
        ];

        if (in_array($extension, $dangerousExtensions)) {
            throw new \InvalidArgumentException('File type not allowed for security reasons');
        }

        // Check for double extensions
        if (substr_count($filename, '.') > 1) {
            $parts = explode('.', $filename);
            if (count($parts) > 2) {
                $secondLastExtension = strtolower($parts[count($parts) - 2]);
                if (in_array($secondLastExtension, $dangerousExtensions)) {
                    throw new \InvalidArgumentException('File with multiple extensions not allowed');
                }
            }
        }

        // Check file signature vs declared mime type
        $this->validateFileSignature($file);
    }

    /**
     * Validate file signature matches declared mime type
     */
    private function validateFileSignature(UploadedFile $file): void
    {
        $handle = fopen($file->getPathname(), 'rb');
        $bytes = fread($handle, 8);
        fclose($handle);

        $declaredType = $file->getMimeType();
        $signatures = [
            'image/jpeg' => ["\xFF\xD8\xFF"],
            'image/png' => ["\x89\x50\x4E\x47\x0D\x0A\x1A\x0A"],
            'image/gif' => ["\x47\x49\x46\x38\x37\x61", "\x47\x49\x46\x38\x39\x61"],
            'application/pdf' => ["\x25\x50\x44\x46"],
            'application/zip' => ["\x50\x4B\x03\x04", "\x50\x4B\x05\x06", "\x50\x4B\x07\x08"],
        ];

        if (isset($signatures[$declaredType])) {
            $validSignature = false;
            foreach ($signatures[$declaredType] as $signature) {
                if (strpos($bytes, $signature) === 0) {
                    $validSignature = true;
                    break;
                }
            }

            if (!$validSignature) {
                throw new \InvalidArgumentException('File signature does not match declared type');
            }
        }
    }

    /**
     * Generate storage path for uploaded file
     */
    private function generateStoragePath(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $timestamp = now()->format('Y/m/d');
        $hash = Str::random(40);
        
        return "support-tickets/{$timestamp}/{$hash}.{$extension}";
    }

    /**
     * Generate storage path from file data
     */
    private function generateStoragePathFromData(string $filename): string
    {
        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        $timestamp = now()->format('Y/m/d');
        $hash = Str::random(40);
        
        return "support-tickets/{$timestamp}/{$hash}.{$extension}";
    }

    /**
     * Check if user can download attachment
     */
    private function canDownloadAttachment(SupportTicketAttachment $attachment, User $user): bool
    {
        $ticket = $attachment->ticket;

        // Central admins can download everything
        if ($user->is_central_admin) {
            return true;
        }

        // Check tenant access
        if ($user->tenant_id !== $ticket->tenant_id) {
            return false;
        }

        // Non-public attachments require special permissions
        if (!$attachment->is_public) {
            return $user->hasAnyPermission([
                'view_support_tickets',
                'manage_support_tickets'
            ]);
        }

        // Check if user has access to the ticket
        return $this->canAccessTicket($ticket, $user);
    }

    /**
     * Check if user can access ticket
     */
    private function canAccessTicket(SupportTicket $ticket, User $user): bool
    {
        // User is the requester
        if ($ticket->requester_id === $user->id) {
            return true;
        }

        // User is assigned to the ticket
        if ($ticket->assignee_id === $user->id) {
            return true;
        }

        // User has support ticket permissions
        return $user->hasAnyPermission([
            'view_support_tickets',
            'manage_support_tickets'
        ]);
    }

    /**
     * Get attachment statistics for a ticket
     */
    public function getAttachmentStats(SupportTicket $ticket): array
    {
        $attachments = $ticket->attachments;

        return [
            'total_attachments' => $attachments->count(),
            'total_size' => $attachments->sum('file_size'),
            'public_attachments' => $attachments->where('is_public', true)->count(),
            'private_attachments' => $attachments->where('is_public', false)->count(),
            'email_attachments' => $attachments->where('is_from_email', true)->count(),
            'uploaded_attachments' => $attachments->where('is_from_email', false)->count(),
            'by_type' => $this->getAttachmentsByType($attachments),
        ];
    }

    /**
     * Get attachments grouped by type
     */
    private function getAttachmentsByType(\Illuminate\Support\Collection $attachments): array
    {
        $types = [];

        foreach ($attachments as $attachment) {
            $type = $this->getFileTypeCategory($attachment->mime_type);
            $types[$type] = ($types[$type] ?? 0) + 1;
        }

        return $types;
    }

    /**
     * Get file type category
     */
    private function getFileTypeCategory(string $mimeType): string
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'Images';
        }

        if ($mimeType === 'application/pdf') {
            return 'PDF';
        }

        if (str_contains($mimeType, 'word') || str_contains($mimeType, 'document')) {
            return 'Documents';
        }

        if (str_contains($mimeType, 'sheet') || str_contains($mimeType, 'excel')) {
            return 'Spreadsheets';
        }

        if (str_contains($mimeType, 'zip') || str_contains($mimeType, 'archive')) {
            return 'Archives';
        }

        return 'Other';
    }
} 