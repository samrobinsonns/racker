<?php

namespace App\Console\Commands;

use App\Models\SupportTicket;
use App\Services\SupportTickets\ReplyService;
use Illuminate\Console\Command;

class TestTicketReply extends Command
{
    protected $signature = 'ticket:test-reply {ticket_number} {--message=} {--from=test@example.com} {--name=Test User}';
    protected $description = 'Simulate an email reply to a support ticket';

    public function handle(ReplyService $replyService)
    {
        $ticketNumber = $this->argument('ticket_number');
        $message = $this->option('message') ?? 'This is a test reply to ticket ' . $ticketNumber;
        $fromEmail = $this->option('from');
        $fromName = $this->option('name');

        // Find the ticket
        $ticket = SupportTicket::where('ticket_number', $ticketNumber)->first();

        if (!$ticket) {
            $this->error("Ticket {$ticketNumber} not found!");
            return 1;
        }

        try {
            // Create a reply as if it came from email
            $reply = $replyService->createEmailReply($ticket, [
                'body_text' => $message,
                'body_html' => "<p>{$message}</p>",
                'from_email' => $fromEmail,
                'from_name' => $fromName,
                'subject' => "Re: [{$ticketNumber}] {$ticket->subject}",
                'message_id' => 'test-' . time(),
                'headers' => [
                    'message_id' => 'test-' . time(),
                    'received_at' => now(),
                ],
                'received_at' => now(),
                'created_by' => null, // Set to null for email replies since they come from external users
            ]);

            $this->info("✓ Reply created successfully!");
            $this->table(
                ['Field', 'Value'],
                [
                    ['Ticket', $ticketNumber],
                    ['From', "{$fromName} <{$fromEmail}>"],
                    ['Reply ID', $reply->id],
                    ['Created At', $reply->created_at],
                ]
            );

        } catch (\Exception $e) {
            $this->error("Failed to create reply: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
} 