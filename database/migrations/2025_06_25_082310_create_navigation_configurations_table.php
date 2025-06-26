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
        if (!Schema::hasTable('navigation_configurations')) {
            Schema::create('navigation_configurations', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->index();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade'); // null = tenant-wide config
            $table->foreignId('role_id')->nullable()->constrained()->onDelete('cascade'); // role-specific config
            $table->string('name'); // "Default", "Manager View", etc.
            $table->boolean('is_active')->default(false);
            $table->json('configuration'); // navigation structure
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('updated_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            
            // Ensure only one active configuration per tenant/user/role combination
            $table->unique(['tenant_id', 'user_id', 'role_id', 'is_active'], 'unique_active_config');
            
            // Index for quick lookups
            $table->index(['tenant_id', 'is_active']);
            $table->index(['tenant_id', 'user_id', 'is_active']);
            $table->index(['tenant_id', 'role_id', 'is_active']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('navigation_configurations');
    }
}; 