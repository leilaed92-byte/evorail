<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentRevision;
use App\Models\Organization;
use App\Models\Project;
use App\Models\ProjectMembership;
use App\Models\StoredFile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ProjectAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_list_and_detail_are_membership_scoped(): void
    {
        [$user, $projectA, $projectB] = $this->topology();
        $this->actingAs($user);

        $this->getJson('/api/projects')
            ->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.id', $projectA->id);

        $this->getJson('/api/projects/'.$projectA->id)->assertOk();
        $this->getJson('/api/projects/'.$projectB->id)
            ->assertForbidden()
            ->assertJsonPath('code', 'forbidden');
    }

    public function test_document_access_cannot_cross_project_boundary(): void
    {
        [$user, $projectA, $projectB] = $this->topology();
        $document = Document::factory()->create(['project_id' => $projectB->id, 'created_by' => $user->id]);
        $this->actingAs($user);

        $this->getJson('/api/projects/'.$projectB->id.'/documents')->assertForbidden();
        $this->getJson('/api/documents/'.$document->id)->assertForbidden();
    }

    public function test_revision_and_file_access_cannot_cross_project_boundary(): void
    {
        Storage::fake('local');
        [$user, , $projectB] = $this->topology();
        $document = Document::factory()->create(['project_id' => $projectB->id, 'created_by' => $user->id]);
        $storedFile = StoredFile::factory()->create(['created_by' => $user->id]);
        Storage::disk('local')->put($storedFile->path, 'protected');
        $revision = DocumentRevision::factory()->create([
            'document_id' => $document->id,
            'stored_file_id' => $storedFile->id,
            'created_by' => $user->id,
        ]);
        $this->actingAs($user);

        $this->getJson('/api/documents/'.$document->id.'/revisions')->assertForbidden();
        $this->getJson('/api/revisions/'.$revision->id)->assertForbidden();
        $this->get('/api/revisions/'.$revision->id.'/preview')->assertForbidden();
        $this->get('/api/revisions/'.$revision->id.'/download')->assertForbidden();
        $this->withHeader('Idempotency-Key', 'idor-create')->post('/api/documents/'.$document->id.'/revisions', [
            'revision_code' => 'B',
            'title' => 'Forbidden revision',
            'change_reason' => 'IDOR test',
            'file' => UploadedFile::fake()->create('forbidden.pdf', 1, 'application/pdf'),
        ])->assertForbidden();
        $this->assertDatabaseCount('document_revisions', 1);
        $this->assertDatabaseCount('stored_files', 1);
        $this->assertDatabaseCount('audit_events', 0);
        $this->getJson('/api/documents/'.$document->id.'/activity')->assertForbidden();
    }

    public function test_shared_organization_does_not_grant_access_to_another_project(): void
    {
        [$user, $projectA] = $this->topology();
        $projectB = Project::factory()->create(['organization_id' => $projectA->organization_id]);
        $documentB = Document::factory()->create(['project_id' => $projectB->id, 'created_by' => $user->id]);

        $this->actingAs($user)->getJson('/api/projects/'.$projectB->id)->assertForbidden();
        $this->getJson('/api/documents/'.$documentB->id)->assertForbidden();
    }

    public static function protectedResources(): array
    {
        return [['project'], ['document'], ['revision'], ['preview'], ['download'], ['create']];
    }

    #[DataProvider('protectedResources')]
    public function test_missing_authentication_returns_401_for_protected_resources(string $resource): void
    {
        [$user, $project] = $this->topology();
        $document = Document::factory()->create(['project_id' => $project->id, 'created_by' => $user->id]);
        $revision = DocumentRevision::factory()->create(['document_id' => $document->id, 'created_by' => $user->id]);
        $path = match ($resource) {
            'project' => '/api/projects/'.$project->id,
            'document' => '/api/documents/'.$document->id,
            'revision' => '/api/revisions/'.$revision->id,
            'preview', 'download' => '/api/revisions/'.$revision->id.'/'.$resource,
            'create' => '/api/documents/'.$document->id.'/revisions',
        };

        $response = $resource === 'create' ? $this->postJson($path, []) : $this->getJson($path);

        $response->assertUnauthorized()->assertJsonPath('code', 'unauthenticated');
    }

    public function test_viewer_cannot_download_or_create_revisions_in_their_own_project(): void
    {
        Storage::fake('local');
        [$user, $project] = $this->topology();
        $user->memberships()->where('project_id', $project->id)->update(['role' => 'viewer']);
        $document = Document::factory()->create(['project_id' => $project->id, 'created_by' => $user->id]);
        $revision = DocumentRevision::factory()->create(['document_id' => $document->id, 'created_by' => $user->id]);
        Storage::disk('local')->put($revision->storedFile->path, 'protected bytes');

        $this->actingAs($user)->getJson('/api/revisions/'.$revision->id)->assertOk();
        $this->getJson('/api/revisions/'.$revision->id.'/download')->assertForbidden();
        $this->post('/api/documents/'.$document->id.'/revisions', [
            'revision_code' => 'B', 'title' => 'Denied', 'change_reason' => 'Permission test',
            'file' => UploadedFile::fake()->create('denied.pdf', 1, 'application/pdf'),
        ])->assertForbidden();
        $this->assertDatabaseCount('document_revisions', 1);
        $this->assertDatabaseCount('stored_files', 1);
        $this->assertDatabaseCount('audit_events', 0);
    }

    /** @return array{0: User, 1: Project, 2: Project} */
    private function topology(): array
    {
        $user = User::factory()->create();
        $organizationA = Organization::factory()->create();
        $organizationB = Organization::factory()->create();
        $projectA = Project::factory()->create(['organization_id' => $organizationA->id]);
        $projectB = Project::factory()->create(['organization_id' => $organizationB->id]);
        ProjectMembership::factory()->create(['user_id' => $user->id, 'project_id' => $projectA->id]);

        return [$user, $projectA, $projectB];
    }
}
