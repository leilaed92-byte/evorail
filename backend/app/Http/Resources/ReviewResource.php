<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
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
            'assignee' => $this->whenLoaded('assignee', fn (): ?array => $this->assignee ? ['id' => $this->assignee->id, 'name' => $this->assignee->name, 'email' => $this->assignee->email] : null),
            'created_by' => $this->whenLoaded('creator', fn (): ?array => $this->creator ? ['id' => $this->creator->id, 'name' => $this->creator->name] : null),
            'document' => $this->whenLoaded('document', fn (): ?array => $this->document ? ['id' => $this->document->id, 'document_number' => $this->document->document_number, 'title' => $this->document->title, 'discipline' => $this->document->discipline] : null),
            'revision' => $this->whenLoaded('revision', fn (): ?array => $this->revision ? [
                'id' => $this->revision->id,
                'revision_code' => $this->revision->revision_code,
                'title' => $this->revision->title,
                'workflow_status' => $this->revision->workflow_status?->value,
                'suitability_status' => $this->revision->suitability_status?->value,
                'effective_state' => $this->revision->effective_state?->value,
            ] : null),
            'due_at' => $this->due_at?->toISOString(),
            'started_at' => $this->started_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
            'returned_at' => $this->returned_at?->toISOString(),
            'comments' => ReviewCommentResource::collection($this->whenLoaded('comments')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
