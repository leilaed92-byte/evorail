<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApprovalIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', 'in:pending,approved,rejected,cancelled'],
            'approver_user_id' => ['nullable', 'uuid'],
            'approver' => ['nullable', 'uuid'],
            'discipline' => ['nullable', 'string', 'max:100'],
            'document_id' => ['nullable', 'uuid'],
            'revision_id' => ['nullable', 'uuid'],
            'sort' => ['nullable', 'in:requested_at,-requested_at,decided_at,-decided_at,status,-status'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
