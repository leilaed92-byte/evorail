<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'document_number' => $this->document_number,
            'title' => $this->title,
            'discipline' => $this->discipline,
            'workflow_status' => $this->workflow_status?->value,
            'suitability_status' => $this->suitability_status?->value,
            'effective_state' => $this->effective_state?->value,
            'current_revision_id' => $this->current_revision_id,
            'current_revision' => $this->whenLoaded('currentRevision', fn (): ?array => $this->currentRevision ? [
                'id' => $this->currentRevision->id,
                'revision_code' => $this->currentRevision->revision_code,
                'title' => $this->currentRevision->title,
                'workflow_status' => $this->currentRevision->workflow_status?->value,
                'suitability_status' => $this->currentRevision->suitability_status?->value,
                'effective_state' => $this->currentRevision->effective_state?->value,
            ] : null),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
