<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\ContactAddress;
use Illuminate\Http\Request;
use App\Http\Requests\StoreContactAddressRequest;
use App\Http\Requests\UpdateContactAddressRequest;

class ContactAddressController extends Controller
{
    /**
     * Store a newly created address.
     */
    public function store(StoreContactAddressRequest $request, Contact $contact)
    {
        // If this is set as primary, unset any existing primary address
        if ($request->is_primary) {
            $contact->addresses()->where('is_primary', true)->update(['is_primary' => false]);
        }
        // If this is the first address, make it primary by default
        elseif ($contact->addresses()->count() === 0) {
            $request->merge(['is_primary' => true]);
        }

        $address = $contact->addresses()->create($request->validated());

        return response()->json([
            'address' => $address,
            'message' => 'Address added successfully',
        ]);
    }

    /**
     * Update the specified address.
     */
    public function update(UpdateContactAddressRequest $request, ContactAddress $address)
    {
        // If this is set as primary, unset any existing primary address
        if ($request->is_primary && !$address->is_primary) {
            $address->contact->addresses()
                ->where('id', '!=', $address->id)
                ->where('is_primary', true)
                ->update(['is_primary' => false]);
        }

        $address->update($request->validated());

        return response()->json([
            'address' => $address,
            'message' => 'Address updated successfully',
        ]);
    }

    /**
     * Remove the specified address.
     */
    public function destroy(ContactAddress $address)
    {
        $this->authorize('delete', $address);

        // If this was the primary address and there are other addresses,
        // make the first remaining address primary
        if ($address->is_primary) {
            $nextAddress = $address->contact->addresses()
                ->where('id', '!=', $address->id)
                ->first();
            
            if ($nextAddress) {
                $nextAddress->update(['is_primary' => true]);
            }
        }

        $address->delete();

        return response()->json([
            'message' => 'Address deleted successfully',
        ]);
    }
} 