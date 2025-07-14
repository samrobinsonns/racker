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
        Schema::create('calendar_events', function (Blueprint $table) {
            $table->id();
            $table->uuid('tenant_id')->nullable();
            $table->foreignId('calendar_id')->constrained('calendars')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->datetime('start_date');
            $table->datetime('end_date');
            $table->boolean('all_day')->default(false);
            $table->string('location')->nullable();
            $table->string('url')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            // Indexes for performance
            $table->index(['tenant_id', 'calendar_id']);
            $table->index(['tenant_id', 'start_date']);
            $table->index(['tenant_id', 'end_date']);
            $table->index(['calendar_id', 'start_date']);
            $table->index('created_by');

            // Foreign key for tenant
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('calendar_events');
    }
}; 