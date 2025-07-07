<?php

use App\Http\Controllers\Api\SupportTicketController;
use App\Http\Controllers\Api\SupportTicketReplyController;
use App\Http\Controllers\Api\SupportTicketAttachmentController;
use App\Http\Controllers\Api\Microsoft365WebhookController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\ContactSearchController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware(['auth:sanctum'])->group(function () {
    // Support Tickets
    Route::prefix('support-tickets')->group(function () {
        // Ticket Management
        Route::get('/', [SupportTicketController::class, 'index']);
        Route::get('/stats', [SupportTicketController::class, 'stats']);
        Route::post('/', [SupportTicketController::class, 'store']);
        Route::get('/{ticket}', [SupportTicketController::class, 'show']);
        Route::put('/{ticket}', [SupportTicketController::class, 'update']);
        Route::delete('/{ticket}', [SupportTicketController::class, 'destroy']);
        Route::post('/{ticket}/assign', [SupportTicketController::class, 'assign']);
        Route::post('/{ticket}/escalate', [SupportTicketController::class, 'escalate']);

        // Ticket Replies
        Route::get('/{ticket}/replies', [SupportTicketReplyController::class, 'index']);
        Route::post('/{ticket}/replies', [SupportTicketReplyController::class, 'store']);
        Route::put('/{ticket}/replies/{reply}', [SupportTicketReplyController::class, 'update']);
        Route::delete('/{ticket}/replies/{reply}', [SupportTicketReplyController::class, 'destroy']);
        Route::post('/{ticket}/internal-notes', [SupportTicketReplyController::class, 'storeInternalNote']);

        // Ticket Attachments
        Route::get('/{ticket}/attachments', [SupportTicketAttachmentController::class, 'index']);
        Route::post('/{ticket}/attachments', [SupportTicketAttachmentController::class, 'store']);
        Route::get('/{ticket}/attachments/{attachment}', [SupportTicketAttachmentController::class, 'show']);
        Route::delete('/{ticket}/attachments/{attachment}', [SupportTicketAttachmentController::class, 'destroy']);
    });

    // Microsoft 365 Webhook Routes
    Route::prefix('microsoft365/webhook')->group(function () {
        Route::get('/', [Microsoft365WebhookController::class, 'handleValidation']);
        Route::post('/', [Microsoft365WebhookController::class, 'handleNotification']);
        Route::post('/lifecycle', [Microsoft365WebhookController::class, 'handleLifecycle']);
    });

    Route::get('/contacts/search', [ContactSearchController::class, '__invoke'])->name('api.contacts.search');
}); 