<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTransmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['reference' => ['sometimes', 'nullable', 'string', 'max:255'], 'subject' => ['sometimes', 'string', 'max:255'], 'purpose' => ['sometimes', 'nullable', 'string', 'max:255'], 'type' => ['sometimes', 'nullable', 'string', 'max:100']];
    }
}
