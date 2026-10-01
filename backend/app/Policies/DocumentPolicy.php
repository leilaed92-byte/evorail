<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\Project;
use App\Models\ProjectMembership;
use App\Models\User;

class DocumentPolicy
{
    public function viewAny(User $user, Project $project): bool
    {
        return $this->membership($user, $project->id)?->grants('document.list') ?? false;
    }

    public function view(User $user, Document $document): bool
    {
        return $this->membership($user, $document->project_id)?->grants('document.view') ?? false;
    }

    public function create(User $user, Project $project): bool
    {
        return $this->membership($user, $project->id)?->grants('document.create') ?? false;
    }

    public function update(User $user, Document $document): bool
    {
        return $this->membership($user, $document->project_id)?->grants('document.update') ?? false;
    }

    private function membership(User $user, string $projectId): ?ProjectMembership
    {
        return $user->memberships()->where('project_id', $projectId)->first();
    }
}
