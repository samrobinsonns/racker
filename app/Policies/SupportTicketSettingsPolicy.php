<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class SupportTicketSettingsPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view support ticket settings.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission([
            'configure_support_tickets',
            'manage_support_tickets'
        ]);
    }

    /**
     * Determine whether the user can update support ticket settings.
     */
    public function update(User $user): bool
    {
        return $user->hasPermission('configure_support_tickets');
    }
} 