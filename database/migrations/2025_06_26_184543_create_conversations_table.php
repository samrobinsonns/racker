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
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id'); // String to match tenants table
            $table->enum('type', ['direct', 'group', 'channel'])->default('direct');
            $table->string('name')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_private')->default(true);
            $table->foreignId('created_by'); // Integer to match users table
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            
            // Indexes for performance
            $table->index(['tenant_id', 'type']);
            $table->index('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
