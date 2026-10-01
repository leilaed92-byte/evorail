<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $membership = $request->user()?->memberships->firstWhere('project_id', $this->id);

        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'phase' => $this->phase,
            'status' => $this->status,
            'organization' => [
                'id' => $this->organization?->id,
                'name' => $this->organization?->legal_name,
                'code' => $this->organization?->code,
            ],
            'role' => $membership?->role,
            'permissions' => [
                'viewProject' => $membership?->grants('project.view') ?? false,
                'createDocument' => $membership?->grants('document.create') ?? false,
                'createRevision' => $membership?->grants('revision.create') ?? false,
                'viewAudit' => $membership?->grants('audit.view') ?? false,
            ],
        ];
    }
}
