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
            // Drop the old filename column since we now use original_filename and stored_filename
            $table->dropColumn('filename');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('support_ticket_attachments', function (Blueprint $table) {
            // Re-add the filename column
            $table->string('filename')->after('reply_id');
        });
    }
};
