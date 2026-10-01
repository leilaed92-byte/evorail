<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\ProjectMembership;
use App\Models\Review;
use App\Models\User;

class ReviewPolicy
{
    public function viewAny(User $user, Project $project): bool
    {
        return $this->membership($user, $project->id)?->grants('review.view') ?? false;
    }

    public function view(User $user, Review $review): bool
    {
        return $this->membership($user, $review->project_id)?->grants('review.view') ?? false;
    }

    public function comment(User $user, Review $review): bool
    {
        return $this->canOperate($user, $review, 'review.comment');
    }

    public function start(User $user, Review $review): bool
    {
        return $this->canOperate($user, $review, 'review.start');
    }

    public function complete(User $user, Review $review): bool
    {
        return $this->canOperate($user, $review, 'review.complete');
    }

    public function return(User $user, Review $review): bool
    {
        return $this->canOperate($user, $review, 'review.return');
    }

    public function create(User $user, Project $project): bool
    {
        return $this->membership($user, $project->id)?->grants('review.view') ?? false;
    }

    private function canOperate(User $user, Review $review, string $capability): bool
    {
        $membership = $this->membership($user, $review->project_id);

        if ($membership === null || ! $membership->grants($capability)) {
            return false;
        }

        return $review->assignee_user_id === null
            || $review->assignee_user_id === $user->id
            || $membership->grants('review.manage');
    }

    private function membership(User $user, string $projectId): ?ProjectMembership
    {
        return $user->memberships()->where('project_id', $projectId)->first();
    }
}
