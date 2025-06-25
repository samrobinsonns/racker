<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create the central admin user
        $centralAdmin = User::firstOrCreate(
            ['email' => 'admin@racker.com'],
            [
                'name' => 'Central Administrator',
                'password' => Hash::make('password'), // Change this in production!
                'email_verified_at' => now(),
                'is_central_admin' => true,
                'tenant_id' => null, // Central admin doesn't belong to any specific tenant
            ]
        );

        // Get the central admin role
        $centralAdminRole = Role::where('name', 'central_admin')->where('type', 'central')->first();

        if ($centralAdminRole && !$centralAdmin->roles()->where('role_id', $centralAdminRole->id)->exists()) {
            $centralAdmin->assignRole($centralAdminRole->id, null); // null tenant_id for central roles
        }

        $this->command->info('Central admin user created successfully!');
        $this->command->info('Email: admin@racker.com');
        $this->command->info('Password: password');
        $this->command->warn('⚠️  Please change the default password in production!');
    }
}
