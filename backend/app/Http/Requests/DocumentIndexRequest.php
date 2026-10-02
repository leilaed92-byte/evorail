<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DocumentIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:200'],
            'workflow_status' => ['nullable', 'string', Rule::in(['draft', 'submitted', 'under_review', 'returned', 'resubmitted', 'completed'])],
            'suitability' => ['nullable', 'string', Rule::in(['for_information', 'for_review', 'for_approval', 'approved', 'issued_for_construction', 'as_built'])],
            'effective_state' => ['nullable', 'string', Rule::in(['current', 'superseded', 'withdrawn', 'archived'])],
            'discipline' => ['nullable', 'string', 'max:100'],
            'document_type' => ['nullable', 'string', Rule::in(['document', 'drawing'])],
            'drawing_type' => ['nullable', 'string', 'max:100'],
            'zone' => ['nullable', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:200'],
            'revision' => ['nullable', 'string', 'max:20'],
            'current_only' => ['nullable', 'boolean'],
            'sort' => ['nullable', 'string', Rule::in(['document_number', '-document_number', 'title', '-title', 'drawing_type', '-drawing_type', 'zone', '-zone', 'updated_at', '-updated_at'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
