<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\ProjectMembership;
use App\Models\User;

class ProjectPolicy
{
    public function view(User $user, Project $project): bool
    {
        return $this->membership($user, $project)?->grants('project.view') ?? false;
    }

    public function viewAny(User $user): bool
    {
        return $user->memberships()->where('status', 'active')->exists();
    }

    private function membership(User $user, Project $project): ?ProjectMembership
    {
        return $user->memberships()->where('project_id', $project->id)->first();
    }
}
