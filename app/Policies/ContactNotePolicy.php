<?php

namespace App\Policies;

use App\Models\ContactNote;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ContactNotePolicy
{
    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ContactNote $contactNote): bool
    {
        return $user->id === $contactNote->user_id &&
               $user->tenant_id === $contactNote->tenant_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ContactNote $contactNote): bool
    {
        return $user->id === $contactNote->user_id &&
               $user->tenant_id === $contactNote->tenant_id;
    }
} 