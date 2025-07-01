<?php

namespace App\Http\Controllers\TenantAdmin;

use App\Http\Controllers\Controller;
use App\Models\EmailSetting;
use App\Services\EmailSettingsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmailSettingsController extends Controller
{
    protected $emailSettingsService;

    public function __construct(EmailSettingsService $emailSettingsService)
    {
        $this->emailSettingsService = $emailSettingsService;
    }

    /**
     * Display email settings form
     */
    public function index()
    {
        $tenantId = auth()->user()->tenant_id;
        if (!$tenantId) {
            abort(403, 'No tenant associated with this user.');
        }

        $settings = EmailSetting::where('tenant_id', $tenantId)->first();

        return Inertia::render('TenantAdmin/EmailSettings/Index', [
            'settings' => $settings ? [
                'id' => $settings->id,
                'smtp_host' => $settings->smtp_host,
                'smtp_port' => $settings->smtp_port,
                'smtp_username' => $settings->smtp_username,
                'from_email' => $settings->from_email,
                'from_name' => $settings->from_name,
                'use_ssl' => $settings->use_ssl,
                'is_active' => $settings->is_active,
                'last_tested_at' => $settings->last_tested_at,
                'last_test_successful' => $settings->last_test_successful,
                'last_test_error' => $settings->last_test_error,
            ] : null,
        ]);
    }

    /**
     * Store or update email settings
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'smtp_host' => 'required|string|max:255',
            'smtp_port' => 'required|integer|min:1|max:65535',
            'smtp_username' => 'required|string|max:255',
            'smtp_password' => 'required|string',
            'from_email' => 'required|email|max:255',
            'from_name' => 'required|string|max:255',
            'use_ssl' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $tenantId = auth()->user()->tenant_id;
        if (!$tenantId) {
            abort(403, 'No tenant associated with this user.');
        }

        $settings = $this->emailSettingsService->updateSettings(
            $tenantId,
            $validated
        );

        return redirect()->route('tenant-admin.email-settings.index')
            ->with('success', 'Email settings updated successfully.');
    }

    /**
     * Test email settings connection
     */
    public function test(Request $request)
    {
        $settings = EmailSetting::findOrFail($request->settings_id);
        
        $tenantId = auth()->user()->tenant_id;
        if (!$tenantId) {
            abort(403, 'No tenant associated with this user.');
        }

        // Ensure the settings belong to the current tenant
        if ($settings->tenant_id !== $tenantId) {
            abort(403, 'These email settings do not belong to your tenant.');
        }

        $result = $this->emailSettingsService->testConnection($settings);

        return response()->json($result);
    }
}
