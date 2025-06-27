<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupportTicketSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Default Priorities
        $priorities = [
            [
                'name' => 'Critical',
                'slug' => 'critical',
                'description' => 'System-critical issues requiring immediate attention',
                'level' => 1,
                'color' => '#dc2626', // Red
                'response_time_hours' => 1,
                'resolution_time_hours' => 4,
                'is_active' => true,
                'is_system' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'High',
                'slug' => 'high',
                'description' => 'Urgent issues affecting business operations',
                'level' => 2,
                'color' => '#ea580c', // Orange
                'response_time_hours' => 2,
                'resolution_time_hours' => 8,
                'is_active' => true,
                'is_system' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Medium',
                'slug' => 'medium',
                'description' => 'Important issues requiring attention',
                'level' => 3,
                'color' => '#eab308', // Yellow
                'response_time_hours' => 4,
                'resolution_time_hours' => 24,
                'is_active' => true,
                'is_system' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Low',
                'slug' => 'low',
                'description' => 'Minor issues or enhancement requests',
                'level' => 4,
                'color' => '#22c55e', // Green
                'response_time_hours' => 8,
                'resolution_time_hours' => 48,
                'is_active' => true,
                'is_system' => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($priorities as $priority) {
            DB::table('support_ticket_priorities')->insertOrIgnore($priority);
        }

        // Default Statuses
        $statuses = [
            [
                'name' => 'New',
                'slug' => 'new',
                'description' => 'Newly created ticket',
                'color' => '#3b82f6', // Blue
                'type' => 'initial',
                'is_active' => true,
                'is_system' => true,
                'is_closed' => false,
                'is_resolved' => false,
                'sort_order' => 1,
                'next_statuses' => json_encode(['open', 'in-progress', 'closed']),
            ],
            [
                'name' => 'Open',
                'slug' => 'open',
                'description' => 'Ticket is being reviewed',
                'color' => '#6366f1', // Indigo
                'type' => 'active',
                'is_active' => true,
                'is_system' => true,
                'is_closed' => false,
                'is_resolved' => false,
                'sort_order' => 2,
                'next_statuses' => json_encode(['in-progress', 'waiting', 'resolved', 'closed']),
            ],
            [
                'name' => 'In Progress',
                'slug' => 'in-progress',
                'description' => 'Work is being done on the ticket',
                'color' => '#8b5cf6', // Purple
                'type' => 'active',
                'is_active' => true,
                'is_system' => true,
                'is_closed' => false,
                'is_resolved' => false,
                'sort_order' => 3,
                'next_statuses' => json_encode(['waiting', 'resolved', 'closed']),
            ],
            [
                'name' => 'Waiting',
                'slug' => 'waiting',
                'description' => 'Waiting for customer response',
                'color' => '#ec4899', // Pink
                'type' => 'pending',
                'is_active' => true,
                'is_system' => true,
                'is_closed' => false,
                'is_resolved' => false,
                'sort_order' => 4,
                'next_statuses' => json_encode(['in-progress', 'resolved', 'closed']),
            ],
            [
                'name' => 'Resolved',
                'slug' => 'resolved',
                'description' => 'Issue has been resolved',
                'color' => '#22c55e', // Green
                'type' => 'completed',
                'is_active' => true,
                'is_system' => true,
                'is_closed' => false,
                'is_resolved' => true,
                'sort_order' => 5,
                'next_statuses' => json_encode(['closed', 'open']),
            ],
            [
                'name' => 'Closed',
                'slug' => 'closed',
                'description' => 'Ticket has been closed',
                'color' => '#64748b', // Slate
                'type' => 'completed',
                'is_active' => true,
                'is_system' => true,
                'is_closed' => true,
                'is_resolved' => true,
                'sort_order' => 6,
                'next_statuses' => json_encode(['open']),
            ],
        ];

        foreach ($statuses as $status) {
            DB::table('support_ticket_statuses')->insertOrIgnore($status);
        }

        // Default Categories for each tenant
        $tenants = DB::table('tenants')->get();
        
        $defaultCategories = [
            [
                'name' => 'Technical Support',
                'description' => 'Technical issues and system problems',
                'color' => '#3b82f6', // Blue
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Account Management',
                'description' => 'Account-related inquiries and issues',
                'color' => '#8b5cf6', // Purple
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Billing',
                'description' => 'Billing and payment related issues',
                'color' => '#22c55e', // Green
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Feature Request',
                'description' => 'Suggestions for new features or improvements',
                'color' => '#eab308', // Yellow
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'name' => 'Bug Report',
                'description' => 'Report software bugs and issues',
                'color' => '#ef4444', // Red
                'is_active' => true,
                'sort_order' => 5,
            ],
        ];

        foreach ($tenants as $tenant) {
            foreach ($defaultCategories as $category) {
                $category['tenant_id'] = $tenant->id;
                DB::table('support_ticket_categories')->insertOrIgnore($category);
            }
        }
    }
} 