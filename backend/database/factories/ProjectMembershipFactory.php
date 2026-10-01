<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\ProjectMembership;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ProjectMembership> */
class ProjectMembershipFactory extends Factory
{
    protected $model = ProjectMembership::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'user_id' => User::factory(),
            'role' => 'engineer',
            'capabilities' => null,
            'status' => 'active',
        ];
    }
}
