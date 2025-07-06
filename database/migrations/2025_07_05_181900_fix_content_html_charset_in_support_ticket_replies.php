<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix charset for content_html column to support UTF-8 characters like ©
        DB::statement('ALTER TABLE support_ticket_replies MODIFY content_html LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        
        // Also fix the content column to be safe
        DB::statement('ALTER TABLE support_ticket_replies MODIFY content LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original charset if needed
        DB::statement('ALTER TABLE support_ticket_replies MODIFY content_html LONGTEXT CHARACTER SET utf8 COLLATE utf8_unicode_ci');
        DB::statement('ALTER TABLE support_ticket_replies MODIFY content LONGTEXT CHARACTER SET utf8 COLLATE utf8_unicode_ci');
    }
}; 