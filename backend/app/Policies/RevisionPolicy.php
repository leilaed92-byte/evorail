<?php

namespace App\Policies;

use App\Models\DocumentRevision;
use App\Models\ProjectMembership;
use App\Models\User;

class RevisionPolicy
{
    public function view(User $user, DocumentRevision $revision): bool
    {
        return $this->membership($user, $revision->document->project_id)?->grants('revision.view') ?? false;
    }

    public function create(User $user, DocumentRevision $revision): bool
    {
        return $this->membership($user, $revision->document->project_id)?->grants('revision.create') ?? false;
    }

    public function preview(User $user, DocumentRevision $revision): bool
    {
        return $this->membership($user, $revision->document->project_id)?->grants('revision.preview') ?? false;
    }

    public function download(User $user, DocumentRevision $revision): bool
    {
        return $this->membership($user, $revision->document->project_id)?->grants('revision.download') ?? false;
    }

    private function membership(User $user, string $projectId): ?ProjectMembership
    {
        return $user->memberships()->where('project_id', $projectId)->first();
    }
}
