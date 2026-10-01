<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransmissionRecipientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['recipient_type' => ['required', 'string', 'in:organization,contact,cc'], 'recipient_name' => ['required', 'string', 'max:255'], 'recipient_email' => ['nullable', 'email', 'max:255'], 'recipient_address' => ['nullable', 'string', 'max:1000']];
    }
}
