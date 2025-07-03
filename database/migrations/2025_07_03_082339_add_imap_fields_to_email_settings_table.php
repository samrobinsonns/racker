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
        Schema::table('email_settings', function (Blueprint $table) {
            // IMAP Configuration Fields
            $table->string('imap_host')->nullable()->after('is_active');
            $table->integer('imap_port')->default(993)->after('imap_host');
            $table->string('imap_username')->nullable()->after('imap_port');
            $table->text('imap_password')->nullable()->after('imap_username');
            $table->enum('imap_encryption', ['ssl', 'tls', 'none'])->default('ssl')->after('imap_password');
            $table->string('imap_folder')->default('INBOX')->after('imap_encryption');
            $table->boolean('imap_enabled')->default(false)->after('imap_folder');
            
            // IMAP Status Fields
            $table->timestamp('imap_last_check_at')->nullable()->after('imap_enabled');
            $table->boolean('imap_last_check_successful')->nullable()->after('imap_last_check_at');
            $table->text('imap_last_check_error')->nullable()->after('imap_last_check_successful');
            
            // Indexes for performance
            $table->index(['tenant_id', 'imap_enabled']);
            $table->index('imap_last_check_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('email_settings', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'imap_enabled']);
            $table->dropIndex('imap_last_check_at');
            
            $table->dropColumn([
                'imap_host',
                'imap_port',
                'imap_username',
                'imap_password',
                'imap_encryption',
                'imap_folder',
                'imap_enabled',
                'imap_last_check_at',
                'imap_last_check_successful',
                'imap_last_check_error'
            ]);
        });
    }
};
