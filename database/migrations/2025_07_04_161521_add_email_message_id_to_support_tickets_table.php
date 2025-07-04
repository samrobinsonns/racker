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
            $table->string('email_message_id')->nullable()->after('microsoft365_thread_id');
            
            // Add index for performance when searching by email_message_id
            $table->index(['tenant_id', 'email_message_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'email_message_id']);
            $table->dropColumn('email_message_id');
        });
    }
};
