<?php

namespace App\Policies;

use App\Models\CannedResponse;
use App\Models\User;
use App\Enums\Permission;

class CannedResponsePolicy
{
    /**
     * Determine whether the user can view any canned responses.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Permission::CONFIGURE_SUPPORT_TICKETS);
    }

    /**
     * Determine whether the user can view the canned response.
     */
    public function view(User $user, CannedResponse $cannedResponse): bool
    {
        return $user->hasPermission(Permission::CONFIGURE_SUPPORT_TICKETS) && 
               $cannedResponse->tenant_id === $user->tenant_id;
    }

    /**
     * Determine whether the user can create canned responses.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission(Permission::CONFIGURE_SUPPORT_TICKETS);
    }

    /**
     * Determine whether the user can update the canned response.
     */
    public function update(User $user, CannedResponse $cannedResponse): bool
    {
        return $user->hasPermission(Permission::CONFIGURE_SUPPORT_TICKETS) && 
               $cannedResponse->tenant_id === $user->tenant_id;
    }

    /**
     * Determine whether the user can delete the canned response.
     */
    public function delete(User $user, CannedResponse $cannedResponse): bool
    {
        return $user->hasPermission(Permission::CONFIGURE_SUPPORT_TICKETS) && 
               $cannedResponse->tenant_id === $user->tenant_id;
    }
} 