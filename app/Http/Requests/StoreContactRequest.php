<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreContactRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization will be handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'mobile' => ['nullable', 'string', 'max:50'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,inactive,archived'],
            'type' => ['required', 'string', 'in:customer,lead,vendor,partner'],
            'source' => ['nullable', 'string', 'max:255'],
            'owner_id' => ['nullable', 'exists:users,id'],
            
            // Related data
            'custom_fields' => ['nullable', 'array'],
            'custom_fields.*' => ['nullable'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['exists:contact_tags,id'],
            
            // Communication preferences
            'communication_preferences' => ['nullable', 'array'],
            'communication_preferences.email_notifications' => ['nullable', 'boolean'],
            'communication_preferences.sms_notifications' => ['nullable', 'boolean'],
            'communication_preferences.marketing_emails' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.email' => 'Please enter a valid email address.',
            'status.in' => 'The selected status is invalid.',
            'type.in' => 'The selected type is invalid.',
            'owner_id.exists' => 'The selected owner is invalid.',
            'tags.*.exists' => 'One or more selected tags are invalid.',
        ];
    }
}
