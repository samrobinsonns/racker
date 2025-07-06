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
        Schema::create('canned_response_usage', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->index();
            $table->foreignId('canned_response_id')->constrained('canned_responses')->onDelete('cascade');
            $table->foreignId('ticket_id')->constrained('support_tickets')->onDelete('cascade');
            $table->foreignId('reply_id')->constrained('support_ticket_replies')->onDelete('cascade');
            $table->foreignId('used_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            // Indexes for performance
            $table->index(['tenant_id', 'canned_response_id']);
            $table->index(['tenant_id', 'used_by']);
            $table->index(['ticket_id']);
            $table->index(['reply_id']);
            $table->index('created_at');

            // Foreign key for tenant
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('canned_response_usage');
    }
};
