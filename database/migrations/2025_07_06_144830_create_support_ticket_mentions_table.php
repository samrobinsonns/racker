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
        Schema::create('support_ticket_mentions', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->index();
            $table->foreignId('ticket_id')->constrained('support_tickets')->onDelete('cascade');
            $table->foreignId('reply_id')->constrained('support_ticket_replies')->onDelete('cascade');
            $table->foreignId('mentioned_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('mentioned_by_user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            // Indexes for performance
            $table->index(['tenant_id', 'mentioned_user_id']);
            $table->index(['reply_id']);
            $table->index(['ticket_id']);
            $table->index('created_at');

            // Foreign key for tenant
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        // Add mentions_processed column to support_ticket_replies
        Schema::table('support_ticket_replies', function (Blueprint $table) {
            $table->boolean('mentions_processed')->default(false)->after('metadata');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('support_ticket_replies', function (Blueprint $table) {
            $table->dropColumn('mentions_processed');
        });

        Schema::dropIfExists('support_ticket_mentions');
    }
};
