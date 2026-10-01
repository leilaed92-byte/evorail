<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReviewIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', 'in:open,in_progress,returned,completed,cancelled'],
            'assignee_user_id' => ['nullable', 'uuid'],
            'assignee' => ['nullable', 'uuid'],
            'due_from' => ['nullable', 'date'],
            'due_to' => ['nullable', 'date'],
            'overdue' => ['nullable', 'boolean'],
            'discipline' => ['nullable', 'string', 'max:100'],
            'document_id' => ['nullable', 'uuid'],
            'revision_id' => ['nullable', 'uuid'],
            'sort' => ['nullable', 'in:due_at,-due_at,created_at,-created_at,status,-status'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
