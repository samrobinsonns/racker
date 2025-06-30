<?php

namespace App\Jobs;

use App\Models\Contact;
use App\Models\Tag;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use League\Csv\Reader;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ImportContacts implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 3600;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private string $filePath,
        private int $tenantId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $csv = Reader::createFromPath($this->filePath, 'r');
        $csv->setHeaderOffset(0);

        DB::beginTransaction();
        try {
            foreach ($csv->getRecords() as $record) {
                $contact = Contact::updateOrCreate(
                    [
                        'email' => $record['Email'],
                        'tenant_id' => $this->tenantId
                    ],
                    [
                        'first_name' => $record['First Name'],
                        'last_name' => $record['Last Name'],
                        'phone' => $record['Phone'] ?? null,
                        'company' => $record['Company'] ?? null,
                        'job_title' => $record['Job Title'] ?? null,
                    ]
                );

                // Process address if provided
                if (!empty($record['Street'])) {
                    $contact->addresses()->updateOrCreate(
                        [
                            'is_primary' => true,
                        ],
                        [
                            'street' => $record['Street'],
                            'city' => $record['City'] ?? null,
                            'state' => $record['State'] ?? null,
                            'postal_code' => $record['Postal Code'] ?? null,
                            'country' => $record['Country'] ?? null,
                            'type' => 'primary',
                        ]
                    );
                }

                // Process tags
                if (!empty($record['Tags'])) {
                    $tagNames = array_map('trim', explode(',', $record['Tags']));
                    $tags = collect($tagNames)->map(function ($name) {
                        return Tag::firstOrCreate(
                            [
                                'name' => $name,
                                'tenant_id' => $this->tenantId
                            ]
                        );
                    });
                    $contact->tags()->sync($tags->pluck('id'));
                }

                // Process communication preferences
                $contact->communicationPreferences()->updateOrCreate(
                    ['contact_id' => $contact->id],
                    [
                        'email_notifications' => $this->parseBoolean($record['Email Notifications'] ?? 'Yes'),
                        'sms_notifications' => $this->parseBoolean($record['SMS Notifications'] ?? 'No'),
                        'marketing_emails' => $this->parseBoolean($record['Marketing Emails'] ?? 'Yes'),
                        'marketing_sms' => $this->parseBoolean($record['Marketing SMS'] ?? 'No'),
                        'newsletter_subscription' => $this->parseBoolean($record['Newsletter Subscription'] ?? 'Yes'),
                        'service_updates' => $this->parseBoolean($record['Service Updates'] ?? 'Yes'),
                    ]
                );
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Contact import failed: ' . $e->getMessage(), [
                'tenant_id' => $this->tenantId,
                'file' => $this->filePath,
            ]);
            throw $e;
        } finally {
            Storage::delete($this->filePath);
        }
    }

    /**
     * Parse boolean values from various string formats.
     */
    private function parseBoolean(string $value): bool
    {
        return in_array(strtolower(trim($value)), ['yes', 'true', '1', 'on'], true);
    }
} 