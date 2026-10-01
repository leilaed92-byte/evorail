<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApprovalResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'document_id' => $this->document_id,
            'revision_id' => $this->revision_id,
            'status' => $this->status?->value,
            'approver' => $this->whenLoaded('approver', fn (): ?array => $this->approver ? ['id' => $this->approver->id, 'name' => $this->approver->name, 'email' => $this->approver->email] : null),
            'requested_by' => $this->whenLoaded('requester', fn (): ?array => $this->requester ? ['id' => $this->requester->id, 'name' => $this->requester->name] : null),
            'document' => $this->whenLoaded('document', fn (): ?array => $this->document ? ['id' => $this->document->id, 'document_number' => $this->document->document_number, 'title' => $this->document->title, 'discipline' => $this->document->discipline] : null),
            'revision' => $this->whenLoaded('revision', fn (): ?array => $this->revision ? [
                'id' => $this->revision->id,
                'revision_code' => $this->revision->revision_code,
                'title' => $this->revision->title,
                'workflow_status' => $this->revision->workflow_status?->value,
                'suitability_status' => $this->revision->suitability_status?->value,
                'effective_state' => $this->revision->effective_state?->value,
            ] : null),
            'requested_at' => $this->requested_at?->toISOString(),
            'decided_at' => $this->decided_at?->toISOString(),
            'decision_reason' => $this->decision_reason,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
