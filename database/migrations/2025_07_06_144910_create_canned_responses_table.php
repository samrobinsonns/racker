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
        Schema::create('canned_responses', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->index();
            $table->string('name');
            $table->text('content');
            $table->string('category')->default('general');
            $table->json('tags')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->foreignId('updated_by')->constrained('users')->onDelete('restrict');
            $table->integer('usage_count')->default(0);
            $table->timestamps();

            // Indexes for performance
            $table->index(['tenant_id', 'category']);
            $table->index(['tenant_id', 'is_active']);
            $table->index(['tenant_id', 'created_by']);
            $table->index('usage_count');

            // Foreign key for tenant
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('canned_responses');
    }
};
