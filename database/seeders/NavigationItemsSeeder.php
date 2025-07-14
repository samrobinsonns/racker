<?php

namespace Database\Seeders;

use App\Models\NavigationItem;
use App\Enums\Permission;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class NavigationItemsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing navigation items
        NavigationItem::truncate();

        $items = [
            // Core Navigation Items
            [
                'key' => 'dashboard',
                'label' => 'Dashboard',
                'icon' => 'HomeIcon',
                'route_name' => 'dashboard',
                'permission_required' => Permission::VIEW_DASHBOARD,
                'category' => NavigationItem::CATEGORY_CORE,
                'sort_order' => 1,
                'description' => 'Main dashboard view',
            ],
            [
                'key' => 'profile',
                'label' => 'My Profile',
                'icon' => 'UserIcon',
                'route_name' => 'profile.edit',
                'permission_required' => Permission::MANAGE_OWN_PROFILE,
                'category' => NavigationItem::CATEGORY_CORE,
                'sort_order' => 2,
                'description' => 'User profile management',
            ],
            [
                'key' => 'support_tickets',
                'label' => 'Support Tickets',
                'icon' => 'TicketIcon',
                'route_name' => 'support-tickets.index',
                'permission_required' => Permission::VIEW_SUPPORT_TICKETS,
                'category' => NavigationItem::CATEGORY_CORE,
                'sort_order' => 4,
                'description' => 'View and manage support tickets',
            ],
            [
                'key' => 'contacts',
                'label' => 'Contacts',
                'icon' => 'UserGroupIcon',
                'route_name' => 'tenant.contacts.index',
                'permission_required' => Permission::MANAGE_CONTACTS,
                'category' => NavigationItem::CATEGORY_CORE,
                'sort_order' => 5,
                'description' => 'Manage contact information and relationships',
            ],

            // Administrative Items
            [
                'key' => 'admin_dashboard',
                'label' => 'Admin Dashboard',
                'icon' => 'ChartBarIcon',
                'route_name' => 'tenant-admin.dashboard',
                'permission_required' => Permission::MANAGE_TENANT_USERS,
                'category' => NavigationItem::CATEGORY_ADMIN,
                'sort_order' => 10,
                'description' => 'Administrative overview and management tools',
            ],
            [
                'key' => 'manage_users',
                'label' => 'Manage Users',
                'icon' => 'UsersIcon',
                'route_name' => 'tenant-admin.users.index',
                'permission_required' => Permission::MANAGE_TENANT_USERS,
                'category' => NavigationItem::CATEGORY_ADMIN,
                'sort_order' => 11,
                'description' => 'User management interface',
            ],
            [
                'key' => 'tenant_settings',
                'label' => 'Settings',
                'icon' => 'Cog6ToothIcon',
                'route_name' => 'tenant-admin.settings',
                'permission_required' => Permission::MANAGE_TENANT_SETTINGS,
                'category' => NavigationItem::CATEGORY_ADMIN,
                'sort_order' => 12,
                'description' => 'Tenant configuration settings',
            ],
            [
                'key' => 'ticket_settings',
                'label' => 'Ticket Settings',
                'icon' => 'Cog6ToothIcon',
                'route_name' => 'tenant-admin.support-tickets.settings',
                'permission_required' => Permission::CONFIGURE_SUPPORT_TICKETS,
                'category' => NavigationItem::CATEGORY_ADMIN,
                'sort_order' => 15,
                'description' => 'Configure support ticket system settings',
            ],
            [
                'key' => 'ticket_analytics',
                'label' => 'Ticket Analytics',
                'icon' => 'ChartBarIcon',
                'route_name' => 'tenant-admin.support-tickets.analytics',
                'permission_required' => Permission::VIEW_TENANT_ANALYTICS,
                'category' => NavigationItem::CATEGORY_ADMIN,
                'sort_order' => 16,
                'description' => 'View support ticket analytics and insights',
            ],

            // Add new tenant navigation builder item
            [
                'key' => 'tenant_navigation',
                'label' => 'Navigation Builder',
                'icon' => 'Squares2X2Icon',
                'route_name' => 'tenant-admin.navigation.builder',
                'permission_required' => Permission::MANAGE_TENANT_SETTINGS,
                'category' => NavigationItem::CATEGORY_ADMIN,
                'sort_order' => 17,
                'description' => 'Customize tenant navigation layout',
            ],

            // Calendar Items
            [
                'key' => 'calendar',
                'label' => 'Calendar',
                'icon' => 'CalendarIcon',
                'route_name' => 'calendar.index',
                'permission_required' => Permission::VIEW_DASHBOARD,
                'category' => NavigationItem::CATEGORY_CORE,
                'sort_order' => 5,
                'description' => 'View and manage calendar events',
            ],
            [
                'key' => 'calendar_create',
                'label' => 'Create Event',
                'icon' => 'PlusIcon',
                'route_name' => 'calendar.create',
                'permission_required' => Permission::VIEW_DASHBOARD,
                'category' => NavigationItem::CATEGORY_CORE,
                'sort_order' => 6,
                'description' => 'Create a new calendar event',
            ],
            [
                'key' => 'calendar_manage',
                'label' => 'Manage Calendars',
                'icon' => 'Cog6ToothIcon',
                'route_name' => 'calendar.manage',
                'permission_required' => Permission::MANAGE_TENANT_SETTINGS,
                'category' => NavigationItem::CATEGORY_ADMIN,
                'sort_order' => 18,
                'description' => 'Manage calendar settings and sharing',
            ],

            // Custom Items
            [
                'key' => 'external_link',
                'label' => 'External Link',
                'icon' => 'LinkIcon',
                'route_name' => '#',
                'permission_required' => null,
                'category' => NavigationItem::CATEGORY_CUSTOM,
                'sort_order' => 30,
                'description' => 'External link placeholder',
            ],
            [
                'key' => 'divider',
                'label' => 'Divider',
                'icon' => 'MinusIcon',
                'route_name' => '',
                'permission_required' => null,
                'category' => NavigationItem::CATEGORY_CUSTOM,
                'sort_order' => 31,
                'description' => 'Visual separator in navigation',
            ],
        ];

        foreach ($items as $item) {
            NavigationItem::create($item);
        }

        $this->command->info('Navigation items library seeded successfully!');
    }
} 