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
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., 'central_admin', 'tenant_admin', 'tenant_user'
            $table->string('display_name'); // e.g., 'Central Administrator', 'Tenant Administrator'
            $table->text('description')->nullable();
            $table->string('type')->default('tenant'); // 'central' or 'tenant'
            $table->string('tenant_id')->nullable()->index(); // null for central roles
            $table->json('permissions')->nullable(); // Store permissions as JSON
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->unique(['name', 'tenant_id']); // Prevent duplicate role names per tenant
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
