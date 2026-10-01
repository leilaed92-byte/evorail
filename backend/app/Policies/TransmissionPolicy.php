<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\ProjectMembership;
use App\Models\Transmission;
use App\Models\User;

class TransmissionPolicy
{
    public function viewAny(User $user, Project $project): bool
    {
        return $this->membership($user, $project->id)?->grants('transmission.list') ?? false;
    }

    public function view(User $user, Transmission $transmission): bool
    {
        return $this->membership($user, $transmission->project_id)?->grants('transmission.view') ?? false;
    }

    public function create(User $user, Project $project): bool
    {
        return $this->membership($user, $project->id)?->grants('transmission.create') ?? false;
    }

    public function updateDraft(User $user, Transmission $transmission): bool
    {
        return $this->isDraftActionAllowed($user, $transmission, 'transmission.updateDraft');
    }

    public function issue(User $user, Transmission $transmission): bool
    {
        return $this->membership($user, $transmission->project_id)?->grants('transmission.issue') ?? false;
    }

    public function download(User $user, Transmission $transmission): bool
    {
        return $transmission->status?->value === 'issued' && ($this->membership($user, $transmission->project_id)?->grants('transmission.download') ?? false);
    }

    private function isDraftActionAllowed(User $user, Transmission $transmission, string $capability): bool
    {
        return $transmission->status?->value === 'draft'
            && ($this->membership($user, $transmission->project_id)?->grants($capability) ?? false);
    }

    private function membership(User $user, string $projectId): ?ProjectMembership
    {
        return $user->memberships()->where('project_id', $projectId)->first();
    }
}
