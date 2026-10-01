<?php

namespace App\Policies;

use App\Models\Approval;
use App\Models\Project;
use App\Models\ProjectMembership;
use App\Models\User;

class ApprovalPolicy
{
    public function viewAny(User $user, Project $project): bool
    {
        return $this->membership($user, $project->id)?->grants('approval.view') ?? false;
    }

    public function view(User $user, Approval $approval): bool
    {
        return $this->membership($user, $approval->project_id)?->grants('approval.view') ?? false;
    }

    public function approve(User $user, Approval $approval): bool
    {
        return $this->canDecide($user, $approval, 'approval.approve');
    }

    public function reject(User $user, Approval $approval): bool
    {
        return $this->canDecide($user, $approval, 'approval.reject');
    }

    public function create(User $user, Project $project): bool
    {
        return $this->membership($user, $project->id)?->grants('approval.view') ?? false;
    }

    private function canDecide(User $user, Approval $approval, string $capability): bool
    {
        $membership = $this->membership($user, $approval->project_id);

        return $membership !== null
            && $approval->approver_user_id === $user->id
            && $membership->grants($capability);
    }

    private function membership(User $user, string $projectId): ?ProjectMembership
    {
        return $user->memberships()->where('project_id', $projectId)->first();
    }
}
