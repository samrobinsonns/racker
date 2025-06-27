<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SupportTicketAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'reply_id',
        'uploaded_by',
        'original_filename',
        'stored_filename',
        'file_path',
        'mime_type',
        'file_size',
        'file_hash',
        'is_from_email',
        'microsoft365_attachment_id',
        'is_public',
        'virus_scan_passed',
        'virus_scanned_at',
        'metadata',
    ];

    protected $casts = [
        'is_from_email' => 'boolean',
        'is_public' => 'boolean',
        'virus_scan_passed' => 'boolean',
        'virus_scanned_at' => 'datetime',
        'metadata' => 'array',
        'file_size' => 'integer',
    ];

    /**
     * Get the ticket this attachment belongs to
     */
    public function ticket()
    {
        return $this->belongsTo(SupportTicket::class, 'ticket_id');
    }

    /**
     * Get the reply this attachment belongs to (if any)
     */
    public function reply()
    {
        return $this->belongsTo(SupportTicketReply::class, 'reply_id');
    }

    /**
     * Get the user who uploaded this attachment
     */
    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Scope to get public attachments (visible to customers)
     */
    public function scopePublic(Builder $query): Builder
    {
        return $query->where('is_public', true);
    }

    /**
     * Scope to get attachments from email
     */
    public function scopeFromEmail(Builder $query): Builder
    {
        return $query->where('is_from_email', true);
    }

    /**
     * Scope to get attachments that passed virus scan
     */
    public function scopeVirusFree(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->where('virus_scan_passed', true)
              ->orWhereNull('virus_scan_passed');
        });
    }

    /**
     * Check if attachment is an image
     */
    public function isImage(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    /**
     * Check if attachment is a PDF
     */
    public function isPdf(): bool
    {
        return $this->mime_type === 'application/pdf';
    }

    /**
     * Check if attachment is a document
     */
    public function isDocument(): bool
    {
        $documentTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv',
        ];

        return in_array($this->mime_type, $documentTypes);
    }

    /**
     * Get the file extension
     */
    public function getExtensionAttribute(): string
    {
        return pathinfo($this->original_filename, PATHINFO_EXTENSION);
    }

    /**
     * Get human-readable file size
     */
    public function getFileSizeHumanAttribute(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Get the icon class for this file type
     */
    public function getIconClassAttribute(): string
    {
        if ($this->isImage()) {
            return 'heroicon-o-photo';
        }

        if ($this->isPdf()) {
            return 'heroicon-o-document-text';
        }

        if ($this->isDocument()) {
            return 'heroicon-o-document';
        }

        return match(true) {
            str_contains($this->mime_type, 'zip') || str_contains($this->mime_type, 'archive') => 'heroicon-o-archive-box',
            str_contains($this->mime_type, 'video') => 'heroicon-o-video-camera',
            str_contains($this->mime_type, 'audio') => 'heroicon-o-musical-note',
            default => 'heroicon-o-document'
        };
    }

    /**
     * Get the download URL for this attachment
     */
    public function getDownloadUrlAttribute(): string
    {
        return route('support-tickets.attachments.download', [
            'ticket' => $this->ticket_id,
            'attachment' => $this->id
        ]);
    }

    /**
     * Check if the file exists in storage
     */
    public function fileExists(): bool
    {
        return Storage::exists($this->file_path);
    }

    /**
     * Get the file contents
     */
    public function getFileContents(): ?string
    {
        if (!$this->fileExists()) {
            return null;
        }

        return Storage::get($this->file_path);
    }

    /**
     * Delete the file from storage
     */
    public function deleteFile(): bool
    {
        if ($this->fileExists()) {
            return Storage::delete($this->file_path);
        }

        return true;
    }

    /**
     * Boot method to handle file deletion
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($attachment) {
            $attachment->deleteFile();
        });
    }

    /**
     * Generate a unique filename for storage
     */
    public static function generateStorageFilename(string $originalFilename): string
    {
        $extension = pathinfo($originalFilename, PATHINFO_EXTENSION);
        $timestamp = now()->format('Y/m/d');
        $hash = Str::random(40);
        
        return "support-tickets/{$timestamp}/{$hash}.{$extension}";
    }

    /**
     * Check if file type is allowed
     */
    public static function isAllowedFileType(string $mimeType): bool
    {
        $allowedTypes = config('support-tickets.allowed_attachment_types', [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/svg+xml',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv',
            'application/zip',
        ]);

        return in_array($mimeType, $allowedTypes);
    }

    /**
     * Check if file size is within limits
     */
    public static function isAllowedFileSize(int $fileSize): bool
    {
        $maxSize = config('support-tickets.max_attachment_size', 10 * 1024 * 1024); // 10MB default
        return $fileSize <= $maxSize;
    }
}
