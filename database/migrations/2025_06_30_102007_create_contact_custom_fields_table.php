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
        Schema::create('contact_custom_fields', function (Blueprint $table) {
            $table->id();
            $table->uuid('tenant_id');
            $table->string('field_name');
            $table->enum('field_type', ['text', 'number', 'date', 'select', 'multiselect', 'checkbox']);
            $table->json('field_options')->nullable();
            $table->boolean('is_required')->default(false);
            $table->integer('sort_order')->nullable();
            $table->timestamps();

            $table->index('tenant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contact_custom_fields');
    }
};
