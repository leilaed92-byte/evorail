<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransmissionItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'transmission_id' => $this->transmission_id, 'document_id' => $this->document_id, 'revision_id' => $this->revision_id,
            'document' => $this->whenLoaded('document', fn (): ?array => $this->document ? ['id' => $this->document->id, 'document_number' => $this->document->document_number, 'title' => $this->document->title, 'discipline' => $this->document->discipline] : null),
            'revision' => $this->whenLoaded('revision', fn (): ?array => $this->revision ? ['id' => $this->revision->id, 'revision_code' => $this->revision->revision_code, 'title' => $this->revision->title, 'workflow_status' => $this->revision->workflow_status?->value, 'suitability_status' => $this->revision->suitability_status?->value, 'effective_state' => $this->revision->effective_state?->value] : null),
            'snapshot' => ['document_number' => $this->document_number_snapshot, 'document_title' => $this->document_title_snapshot, 'revision_code' => $this->revision_code_snapshot, 'discipline' => $this->discipline_snapshot, 'suitability' => $this->suitability_snapshot, 'workflow' => $this->workflow_snapshot, 'effective_state' => $this->effective_state_snapshot, 'file_name' => $this->file_name_snapshot, 'file_checksum' => $this->file_checksum_snapshot, 'file_size' => $this->file_size_snapshot, 'file_mime_type' => $this->file_mime_type_snapshot],
        ];
    }
}
