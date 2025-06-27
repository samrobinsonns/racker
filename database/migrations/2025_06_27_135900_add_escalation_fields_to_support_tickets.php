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
            $table->timestamp('escalated_at')->nullable()->after('closed_at');
            $table->string('escalation_reason')->nullable()->after('escalated_at');
            $table->foreignId('escalated_by')->nullable()->after('escalation_reason')->constrained('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropForeign(['escalated_by']);
            $table->dropColumn(['escalated_at', 'escalation_reason', 'escalated_by']);
        });
    }
}; 