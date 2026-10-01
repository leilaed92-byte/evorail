<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentRevision;
use App\Models\Organization;
use App\Models\Project;
use App\Models\ProjectMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class DocumentRevisionTest extends TestCase
{
    use RefreshDatabase;

    public function test_revision_creation_is_immutable_and_idempotent(): void
    {
        Storage::fake('local');
        [$user, $document] = $this->documentTopology();
        $this->actingAs($user);

        $first = $this->postRevision($document, 'A', 'Initial revision', 'first.pdf', 'first content', 'revision-a');
        $first->assertCreated();
        $firstId = $first->json('data.revision.id');
        $firstChecksum = $first->json('data.revision.file.checksum');
        $firstSnapshot = $this->getJson('/api/revisions/'.$firstId)->assertOk()->json('data.revision');
        $firstModel = DocumentRevision::findOrFail($firstId)->load('storedFile');
        $firstBytes = Storage::disk('local')->get($firstModel->storedFile->path);

        $this->postRevision($document, 'A', 'Duplicate revision', 'duplicate.pdf', 'duplicate', 'revision-duplicate')
            ->assertStatus(409)
            ->assertJsonPath('code', 'duplicate_revision');

        $second = $this->postRevision($document, 'B', 'Second revision', 'second.pdf', 'second content', 'revision-b');
        $second->assertCreated();
        $secondId = $second->json('data.revision.id');

        $replayed = $this->postRevision($document, 'B', 'Second revision', 'second.pdf', 'second content', 'revision-b');
        $replayed->assertCreated()->assertJsonPath('data.revision.id', $secondId);

        $this->assertDatabaseCount('document_revisions', 2);
        $this->assertNotSame($firstId, $secondId);
        $this->assertDatabaseHas('document_revisions', ['id' => $firstId, 'revision_code' => 'A']);
        $this->assertSame($firstChecksum, $this->getJson('/api/revisions/'.$firstId)->json('data.revision.file.checksum'));
        $this->assertSame($firstSnapshot, $this->getJson('/api/revisions/'.$firstId)->assertOk()->json('data.revision'));
        $this->assertSame($firstBytes, Storage::disk('local')->get($firstModel->storedFile->path));
        $this->assertNotSame($firstChecksum, $second->json('data.revision.file.checksum'));
        $this->getJson('/api/documents/'.$document->id.'/revisions')
            ->assertOk()->assertJsonCount(2, 'data.items')
            ->assertJsonPath('data.items.0.id', $secondId)->assertJsonPath('data.items.1.id', $firstId);
        $this->getJson('/api/documents/'.$document->id)
            ->assertOk()->assertJsonPath('data.document.current_revision_id', $firstId);
        $this->assertDatabaseCount('stored_files', 2);
        $this->assertDatabaseCount('audit_events', 2);
        Storage::disk('local')->assertExists($firstModel->storedFile->path);
    }

    public function test_protected_preview_and_download_require_project_access(): void
    {
        Storage::fake('local');
        [$user, $document] = $this->documentTopology();
        $this->actingAs($user);
        $response = $this->postRevision($document, 'A', 'Initial revision', 'plan.pdf', 'pdf content', 'preview-a')->assertCreated();
        $revisionId = $response->json('data.revision.id');

        $this->get('/api/revisions/'.$revisionId.'/preview')->assertOk();
        $this->get('/api/revisions/'.$revisionId.'/download')->assertDownload('plan.pdf');
    }

    public function test_missing_revision_fields_return_422_without_side_effects(): void
    {
        Storage::fake('local');
        [$user, $document] = $this->documentTopology();

        $this->actingAs($user)->postJson('/api/documents/'.$document->id.'/revisions', [])
            ->assertUnprocessable()->assertJsonPath('code', 'validation_failed')
            ->assertJsonValidationErrors(['revision_code', 'title', 'change_reason', 'file']);
        $this->assertDatabaseCount('document_revisions', 0);
        $this->assertDatabaseCount('stored_files', 0);
        $this->assertDatabaseCount('audit_events', 0);
        $this->assertSame([], Storage::disk('local')->allFiles());
    }

    public function test_changed_payload_with_the_same_idempotency_key_returns_409(): void
    {
        Storage::fake('local');
        [$user, $document] = $this->documentTopology();
        $this->actingAs($user);
        $this->postRevision($document, 'A', 'Initial', 'a.pdf', 'A bytes', 'same-key')->assertCreated();

        $this->postRevision($document, 'B', 'Changed', 'b.pdf', 'B bytes', 'same-key')
            ->assertConflict()->assertJsonPath('code', 'idempotency_conflict');
        $this->assertDatabaseCount('document_revisions', 1);
        $this->assertDatabaseCount('stored_files', 1);
        $this->assertDatabaseCount('audit_events', 1);
    }

    public function test_preview_of_unsupported_file_returns_422_but_download_remains_available(): void
    {
        Storage::fake('local');
        [$user, $document] = $this->documentTopology();
        $revision = DocumentRevision::factory()->create(['document_id' => $document->id, 'created_by' => $user->id]);
        $revision->storedFile->update(['mime_type' => 'application/dwg']);
        Storage::disk('local')->put($revision->storedFile->path, 'CAD bytes');

        $this->actingAs($user)->getJson('/api/revisions/'.$revision->id.'/preview')
            ->assertUnprocessable()->assertJsonPath('code', 'preview_unavailable');
        $this->get('/api/revisions/'.$revision->id.'/download')->assertDownload($revision->storedFile->original_filename);
    }

    /** @return array{0: User, 1: Document} */
    private function documentTopology(): array
    {
        $user = User::factory()->create();
        $organization = Organization::factory()->create();
        $project = Project::factory()->create(['organization_id' => $organization->id]);
        ProjectMembership::factory()->create(['user_id' => $user->id, 'project_id' => $project->id, 'role' => 'engineer']);
        $document = Document::factory()->create(['project_id' => $project->id, 'created_by' => $user->id]);

        return [$user, $document];
    }

    private function postRevision(Document $document, string $code, string $reason, string $filename, string $contents, string $idempotencyKey): TestResponse
    {
        $file = UploadedFile::fake()->createWithContent($filename, "%PDF-1.4\n".$contents);

        return $this->withHeader('Idempotency-Key', $idempotencyKey)->post('/api/documents/'.$document->id.'/revisions', [
            'revision_code' => $code,
            'title' => 'Controlled document',
            'change_reason' => $reason,
            'file' => $file,
        ]);
    }
}
