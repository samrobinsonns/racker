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
            // Drop the existing foreign key
            $table->dropForeign(['created_by']);
            
            // Make created_by nullable and add back the foreign key with nullOnDelete
            $table->foreignId('created_by')->nullable()->change();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('support_ticket_replies', function (Blueprint $table) {
            // Drop the foreign key
            $table->dropForeign(['created_by']);
            
            // Make created_by required again and add back the original foreign key
            $table->foreignId('created_by')->change();
            $table->foreign('created_by')->references('id')->on('users')->onDelete('restrict');
        });
    }
}; 