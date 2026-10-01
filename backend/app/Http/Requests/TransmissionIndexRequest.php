<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransmissionIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', 'in:draft,issued,cancelled'],
            'issuer_user_id' => ['nullable', 'uuid'],
            'issuer' => ['nullable', 'uuid'],
            'recipient' => ['nullable', 'string', 'max:255'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'search' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'in:reference,-reference,subject,-subject,created_at,-created_at,issued_at,-issued_at,status,-status'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
