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
                'key' => 'messages',
                'label' => 'Messages',
                'icon' => 'ChatBubbleLeftRightIcon',
                'route_name' => 'messages',
                'permission_required' => Permission::VIEW_TENANT_DATA,
                'category' => NavigationItem::CATEGORY_CORE,
                'sort_order' => 3,
                'description' => 'Real-time messaging and conversations',
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

            // Content Management Items
            [
                'key' => 'reports',
                'label' => 'Reports',
                'icon' => 'ChartBarIcon',
                'route_name' => 'tenant.reports',
                'permission_required' => Permission::VIEW_REPORTS,
                'category' => NavigationItem::CATEGORY_CONTENT,
                'sort_order' => 20,
                'description' => 'View and generate reports',
            ],
            [
                'key' => 'content',
                'label' => 'Content',
                'icon' => 'DocumentTextIcon',
                'route_name' => 'tenant.content',
                'permission_required' => Permission::VIEW_TENANT_DATA,
                'category' => NavigationItem::CATEGORY_CONTENT,
                'sort_order' => 21,
                'description' => 'Content management system',
            ],
            [
                'key' => 'analytics',
                'label' => 'Analytics',
                'icon' => 'ChartPieIcon',
                'route_name' => 'tenant.analytics',
                'permission_required' => Permission::VIEW_TENANT_ANALYTICS,
                'category' => NavigationItem::CATEGORY_CONTENT,
                'sort_order' => 22,
                'description' => 'Analytics and insights',
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
            NavigationItem::firstOrCreate(
                ['key' => $item['key']],
                $item
            );
        }

        $this->command->info('Navigation items library seeded successfully!');
    }
} 