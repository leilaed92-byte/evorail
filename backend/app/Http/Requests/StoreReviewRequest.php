<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'revision_id' => ['required', 'uuid'],
            'assignee_user_id' => ['nullable', 'uuid'],
            'due_at' => ['nullable', 'date'],
        ];
    }
}
