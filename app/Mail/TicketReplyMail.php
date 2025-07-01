<?php

namespace App\Mail;

use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Models\EmailSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Support\Facades\Config;

class TicketReplyMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public string $recipientEmail,
        public string $recipientName,
        public SupportTicket $ticket,
        public SupportTicketReply $reply,
        protected string $emailSubject,
        public array $message,
        public string $actionText,
        public string $actionUrl
    ) {
        // Get tenant's email settings and configure mailer
        $this->configureTenantMailer();
    }

    /**
     * Configure the mailer with tenant's SMTP settings
     */
    protected function configureTenantMailer(): void
    {
        $emailSettings = EmailSetting::where('tenant_id', $this->ticket->tenant_id)
            ->where('is_active', true)
            ->first();

        \Log::info('Configuring tenant mailer', [
            'tenant_id' => $this->ticket->tenant_id,
            'has_settings' => (bool) $emailSettings,
            'settings' => $emailSettings ? [
                'host' => $emailSettings->smtp_host,
                'port' => $emailSettings->smtp_port,
                'username' => $emailSettings->smtp_username,
                'from_email' => $emailSettings->from_email,
                'from_name' => $emailSettings->from_name,
                'is_active' => $emailSettings->is_active,
            ] : null
        ]);

        if ($emailSettings) {
            Config::set('mail.mailers.smtp', [
                'transport' => 'smtp',
                'host' => $emailSettings->smtp_host,
                'port' => $emailSettings->smtp_port,
                'encryption' => $emailSettings->use_ssl ? 'tls' : '',
                'username' => $emailSettings->smtp_username,
                'password' => $emailSettings->smtp_password,
                'timeout' => 30,
                'local_domain' => config('mail.local_domain', null),
            ]);

            Config::set('mail.from.address', $emailSettings->from_email);
            Config::set('mail.from.name', $emailSettings->from_name);

            \Log::info('Mail configuration set', [
                'mailer' => config('mail.mailers.smtp'),
                'from' => config('mail.from')
            ]);
        } else {
            \Log::warning('No active email settings found for tenant', [
                'tenant_id' => $this->ticket->tenant_id
            ]);
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        // Get the tenant's email settings
        $emailSettings = EmailSetting::where('tenant_id', $this->ticket->tenant_id)
            ->where('is_active', true)
            ->first();

        // Use the configured email settings or fall back to system defaults
        $fromEmail = $emailSettings?->from_email ?? config('mail.from.address');
        $fromName = $emailSettings?->from_name ?? config('mail.from.name');

        return new Envelope(
            subject: $this->emailSubject,
            from: new Address($fromEmail, $fromName),
            to: $this->recipientEmail,
            replyTo: $fromEmail,
            tags: ['ticket-reply', 'ticket-' . $this->ticket->ticket_number]
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.tickets.reply',
            with: [
                'recipientName' => $this->recipientName,
                'ticket' => $this->ticket,
                'reply' => $this->reply,
                'message' => $this->message,
                'actionText' => $this->actionText,
                'actionUrl' => $this->actionUrl
            ]
        );
    }
} 