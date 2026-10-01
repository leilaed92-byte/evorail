<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Project;
use App\Models\ProjectMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/me')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'unauthenticated');
    }

    public function test_login_me_and_logout_use_the_session_guard(): void
    {
        $user = User::factory()->create(['password' => 'password']);
        $organization = Organization::factory()->create();
        $project = Project::factory()->create(['organization_id' => $organization->id]);
        ProjectMembership::factory()->create(['user_id' => $user->id, 'project_id' => $project->id]);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.projects.0.id', $project->id);

        $this->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.user.email', $user->email);

        $this->postJson('/api/logout')
            ->assertOk()
            ->assertJsonPath('data.logged_out', true);

        $this->getJson('/api/me')->assertUnauthorized();
    }
}
