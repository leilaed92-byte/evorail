<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreApprovalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'revision_id' => ['required', 'uuid'],
            'approver_user_id' => ['required', 'uuid'],
        ];
    }
}
