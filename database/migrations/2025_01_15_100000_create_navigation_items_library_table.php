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
        Schema::create('navigation_items_library', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // "dashboard", "reports", "analytics"
            $table->string('label'); // "Dashboard", "Reports"
            $table->string('icon'); // "HomeIcon", "ChartBarIcon"
            $table->string('route_name'); // "dashboard", "tenant.reports"
            $table->string('permission_required')->nullable();
            $table->string('category')->default('core'); // "core", "admin", "content", "custom"
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('navigation_items_library');
    }
}; 