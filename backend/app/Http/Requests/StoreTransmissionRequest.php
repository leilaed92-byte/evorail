<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['reference' => ['nullable', 'string', 'max:255'], 'subject' => ['required', 'string', 'max:255'], 'purpose' => ['nullable', 'string', 'max:255'], 'type' => ['nullable', 'string', 'max:100']];
    }
}
