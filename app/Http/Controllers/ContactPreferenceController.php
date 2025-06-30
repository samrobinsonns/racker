<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\ContactCommunicationPreference;
use Illuminate\Http\Request;
use App\Http\Requests\UpdateContactPreferenceRequest;

class ContactPreferenceController extends Controller
{
    /**
     * Update the contact's communication preferences.
     */
    public function update(UpdateContactPreferenceRequest $request, Contact $contact)
    {
        $preferences = $contact->communicationPreferences()->updateOrCreate(
            ['contact_id' => $contact->id],
            $request->validated()
        );

        // Log the preference change for compliance
        activity()
            ->performedOn($contact)
            ->causedBy(auth()->user())
            ->withProperties([
                'old_preferences' => $contact->communicationPreferences?->toArray() ?? [],
                'new_preferences' => $preferences->toArray(),
            ])
            ->log('communication_preferences_updated');

        return response()->json([
            'preferences' => $preferences,
            'message' => 'Communication preferences updated successfully',
        ]);
    }

    /**
     * Get the contact's communication preferences history.
     */
    public function history(Contact $contact)
    {
        $this->authorize('view', $contact);

        $history = activity()
            ->performedOn($contact)
            ->where('description', 'communication_preferences_updated')
            ->latest()
            ->get();

        return response()->json([
            'history' => $history,
        ]);
    }

    /**
     * Opt out a contact from all communications.
     */
    public function optOut(Contact $contact)
    {
        $preferences = $contact->communicationPreferences()->updateOrCreate(
            ['contact_id' => $contact->id],
            [
                'email_notifications' => false,
                'sms_notifications' => false,
                'marketing_emails' => false,
                'marketing_sms' => false,
                'newsletter_subscription' => false,
                'service_updates' => false,
            ]
        );

        // Log the opt-out for compliance
        activity()
            ->performedOn($contact)
            ->causedBy(auth()->user())
            ->withProperties([
                'action' => 'opt_out',
                'old_preferences' => $contact->communicationPreferences?->toArray() ?? [],
                'new_preferences' => $preferences->toArray(),
            ])
            ->log('communication_preferences_opt_out');

        return response()->json([
            'preferences' => $preferences,
            'message' => 'Contact has been opted out of all communications',
        ]);
    }
} 