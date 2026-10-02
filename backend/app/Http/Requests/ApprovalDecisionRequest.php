<?php

namespace App\Http\Requests;

use App\Enums\SuitabilityStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApprovalDecisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string', 'max:10000'],
            'suitability_status' => ['nullable', Rule::enum(SuitabilityStatus::class)],
        ];
    }
}
