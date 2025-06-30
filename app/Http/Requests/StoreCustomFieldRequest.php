<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomFieldRequest extends FormRequest
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
            'field_name' => ['required', 'string', 'max:255'],
            'field_type' => ['required', 'string', 'in:text,number,date,select,multiselect,checkbox'],
            'field_options' => [
                'nullable',
                'array',
                'required_if:field_type,select,multiselect'
            ],
            'field_options.*' => ['string', 'max:255'],
            'is_required' => ['boolean'],
            'sort_order' => ['nullable', 'integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'field_name.required' => 'The field name is required.',
            'field_type.in' => 'The selected field type is invalid.',
            'field_options.required_if' => 'Options are required for select and multiselect fields.',
            'field_options.*.string' => 'All options must be text.',
        ];
    }
}
