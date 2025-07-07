<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CannedResponse;
use App\Models\Tenant;
use App\Models\User;

class CannedResponseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first tenant and user for seeding
        $tenant = Tenant::first();
        $user = User::first();

        if (!$tenant || !$user) {
            $this->command->warn('No tenant or user found. Please run the tenant and user seeders first.');
            return;
        }

        $cannedResponses = [
            // Greetings and Initial Responses
            [
                'name' => 'Welcome to Support',
                'content' => "Hi {customer_name},\n\nThank you for contacting our support team. I'm {agent_name} and I'll be assisting you today.\n\nI've received your request regarding #{ticket_number} and I'm reviewing the details now. I'll get back to you shortly with an update.\n\nBest regards,\n{agent_name}",
                'category' => 'greetings',
                'tags' => ['welcome', 'initial', 'greeting'],
            ],
            [
                'name' => 'Thank You for Contacting Us',
                'content' => "Hello {customer_name},\n\nThank you for reaching out to us. We appreciate you taking the time to contact our support team.\n\nI understand you need assistance with your request, and I'm here to help. Let me review your case and I'll provide you with a solution as soon as possible.\n\nWarm regards,\n{agent_name}",
                'category' => 'greetings',
                'tags' => ['thank-you', 'contact', 'appreciation'],
            ],

            // Problem Resolution
            [
                'name' => 'Issue Resolved',
                'content' => "Hi {customer_name},\n\nGreat news! I've resolved the issue you reported in ticket #{ticket_number}.\n\nThe problem has been fixed and everything should be working normally now. Please test the functionality and let me know if you experience any further issues.\n\nIf you have any other questions or concerns, please don't hesitate to reach out.\n\nBest regards,\n{agent_name}",
                'category' => 'resolution',
                'tags' => ['resolved', 'fixed', 'solution'],
            ],
            [
                'name' => 'Temporary Workaround',
                'content' => "Hello {customer_name},\n\nWhile we work on a permanent solution for the issue you reported, I'd like to provide you with a temporary workaround that should help you continue your work.\n\nHere's what you can do in the meantime:\n[Please add specific steps here]\n\nOur development team is actively working on a permanent fix, and I'll keep you updated on our progress.\n\nThank you for your patience.\n\nBest regards,\n{agent_name}",
                'category' => 'resolution',
                'tags' => ['workaround', 'temporary', 'development'],
            ],

            // Information Requests
            [
                'name' => 'Need More Information',
                'content' => "Hi {customer_name},\n\nThank you for your message regarding ticket #{ticket_number}.\n\nTo better assist you with this issue, I'll need some additional information:\n\n• [Specific information needed]\n• [Additional details required]\n• [Any relevant screenshots or error messages]\n\nOnce I have this information, I'll be able to provide you with a more targeted solution.\n\nThanks for your cooperation!\n\nBest regards,\n{agent_name}",
                'category' => 'information',
                'tags' => ['information', 'details', 'investigation'],
            ],
            [
                'name' => 'Screenshot Request',
                'content' => "Hello {customer_name},\n\nTo help diagnose the issue you're experiencing, could you please provide a screenshot showing:\n\n1. The error message or unexpected behavior\n2. The browser/application you're using\n3. Any relevant settings or configurations\n\nYou can attach the screenshots directly to this ticket by replying to this email.\n\nThis will help me understand exactly what's happening and provide you with the most accurate solution.\n\nThank you!\n\nBest regards,\n{agent_name}",
                'category' => 'information',
                'tags' => ['screenshot', 'diagnostic', 'visual'],
            ],

            // Follow-up Messages
            [
                'name' => 'Follow-up Check',
                'content' => "Hi {customer_name},\n\nI wanted to follow up on ticket #{ticket_number} to see how things are going.\n\nHave you had a chance to try the solution I provided? Is everything working as expected now?\n\nIf you're still experiencing any issues or have additional questions, please let me know and I'll be happy to help further.\n\nIf the issue has been resolved, I'll mark this ticket as closed, but you can always reopen it if needed.\n\nBest regards,\n{agent_name}",
                'category' => 'follow-up',
                'tags' => ['follow-up', 'check-in', 'status'],
            ],
            [
                'name' => 'Satisfaction Survey',
                'content' => "Hello {customer_name},\n\nI hope the solution provided for ticket #{ticket_number} has resolved your issue satisfactorily.\n\nWe'd love to hear about your experience with our support team. If you have a moment, please consider leaving feedback about your interaction with us.\n\nYour feedback helps us improve our service and ensures we continue to provide the best possible support.\n\nThank you for choosing our service!\n\nBest regards,\n{agent_name}",
                'category' => 'follow-up',
                'tags' => ['satisfaction', 'survey', 'feedback'],
            ],

            // Escalation and Delays
            [
                'name' => 'Escalating to Specialist',
                'content' => "Hi {customer_name},\n\nThank you for your patience with ticket #{ticket_number}.\n\nI've reviewed your case thoroughly, and to ensure you receive the best possible assistance, I'm escalating your issue to one of our technical specialists who has specific expertise in this area.\n\nThey will review your case and contact you within the next 24 hours with a detailed response.\n\nI appreciate your understanding, and we're committed to resolving this issue for you.\n\nBest regards,\n{agent_name}",
                'category' => 'escalation',
                'tags' => ['escalation', 'specialist', 'expert'],
            ],
            [
                'name' => 'Investigating Issue',
                'content' => "Hello {customer_name},\n\nThank you for reporting this issue in ticket #{ticket_number}.\n\nI'm currently investigating the problem you've described and working with our technical team to identify the root cause and develop a solution.\n\nThis may take some additional time to resolve properly, but I wanted to keep you informed of our progress. I'll update you again within 48 hours with either a solution or a detailed status report.\n\nThank you for your patience while we work on this.\n\nBest regards,\n{agent_name}",
                'category' => 'escalation',
                'tags' => ['investigating', 'technical', 'progress'],
            ],

            // Account and Billing
            [
                'name' => 'Account Issue Resolved',
                'content' => "Hi {customer_name},\n\nI've successfully resolved the account issue you reported in ticket #{ticket_number}.\n\nYour account has been updated and all functionality should now be restored. Please log out and log back in to ensure all changes take effect.\n\nIf you notice any remaining issues with your account, please don't hesitate to contact us immediately.\n\nThank you for bringing this to our attention.\n\nBest regards,\n{agent_name}",
                'category' => 'account',
                'tags' => ['account', 'resolved', 'login'],
            ],
            [
                'name' => 'Billing Inquiry Response',
                'content' => "Hello {customer_name},\n\nThank you for your billing inquiry in ticket #{ticket_number}.\n\nI've reviewed your account and can provide you with the following information:\n\n[Billing details will be added here]\n\nIf you have any questions about these charges or need additional clarification, please let me know and I'll be happy to explain further.\n\nBest regards,\n{agent_name}",
                'category' => 'billing',
                'tags' => ['billing', 'charges', 'inquiry'],
            ],

            // Technical Support
            [
                'name' => 'Browser Cache Clear',
                'content' => "Hi {customer_name},\n\nThe issue you're experiencing in ticket #{ticket_number} appears to be related to cached data in your browser.\n\nPlease try the following steps:\n\n1. Clear your browser cache and cookies\n2. Close all browser windows\n3. Restart your browser\n4. Try accessing the application again\n\nFor detailed instructions on clearing your cache, please visit [link to cache clearing guide].\n\nIf the issue persists after trying these steps, please let me know and I'll investigate further.\n\nBest regards,\n{agent_name}",
                'category' => 'technical',
                'tags' => ['browser', 'cache', 'troubleshooting'],
            ],
            [
                'name' => 'Password Reset Instructions',
                'content' => "Hello {customer_name},\n\nI can help you reset your password for ticket #{ticket_number}.\n\nPlease follow these steps:\n\n1. Go to the login page\n2. Click on 'Forgot Password'\n3. Enter your email address\n4. Check your email for reset instructions\n5. Follow the link in the email to create a new password\n\nIf you don't receive the reset email within 10 minutes, please check your spam folder. If you're still having trouble, let me know and I can send a manual reset link.\n\nBest regards,\n{agent_name}",
                'category' => 'technical',
                'tags' => ['password', 'reset', 'login'],
            ],

            // Closing Messages
            [
                'name' => 'Ticket Closing',
                'content' => "Hi {customer_name},\n\nI hope the solution provided for ticket #{ticket_number} has resolved your issue.\n\nSince I haven't heard back from you, I'm marking this ticket as resolved. However, if you need any additional assistance or if the issue returns, please don't hesitate to reopen this ticket or create a new one.\n\nThank you for using our support services!\n\nBest regards,\n{agent_name}",
                'category' => 'closing',
                'tags' => ['closing', 'resolved', 'reopen'],
            ],
            [
                'name' => 'Case Closed Successfully',
                'content' => "Hello {customer_name},\n\nI'm happy to confirm that ticket #{ticket_number} has been successfully resolved!\n\nThank you for working with me to solve this issue. Your patience and cooperation made it possible to find the right solution.\n\nIf you have any other questions or need assistance in the future, please don't hesitate to contact our support team.\n\nHave a great day!\n\nBest regards,\n{agent_name}",
                'category' => 'closing',
                'tags' => ['success', 'closed', 'cooperation'],
            ],
        ];

        foreach ($cannedResponses as $response) {
            CannedResponse::create([
                'tenant_id' => $tenant->id,
                'name' => $response['name'],
                'content' => $response['content'],
                'category' => $response['category'],
                'tags' => $response['tags'],
                'is_active' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id,
                'usage_count' => rand(0, 25), // Random usage count for testing
            ]);
        }

        $this->command->info('Canned responses seeded successfully!');
    }
} 