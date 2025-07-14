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
        Schema::create('calendar_shares', function (Blueprint $table) {
            $table->id();
            $table->uuid('tenant_id')->nullable();
            $table->foreignId('calendar_id')->constrained('calendars')->onDelete('cascade');
            $table->foreignId('shared_with_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('shared_by_user_id')->constrained('users')->onDelete('cascade');
            $table->enum('permission', ['view', 'edit', 'admin'])->default('view');
            $table->timestamps();

            // Indexes for performance
            $table->index(['tenant_id', 'calendar_id']);
            $table->index(['tenant_id', 'shared_with_user_id']);
            $table->index(['calendar_id', 'shared_with_user_id']);
            $table->index('shared_by_user_id');

            // Foreign key for tenant
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');

            // Unique constraint to prevent duplicate shares
            $table->unique(['calendar_id', 'shared_with_user_id'], 'unique_calendar_share');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('calendar_shares');
    }
}; 