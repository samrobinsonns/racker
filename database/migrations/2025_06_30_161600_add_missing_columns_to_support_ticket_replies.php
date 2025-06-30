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
        Schema::table('support_ticket_replies', function (Blueprint $table) {
            // Add author information
            $table->string('author_email')->nullable()->after('content');
            $table->string('author_name')->nullable()->after('author_email');
            
            // Add reply metadata
            $table->string('reply_type')->default('agent')->after('author_name'); // agent, customer, system
            $table->boolean('is_via_email')->default(false)->after('reply_type');
            
            // Add email-specific fields
            $table->string('microsoft365_message_id')->nullable()->after('is_via_email');
            $table->json('email_headers')->nullable()->after('microsoft365_message_id');
            $table->timestamp('email_received_at')->nullable()->after('email_headers');
            $table->json('email_metadata')->nullable()->after('email_received_at');
            
            // Add content type field
            $table->text('content_html')->nullable()->after('content');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('support_ticket_replies', function (Blueprint $table) {
            $table->dropColumn([
                'author_email',
                'author_name',
                'reply_type',
                'is_via_email',
                'microsoft365_message_id',
                'email_headers',
                'email_received_at',
                'email_metadata',
                'content_html'
            ]);
        });
    }
}; 