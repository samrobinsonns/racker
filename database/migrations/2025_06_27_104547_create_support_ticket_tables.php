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
        // Support Ticket Priorities
        Schema::create('support_ticket_priorities', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->nullable()->index();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->integer('level');
            $table->string('color');
            $table->integer('response_time_hours');
            $table->integer('resolution_time_hours');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_system')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['tenant_id', 'is_active']);
            $table->index(['level']);
            $table->index(['tenant_id', 'slug']);
        });

        // Support Ticket Statuses
        Schema::create('support_ticket_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->nullable()->index();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('color');
            $table->string('type');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_system')->default(false);
            $table->boolean('is_closed')->default(false);
            $table->boolean('is_resolved')->default(false);
            $table->integer('sort_order')->default(0);
            $table->json('next_statuses')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['tenant_id', 'is_active']);
            $table->index(['type']);
            $table->index(['tenant_id', 'slug']);
        });

        // Support Ticket Categories
        Schema::create('support_ticket_categories', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->index();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('color')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->unique(['tenant_id', 'name']);
            $table->index(['tenant_id', 'is_active']);
        });

        // Support Tickets
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->index();
            $table->string('ticket_number')->unique();
            $table->string('subject');
            $table->text('description');
            $table->foreignId('category_id')->constrained('support_ticket_categories')->onDelete('restrict');
            $table->foreignId('status_id')->constrained('support_ticket_statuses')->onDelete('restrict');
            $table->foreignId('priority_id')->constrained('support_ticket_priorities')->onDelete('restrict');
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('due_date')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->foreignId('closed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->string('source')->default('web');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['tenant_id', 'ticket_number']);
            $table->index(['tenant_id', 'status_id']);
            $table->index(['tenant_id', 'created_by']);
            $table->index(['tenant_id', 'assigned_to']);
        });

        // Support Ticket Replies
        Schema::create('support_ticket_replies', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->index();
            $table->foreignId('ticket_id')->constrained('support_tickets')->onDelete('cascade');
            $table->text('content');
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->string('source')->default('web');
            $table->boolean('is_internal')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['tenant_id', 'ticket_id']);
            $table->index(['tenant_id', 'created_by']);
        });

        // Support Ticket Attachments
        Schema::create('support_ticket_attachments', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->index();
            $table->foreignId('ticket_id')->constrained('support_tickets')->onDelete('cascade');
            $table->foreignId('reply_id')->nullable()->constrained('support_ticket_replies')->onDelete('cascade');
            $table->string('filename');
            $table->string('original_filename');
            $table->string('mime_type');
            $table->integer('file_size');
            $table->string('storage_path');
            $table->string('storage_disk')->default('local');
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['tenant_id', 'ticket_id']);
            $table->index(['tenant_id', 'reply_id']);
        });

        // Support Ticket Activity Logs
        Schema::create('support_ticket_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->index();
            $table->foreignId('ticket_id')->constrained('support_tickets')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('restrict');
            $table->string('event_type');
            $table->text('description');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['tenant_id', 'ticket_id']);
            $table->index(['tenant_id', 'user_id']);
            $table->index(['tenant_id', 'event_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_ticket_activity_logs');
        Schema::dropIfExists('support_ticket_attachments');
        Schema::dropIfExists('support_ticket_replies');
        Schema::dropIfExists('support_tickets');
        Schema::dropIfExists('support_ticket_categories');
        Schema::dropIfExists('support_ticket_statuses');
        Schema::dropIfExists('support_ticket_priorities');
    }
}; 