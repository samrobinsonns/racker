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
        $tenantId = auth()->user()->tenant_id;
        if (!$tenantId) {
            abort(403, 'No tenant associated with this user.');
        }

        $validated = $request->validate([
            'smtp_host' => 'required|string',
            'smtp_port' => 'required|numeric',
            'smtp_username' => 'required|string',
            'smtp_password' => 'required|string',
            'from_email' => 'required|email',
            'from_name' => 'required|string',
            'use_ssl' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $settings = EmailSetting::updateOrCreate(
            ['tenant_id' => $tenantId],
            $validated
        );

        return redirect()
            ->route('tenant-admin.support-tickets.settings')
            ->with('success', 'Email settings saved successfully.');
    }

    /**
     * Test email settings connection
     */
    public function test(Request $request)
    {
        try {
            $settings = EmailSetting::findOrFail($request->settings_id);
            
            // Ensure the settings belong to the current tenant
            $tenantId = auth()->user()->tenant_id;
            if (!$tenantId || $settings->tenant_id !== $tenantId) {
                throw new \Exception('Invalid email settings configuration.');
            }

            $result = $this->emailSettingsService->testConnection($settings);
            
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Connection test successful!'
                ]);
            }

            return back()->with([
                'test_result' => [
                    'success' => true,
                    'message' => 'Connection test successful!'
                ]
            ]);
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Connection test failed: ' . $e->getMessage()
                ], 422);
            }

            return back()->with([
                'test_result' => [
                    'success' => false,
                    'message' => 'Connection test failed: ' . $e->getMessage()
                ]
            ]);
        }
    }
}
