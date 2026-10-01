<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RevisionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'document_id' => $this->document_id,
            'revision_code' => $this->revision_code,
            'revision_order' => $this->revision_order,
            'title' => $this->title,
            'workflow_status' => $this->workflow_status?->value,
            'suitability_status' => $this->suitability_status?->value,
            'effective_state' => $this->effective_state?->value,
            'purpose_of_issue' => $this->purpose_of_issue,
            'issue_date' => $this->issue_date?->toDateString(),
            'change_reason' => $this->change_reason,
            'description' => $this->description,
            'metadata_snapshot' => $this->metadata_snapshot,
            'file' => $this->whenLoaded('storedFile', fn (): ?array => $this->storedFile ? [
                'id' => $this->storedFile->id,
                'original_filename' => $this->storedFile->original_filename,
                'mime_type' => $this->storedFile->mime_type,
                'size' => $this->storedFile->size,
                'checksum' => $this->storedFile->checksum,
            ] : null),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
