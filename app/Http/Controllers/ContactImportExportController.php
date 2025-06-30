<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Jobs\ImportContacts;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use League\Csv\Writer;
use League\Csv\Reader;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContactImportExportController extends Controller
{
    /**
     * Export contacts to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $this->authorize('export', Contact::class);

        $contacts = Contact::where('tenant_id', auth()->user()->tenant_id)
            ->with(['addresses', 'tags', 'communicationPreferences'])
            ->get();

        $csv = Writer::createFromString('');
        
        // Add headers
        $csv->insertOne([
            'First Name',
            'Last Name',
            'Email',
            'Phone',
            'Company',
            'Job Title',
            'Primary Address',
            'Tags',
            'Email Notifications',
            'SMS Notifications',
            'Marketing Emails',
            'Marketing SMS',
            'Newsletter Subscription',
            'Service Updates',
            'Created At',
            'Updated At'
        ]);

        // Add data
        foreach ($contacts as $contact) {
            $primaryAddress = $contact->addresses->where('is_primary', true)->first();
            $addressString = $primaryAddress ? sprintf(
                '%s, %s, %s, %s %s',
                $primaryAddress->street,
                $primaryAddress->city,
                $primaryAddress->state,
                $primaryAddress->postal_code,
                $primaryAddress->country
            ) : '';

            $csv->insertOne([
                $contact->first_name,
                $contact->last_name,
                $contact->email,
                $contact->phone,
                $contact->company,
                $contact->job_title,
                $addressString,
                $contact->tags->pluck('name')->implode(', '),
                $contact->communicationPreferences?->email_notifications ? 'Yes' : 'No',
                $contact->communicationPreferences?->sms_notifications ? 'Yes' : 'No',
                $contact->communicationPreferences?->marketing_emails ? 'Yes' : 'No',
                $contact->communicationPreferences?->marketing_sms ? 'Yes' : 'No',
                $contact->communicationPreferences?->newsletter_subscription ? 'Yes' : 'No',
                $contact->communicationPreferences?->service_updates ? 'Yes' : 'No',
                $contact->created_at->format('Y-m-d H:i:s'),
                $contact->updated_at->format('Y-m-d H:i:s')
            ]);
        }

        return response()->streamDownload(function () use ($csv) {
            echo $csv->toString();
        }, 'contacts-' . now()->format('Y-m-d') . '.csv');
    }

    /**
     * Import contacts from CSV.
     */
    public function import(Request $request)
    {
        $this->authorize('import', Contact::class);

        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240']
        ]);

        $path = $request->file('file')->store('imports');
        $csv = Reader::createFromPath(Storage::path($path), 'r');
        $csv->setHeaderOffset(0);

        $headers = $csv->getHeader();
        $requiredHeaders = ['First Name', 'Last Name', 'Email'];
        
        $missingHeaders = array_diff($requiredHeaders, $headers);
        if (!empty($missingHeaders)) {
            Storage::delete($path);
            return back()->withErrors([
                'file' => 'The CSV file is missing required columns: ' . implode(', ', $missingHeaders)
            ]);
        }

        // Sample validation of first few rows
        $records = $csv->getRecords();
        $sampleSize = min(5, iterator_count($records));
        $validator = Validator::make(iterator_to_array($records, true), [
            '*.Email' => 'required|email',
            '*.First Name' => 'required|string|max:255',
            '*.Last Name' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            Storage::delete($path);
            return back()->withErrors([
                'file' => 'The CSV file contains invalid data. Please check the format and try again.'
            ]);
        }

        // Queue the import job
        ImportContacts::dispatch(
            Storage::path($path),
            auth()->user()->tenant_id
        );

        return back()->with('status', 'Contact import has been queued and will be processed shortly.');
    }

    /**
     * Download import template.
     */
    public function template(): StreamedResponse
    {
        $csv = Writer::createFromString('');
        
        $csv->insertOne([
            'First Name',
            'Last Name',
            'Email',
            'Phone',
            'Company',
            'Job Title',
            'Street',
            'City',
            'State',
            'Postal Code',
            'Country',
            'Tags',
            'Email Notifications',
            'SMS Notifications',
            'Marketing Emails',
            'Marketing SMS',
            'Newsletter Subscription',
            'Service Updates'
        ]);

        return response()->streamDownload(function () use ($csv) {
            echo $csv->toString();
        }, 'contacts-import-template.csv');
    }
} 