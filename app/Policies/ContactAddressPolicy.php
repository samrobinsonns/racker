<?php

namespace App\Policies;

use App\Models\ContactAddress;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ContactAddressPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ContactAddress $address): bool
    {
        return $user->tenant_id === $address->contact->tenant_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ContactAddress $address): bool
    {
        return $user->tenant_id === $address->contact->tenant_id;
    }
} 