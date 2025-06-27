<?php

namespace App\Services\SupportTickets;

use App\Models\Microsoft365EmailConnection;
use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Models\Tenant;
use Microsoft\Graph\Graph;
use Microsoft\Graph\Model\Message;
use Microsoft\Graph\Model\EmailAddress;
use Microsoft\Graph\Model\Recipient;
use Microsoft\Graph\Model\ItemBody;
use Microsoft\Graph\Model\BodyType;
use League\OAuth2\Client\Provider\GenericProvider;
use League\OAuth2\Client\Token\AccessToken;
use GuzzleHttp\Exception\ClientException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Exception;

class Microsoft365EmailService
{
    private Graph $graph;
    private TicketService $ticketService;
    private ReplyService $replyService;
    private AttachmentService $attachmentService;

    public function __construct(
        TicketService $ticketService,
        ReplyService $replyService,
        AttachmentService $attachmentService
    ) {
        $this->ticketService = $ticketService;
        $this->replyService = $replyService;
        $this->attachmentService = $attachmentService;
        $this->graph = new Graph();
    }

    /**
     * Get OAuth authorization URL
     */
    public function getAuthorizationUrl(Tenant $tenant): string
    {
        $provider = $this->getProvider();
        $authUrl = $provider->getAuthorizationUrl(['state' => $tenant->id]);
        
        // Store state for verification in callback
        Cache::put('oauth2_state_' . $tenant->id, $provider->getState(), now()->addMinutes(10));
        
        return $authUrl;
    }

    /**
     * Handle OAuth callback
     */
    public function handleCallback(string $code, string $state): Microsoft365EmailConnection
    {
        // Verify state
        $cachedState = Cache::get('oauth2_state_' . $state);
        if (!$cachedState || $cachedState !== $state) {
            throw new Exception('Invalid OAuth state');
        }

        $provider = $this->getProvider();
        $accessToken = $provider->getAccessToken('authorization_code', ['code' => $code]);

        // Get user info from Microsoft Graph
        $this->graph->setAccessToken($accessToken->getToken());
        $user = $this->graph->createRequest('GET', '/me')
            ->setReturnType(\Microsoft\Graph\Model\User::class)
            ->execute();

        // Create or update email connection
        return $this->createEmailConnection(
            $state,
            $accessToken,
            $user['mail'] ?? $user['userPrincipalName'],
            $user['displayName']
        );
    }

    /**
     * Refresh access token
     */
    public function refreshToken(Microsoft365EmailConnection $connection): bool
    {
        $provider = $this->getProvider();

        try {
            $newToken = $provider->getAccessToken('refresh_token', [
                'refresh_token' => decrypt($connection->refresh_token)
            ]);

            $connection->update([
                'access_token' => encrypt($newToken->getToken()),
                'refresh_token' => encrypt($newToken->getRefreshToken()),
                'expires_at' => $newToken->getExpires(),
            ]);

            return true;

        } catch (ClientException $e) {
            // Token refresh failed, connection needs re-authentication
            $connection->update([
                'is_active' => false,
                'access_token' => null,
                'refresh_token' => null,
                'expires_at' => null,
            ]);

            return false;
        }
    }

    /**
     * Process incoming emails
     */
    public function processIncomingEmails(Microsoft365EmailConnection $connection): array
    {
        if (!$this->ensureValidToken($connection)) {
            return ['error' => 'Invalid or expired token'];
        }

        $this->graph->setAccessToken(decrypt($connection->access_token));
        $processed = [];

        try {
            // Get recent emails
            $messages = $this->getRecentEmails($connection);

            foreach ($messages as $message) {
                $result = $this->processEmail($connection, $message);
                if ($result) {
                    $processed[] = $result;
                }
            }

            // Update last sync time
            $connection->updateLastSync();

            return ['processed' => $processed];

        } catch (ClientException $e) {
            return ['error' => 'Failed to process emails: ' . $e->getMessage()];
        }
    }

    /**
     * Send email reply
     */
    public function sendReply(
        Microsoft365EmailConnection $connection,
        SupportTicketReply $reply,
        string $recipientEmail,
        ?string $recipientName = null
    ): bool {
        if (!$this->ensureValidToken($connection)) {
            return false;
        }

        $this->graph->setAccessToken(decrypt($connection->access_token));

        try {
            // Create email message
            $message = $this->createEmailMessage(
                $reply,
                $recipientEmail,
                $recipientName,
                $connection
            );

            // Send the email
            $response = $this->graph->createRequest('POST', '/me/sendMail')
                ->attachBody(['message' => $message])
                ->execute();

            // Mark reply as sent
            $this->replyService->markAsSent($reply, $response['id'] ?? 'sent-' . time());

            return true;

        } catch (ClientException $e) {
            return false;
        }
    }

    /**
     * Test email connection
     */
    public function testConnection(Microsoft365EmailConnection $connection): array
    {
        if (!$this->ensureValidToken($connection)) {
            return ['success' => false, 'error' => 'Invalid or expired token'];
        }

        $this->graph->setAccessToken(decrypt($connection->access_token));

        try {
            // Test by getting user profile
            $user = $this->graph->createRequest('GET', '/me')
                ->setReturnType(\Microsoft\Graph\Model\User::class)
                ->execute();

            return [
                'success' => true,
                'user' => [
                    'email' => $user->getMail() ?? $user->getUserPrincipalName(),
                    'name' => $user->getDisplayName(),
                ]
            ];

        } catch (ClientException $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Get OAuth provider
     */
    private function getProvider(): GenericProvider
    {
        return new GenericProvider([
            'clientId' => config('support-tickets.microsoft365.client_id'),
            'clientSecret' => config('support-tickets.microsoft365.client_secret'),
            'redirectUri' => config('support-tickets.microsoft365.redirect_uri'),
            'urlAuthorize' => 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
            'urlAccessToken' => 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            'urlResourceOwnerDetails' => 'https://graph.microsoft.com/v1.0/me',
            'scopes' => [
                'offline_access',
                'https://graph.microsoft.com/Mail.Read',
                'https://graph.microsoft.com/Mail.Send',
                'https://graph.microsoft.com/User.Read',
            ]
        ]);
    }

    /**
     * Ensure token is valid
     */
    private function ensureValidToken(Microsoft365EmailConnection $connection): bool
    {
        if ($this->shouldRefreshToken($connection)) {
            return $this->refreshToken($connection);
        }

        return true;
    }

    /**
     * Get recent emails
     */
    private function getRecentEmails(Microsoft365EmailConnection $connection): array
    {
        $lastSync = $connection->last_email_sync;
        $filter = $lastSync ? 
            "receivedDateTime ge {$lastSync->toISOString()}" : 
            "receivedDateTime ge {now()->subDays(1)->toISOString()}";

        $response = $this->graph->createRequest('GET', '/me/mailFolders/inbox/messages')
            ->addHeaders(['Prefer' => 'outlook.body-content-type="text"'])
            ->setQueryParameters([
                '$filter' => $filter,
                '$orderby' => 'receivedDateTime desc',
                '$top' => 50,
                '$expand' => 'attachments',
            ])
            ->execute();

        return $response['value'] ?? [];
    }

    /**
     * Process individual email
     */
    private function processEmail(Microsoft365EmailConnection $connection, array $emailData): ?array
    {
        // Apply processing rules
        if (!$this->shouldProcessEmail($emailData)) {
            return null;
        }

        // Check if this is a reply to existing ticket
        $existingTicket = $this->findExistingTicket($connection->tenant_id, $emailData);

        if ($existingTicket) {
            // Create reply to existing ticket
            $reply = $this->replyService->createEmailReply($existingTicket, [
                'body_text' => $emailData['body']['content'] ?? '',
                'body_html' => $emailData['bodyPreview'] ?? '',
                'from_email' => $emailData['from']['emailAddress']['address'],
                'from_name' => $emailData['from']['emailAddress']['name'],
                'subject' => $emailData['subject'],
                'message_id' => $emailData['id'],
                'headers' => $this->extractHeaders($emailData),
                'received_at' => $emailData['receivedDateTime'],
                'cc' => $this->extractCcEmails($emailData),
                'bcc' => $this->extractBccEmails($emailData),
            ]);

            // Process attachments
            $this->processEmailAttachments($existingTicket, $emailData, $reply->id);

            return [
                'type' => 'reply',
                'ticket_id' => $existingTicket->id,
                'reply_id' => $reply->id,
            ];
        } else {
            // Create new ticket
            $ticket = $this->createTicketFromEmail($connection, $emailData);

            // Process attachments
            $this->processEmailAttachments($ticket, $emailData);

            return [
                'type' => 'ticket',
                'ticket_id' => $ticket->id,
            ];
        }
    }

    /**
     * Check if email should be processed
     */
    private function shouldProcessEmail(array $emailData): bool
    {
        $rules = $emailData['tenant']->getProcessingRules();

        // Check for auto-replies
        if ($rules['ignore_auto_replies'] && $this->isAutoReply($emailData)) {
            return false;
        }

        // Check for out-of-office
        if ($rules['ignore_out_of_office'] && $this->isOutOfOffice($emailData)) {
            return false;
        }

        // Check minimum body length
        $bodyLength = strlen($emailData['body']['content'] ?? '');
        if ($bodyLength < ($rules['minimum_body_length'] ?? 10)) {
            return false;
        }

        return true;
    }

    /**
     * Find existing ticket by email thread or subject
     */
    private function findExistingTicket(string $tenantId, array $emailData): ?SupportTicket
    {
        $subject = $emailData['subject'] ?? '';
        
        // Look for ticket number in subject
        if (preg_match('/\[TKT-\d{4}-\d{6}\]/', $subject, $matches)) {
            $ticketNumber = trim($matches[0], '[]');
            return SupportTicket::forTenant($tenantId)
                ->where('ticket_number', $ticketNumber)
                ->first();
        }

        // Look for conversation ID
        $conversationId = $emailData['conversationId'] ?? null;
        if ($conversationId) {
            return SupportTicket::forTenant($tenantId)
                ->where('microsoft365_thread_id', $conversationId)
                ->first();
        }

        return null;
    }

    /**
     * Create ticket from email
     */
    private function createTicketFromEmail(Microsoft365EmailConnection $connection, array $emailData): SupportTicket
    {
        $fromEmail = $emailData['from']['emailAddress']['address'];
        $fromName = $emailData['from']['emailAddress']['name'] ?? $fromEmail;
        
        $ticketData = [
            'subject' => $emailData['subject'] ?? 'Email Support Request',
            'description' => $emailData['body']['content'] ?? '',
            'requester_email' => $fromEmail,
            'requester_name' => $fromName,
            'source' => 'email',
            'channel' => 'microsoft365',
            'microsoft365_message_id' => $emailData['id'],
            'microsoft365_thread_id' => $emailData['conversationId'] ?? null,
            'email_headers' => $this->extractHeaders($emailData),
        ];

        // Set defaults from connection
        if ($connection->default_category_id) {
            $ticketData['category_id'] = $connection->default_category_id;
        }

        if ($connection->default_priority_id) {
            $ticketData['priority_id'] = $connection->default_priority_id;
        }

        if ($connection->default_assignee_id) {
            $ticketData['assignee_id'] = $connection->default_assignee_id;
        }

        return $this->ticketService->createTicket($ticketData, $connection->tenant_id);
    }

    /**
     * Process email attachments
     */
    private function processEmailAttachments(SupportTicket $ticket, array $emailData, ?int $replyId = null): void
    {
        $attachments = $emailData['attachments'] ?? [];

        foreach ($attachments as $attachment) {
            if ($attachment['@odata.type'] === '#microsoft.graph.fileAttachment') {
                $this->attachmentService->createEmailAttachment($ticket, [
                    'filename' => $attachment['name'],
                    'content' => base64_decode($attachment['contentBytes']),
                    'mime_type' => $attachment['contentType'],
                    'attachment_id' => $attachment['id'],
                ], $replyId);
            }
        }
    }

    /**
     * Create email message for sending
     */
    private function createEmailMessage(
        SupportTicketReply $reply,
        string $recipientEmail,
        ?string $recipientName,
        Microsoft365EmailConnection $connection
    ): array {
        $ticket = $reply->ticket;
        $subject = "[{$ticket->ticket_number}] {$ticket->subject}";
        
        $body = $reply->content;
        if ($connection->reply_signature) {
            $body .= "\n\n---\n" . $connection->reply_signature;
        }

        return [
            'subject' => $subject,
            'body' => [
                'contentType' => 'text',
                'content' => $body,
            ],
            'toRecipients' => [
                [
                    'emailAddress' => [
                        'address' => $recipientEmail,
                        'name' => $recipientName ?? $recipientEmail,
                    ]
                ]
            ],
        ];
    }

    /**
     * Extract email headers
     */
    private function extractHeaders(array $emailData): array
    {
        return [
            'message_id' => $emailData['id'] ?? null,
            'conversation_id' => $emailData['conversationId'] ?? null,
            'received_at' => $emailData['receivedDateTime'] ?? null,
            'importance' => $emailData['importance'] ?? 'normal',
        ];
    }

    /**
     * Extract CC emails
     */
    private function extractCcEmails(array $emailData): array
    {
        $ccRecipients = $emailData['ccRecipients'] ?? [];
        return array_map(fn($cc) => $cc['emailAddress']['address'], $ccRecipients);
    }

    /**
     * Extract BCC emails
     */
    private function extractBccEmails(array $emailData): array
    {
        $bccRecipients = $emailData['bccRecipients'] ?? [];
        return array_map(fn($bcc) => $bcc['emailAddress']['address'], $bccRecipients);
    }

    /**
     * Check if email is an auto-reply
     */
    private function isAutoReply(array $emailData): bool
    {
        $subject = strtolower($emailData['subject'] ?? '');
        $autoReplyIndicators = ['auto-reply', 'automatic reply', 'out of office', 'vacation'];
        
        foreach ($autoReplyIndicators as $indicator) {
            if (str_contains($subject, $indicator)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if email is out-of-office
     */
    private function isOutOfOffice(array $emailData): bool
    {
        $subject = strtolower($emailData['subject'] ?? '');
        $body = strtolower($emailData['body']['content'] ?? '');
        
        $oofIndicators = ['out of office', 'out-of-office', 'vacation', 'away message'];
        
        foreach ($oofIndicators as $indicator) {
            if (str_contains($subject, $indicator) || str_contains($body, $indicator)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if we should refresh the access token
     */
    private function shouldRefreshToken(Microsoft365EmailConnection $connection): bool
    {
        return $connection->expires_at <= now()->addMinutes(5);
    }
} 