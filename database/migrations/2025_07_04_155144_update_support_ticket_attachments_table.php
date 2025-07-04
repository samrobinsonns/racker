<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('support_ticket_attachments', function (Blueprint $table) {
            // Add missing columns that AttachmentService expects
            $table->string('stored_filename')->nullable()->after('original_filename');
            $table->string('file_hash')->nullable()->after('file_size');
            $table->boolean('is_from_email')->default(false)->after('file_hash');
            $table->boolean('is_public')->default(true)->after('is_from_email');
            $table->string('microsoft365_attachment_id')->nullable()->after('is_public');
            
            // Make uploaded_by nullable (for email attachments)
            $table->foreignId('uploaded_by')->nullable()->change();
            
            // Rename storage_path to file_path to match AttachmentService
            $table->renameColumn('storage_path', 'file_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('support_ticket_attachments', function (Blueprint $table) {
            // Drop added columns
            $table->dropColumn([
                'stored_filename',
                'file_hash',
                'is_from_email',
                'is_public',
                'microsoft365_attachment_id'
            ]);
            
            // Revert uploaded_by to not nullable
            $table->foreignId('uploaded_by')->nullable(false)->change();
            
            // Rename file_path back to storage_path
            $table->renameColumn('file_path', 'storage_path');
        });
    }
};
