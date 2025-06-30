<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ContactImportExportPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can import contacts.
     */
    public function import(User $user): bool
    {
        return true; // Can be restricted based on user role/permissions
    }

    /**
     * Determine whether the user can export contacts.
     */
    public function export(User $user): bool
    {
        return true; // Can be restricted based on user role/permissions
    }
} 