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
        Schema::table('support_ticket_activity_logs', function (Blueprint $table) {
            // Drop existing foreign key constraints
            $table->dropForeign(['user_id']);
            
            // Modify existing columns
            $table->renameColumn('event_type', 'action_type');
            $table->foreignId('user_id')->nullable()->change();
            
            // Add new columns
            $table->boolean('is_system_action')->default(false)->after('user_agent');
            $table->boolean('is_visible_to_customer')->default(true)->after('is_system_action');
            $table->json('metadata')->nullable()->after('new_values');

            // Add new foreign key with nullOnDelete
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('support_ticket_activity_logs', function (Blueprint $table) {
            // Drop new columns
            $table->dropColumn(['is_system_action', 'is_visible_to_customer', 'metadata']);
            
            // Revert column changes
            $table->renameColumn('action_type', 'event_type');
            
            // Drop and recreate foreign key
            $table->dropForeign(['user_id']);
            $table->foreignId('user_id')->change();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('restrict');
        });
    }
}; 