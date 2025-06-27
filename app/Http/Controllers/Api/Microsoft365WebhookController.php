<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Microsoft365EmailConnection;
use App\Services\SupportTickets\Microsoft365EmailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class Microsoft365WebhookController extends Controller
{
    protected Microsoft365EmailService $emailService;

    public function __construct(Microsoft365EmailService $emailService)
    {
        $this->emailService = $emailService;
    }

    /**
     * Handle subscription validation
     */
    public function handleValidation(Request $request)
    {
        $validationToken = $request->query('validationToken');
        
        if ($validationToken) {
            return response($validationToken, 200)
                ->header('Content-Type', 'text/plain');
        }

        return response()->json(['error' => 'No validation token provided'], 400);
    }

    /**
     * Handle incoming notifications
     */
    public function handleNotification(Request $request)
    {
        try {
            $notifications = $request->input('value', []);

            foreach ($notifications as $notification) {
                $this->processNotification($notification);
            }

            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            Log::error('Error processing Microsoft 365 webhook notification: ' . $e->getMessage(), [
                'notification' => $request->all(),
            ]);

            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Process a single notification
     */
    protected function processNotification(array $notification)
    {
        // Get the connection based on the subscription
        $connection = Microsoft365EmailConnection::where('subscription_id', $notification['subscriptionId'])->first();
        
        if (!$connection) {
            Log::warning('No connection found for subscription', [
                'subscription_id' => $notification['subscriptionId'],
            ]);
            return;
        }

        // Queue email processing
        dispatch(function () use ($connection) {
            $this->emailService->processIncomingEmails($connection);
        })->onQueue('emails');
    }

    /**
     * Handle subscription lifecycle events
     */
    public function handleLifecycle(Request $request)
    {
        try {
            $subscriptions = $request->input('value', []);

            foreach ($subscriptions as $subscription) {
                if ($subscription['lifecycleEvent'] === 'reauthorizationRequired') {
                    $this->handleReauthorization($subscription['subscriptionId']);
                }
            }

            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            Log::error('Error handling subscription lifecycle event: ' . $e->getMessage(), [
                'event' => $request->all(),
            ]);

            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Handle reauthorization requirement
     */
    protected function handleReauthorization(string $subscriptionId)
    {
        $connection = Microsoft365EmailConnection::where('subscription_id', $subscriptionId)->first();
        
        if ($connection) {
            // Mark connection as needing reauthorization
            $connection->update([
                'needs_reauthorization' => true,
                'subscription_id' => null,
            ]);

            // Notify tenant admins
            // TODO: Implement notification
        }
    }
} 