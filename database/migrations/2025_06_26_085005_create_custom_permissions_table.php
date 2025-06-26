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
        Schema::create('custom_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // e.g., 'manage_custom_feature'
            $table->string('label'); // e.g., 'Manage Custom Feature'
            $table->text('description'); // Description of what the permission allows
            $table->string('category')->default('Custom'); // Category grouping
            $table->boolean('is_active')->default(true); // Can be disabled
            $table->string('created_by_user_id')->nullable(); // Track who created it
            $table->timestamps();
            
            $table->index(['category', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('custom_permissions');
    }
};
