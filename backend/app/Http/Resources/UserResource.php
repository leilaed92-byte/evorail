<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $user = $this->resource;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'projects' => $user->relationLoaded('projects') ? $user->projects->map(function ($project) use ($user): array {
                $membership = $user->memberships->firstWhere('project_id', $project->id);

                return [
                    'id' => $project->id,
                    'code' => $project->code,
                    'name' => $project->name,
                    'role' => $membership?->role,
                    'permissions' => [
                        'viewProject' => $membership?->grants('project.view') ?? false,
                        'createDocument' => $membership?->grants('document.create') ?? false,
                        'createRevision' => $membership?->grants('revision.create') ?? false,
                        'viewAudit' => $membership?->grants('audit.view') ?? false,
                    ],
                ];
            })->values() : [],
        ];
    }
}
