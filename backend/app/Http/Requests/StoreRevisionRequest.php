<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRevisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'revision_code' => ['required', 'string', 'max:20', 'regex:/^[A-Za-z0-9][A-Za-z0-9._-]*$/'],
            'title' => ['required', 'string', 'max:255'],
            'purpose_of_issue' => ['nullable', 'string', 'max:100'],
            'change_reason' => ['required', 'string', 'max:1000'],
            'description' => ['nullable', 'string', 'max:5000'],
            'metadata_snapshot' => ['nullable', 'array'],
            'file' => ['required', 'file', 'max:51200', 'mimetypes:application/pdf,image/jpeg,image/png,image/tiff,application/dwg,application/dxf,application/octet-stream,text/plain'],
        ];
    }
}
