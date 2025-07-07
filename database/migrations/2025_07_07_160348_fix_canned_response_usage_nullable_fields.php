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
        Schema::table('canned_response_usage', function (Blueprint $table) {
            // Make ticket_id and reply_id nullable
            $table->foreignId('ticket_id')->nullable()->change();
            $table->foreignId('reply_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('canned_response_usage', function (Blueprint $table) {
            // Revert ticket_id and reply_id to be non-nullable
            $table->foreignId('ticket_id')->nullable(false)->change();
            $table->foreignId('reply_id')->nullable(false)->change();
        });
    }
};
