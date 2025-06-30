<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateContactPreferenceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->contact->tenant_id === auth()->user()->tenant_id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email_notifications' => ['required', 'boolean'],
            'sms_notifications' => ['required', 'boolean'],
            'marketing_emails' => ['required', 'boolean'],
            'marketing_sms' => ['required', 'boolean'],
            'newsletter_subscription' => ['required', 'boolean'],
            'service_updates' => ['required', 'boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            '*.required' => 'This preference setting is required.',
            '*.boolean' => 'This preference must be either enabled or disabled.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'email_notifications' => 'email notifications',
            'sms_notifications' => 'SMS notifications',
            'marketing_emails' => 'marketing emails',
            'marketing_sms' => 'marketing SMS',
            'newsletter_subscription' => 'newsletter subscription',
            'service_updates' => 'service updates',
        ];
    }
} 