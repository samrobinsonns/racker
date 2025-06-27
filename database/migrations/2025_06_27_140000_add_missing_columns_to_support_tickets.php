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
        Schema::table('support_tickets', function (Blueprint $table) {
            // Additional requester information (separate from created_by)
            $table->string('requester_email')->nullable()->after('created_by');
            $table->string('requester_name')->nullable()->after('requester_email');
            
            // Additional metadata fields
            $table->string('channel')->nullable()->after('source');
            $table->json('custom_fields')->nullable()->after('channel');
            $table->json('tags')->nullable()->after('custom_fields');
            
            // Response tracking
            $table->timestamp('first_response_at')->nullable()->after('tags');
            $table->timestamp('last_response_at')->nullable()->after('first_response_at');
            $table->timestamp('resolved_at')->nullable()->after('last_response_at');
            $table->integer('response_time_minutes')->nullable()->after('resolved_at');
            $table->integer('resolution_time_minutes')->nullable()->after('response_time_minutes');
            
            // Customer satisfaction
            $table->integer('customer_satisfaction_rating')->nullable()->after('resolution_time_minutes');
            $table->text('customer_satisfaction_comment')->nullable()->after('customer_satisfaction_rating');
            
            // Microsoft 365 integration
            $table->string('microsoft365_message_id')->nullable()->after('customer_satisfaction_comment');
            $table->string('microsoft365_thread_id')->nullable()->after('microsoft365_message_id');
            $table->json('email_headers')->nullable()->after('microsoft365_thread_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropColumn([
                'requester_email',
                'requester_name',
                'channel',
                'custom_fields',
                'tags',
                'first_response_at',
                'last_response_at',
                'resolved_at',
                'response_time_minutes',
                'resolution_time_minutes',
                'customer_satisfaction_rating',
                'customer_satisfaction_comment',
                'microsoft365_message_id',
                'microsoft365_thread_id',
                'email_headers'
            ]);
        });
    }
}; 