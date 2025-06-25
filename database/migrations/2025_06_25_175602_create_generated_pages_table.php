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
        Schema::create('generated_pages', function (Blueprint $table) {
            $table->id();
            $table->string('navigation_item_key')->unique();
            $table->string('component_name');
            $table->string('page_directory');
            $table->string('file_path');
            $table->string('route_name');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('icon');
            $table->string('template_type')->default('basic');
            $table->json('config')->nullable(); // Store additional configuration
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index(['navigation_item_key', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('generated_pages');
    }
};
