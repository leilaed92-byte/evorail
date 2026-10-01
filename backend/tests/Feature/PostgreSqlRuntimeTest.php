<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentRevision;
use App\Models\Project;
use App\Models\ProjectMembership;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PostgreSqlRuntimeTest extends TestCase
{
    use RefreshDatabase;

    public function test_postgresql_verification_uses_a_separate_test_database(): void
    {
        $this->assertSame('pgsql', DB::connection()->getDriverName());
        $database = DB::selectOne('SELECT current_database() AS name, version() AS version');
        $this->assertStringEndsWith('_test', $database->name);
        $this->assertStringContainsString('PostgreSQL', $database->version);
    }

    public function test_search_is_case_insensitive_and_pagination_is_project_scoped(): void
    {
        [$user, $document] = $this->topology();
        $document->update(['title' => 'Track Alignment', 'document_number' => 'EVO-001']);
        $second = Document::factory()->create(['project_id' => $document->project_id, 'created_by' => $user->id, 'title' => 'Track Alignment', 'document_number' => 'EVO-002']);
        Document::factory()->create(['title' => 'Track Alignment']);
        $this->actingAs($user);

        $this->getJson('/api/projects/'.$document->project_id.'/documents?search=track%20alignment&per_page=1')
            ->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.id', $document->id)
            ->assertJsonPath('data.pagination.total', 2)
            ->assertJsonPath('data.pagination.last_page', 2);
        $this->getJson('/api/projects/'.$document->project_id.'/documents?search=track%20alignment&per_page=1&page=2')
            ->assertOk()
            ->assertJsonPath('data.items.0.id', $second->id);
    }

    public function test_revision_metadata_long_reason_and_history_survive_idempotent_replay(): void
    {
        Storage::fake('local');
        [$user, $document] = $this->topology();
        $this->actingAs($user);
        $payload = [
            'revision_code' => 'A',
            'title' => 'Track alignment',
            'change_reason' => str_repeat('a', 1000),
            'purpose_of_issue' => 'For Information',
            'description' => 'Initial snapshot',
            'metadata_snapshot' => ['chainage' => 142, 'approved' => false, 'tags' => ['track', 'é']],
            'file' => UploadedFile::fake()->createWithContent('plan.pdf', "%PDF-1.4\noriginal bytes"),
        ];

        $first = $this->withHeader('Idempotency-Key', 'snapshot-a')->post('/api/documents/'.$document->id.'/revisions', $payload)->assertCreated();
        $revisionId = $first->json('data.revision.id');
        $snapshot = DocumentRevision::findOrFail($revisionId)->getRawOriginal();
        $this->assertSame($payload['metadata_snapshot'], DocumentRevision::findOrFail($revisionId)->metadata_snapshot);
        $this->assertSame($revisionId, $document->fresh()->current_revision_id);
        $this->withHeader('Idempotency-Key', 'snapshot-a')->post('/api/documents/'.$document->id.'/revisions', $payload)
            ->assertCreated()->assertExactJson($first->json());

        $changed = $payload;
        $changed['metadata_snapshot'] = ['chainage' => 999];
        $this->withHeader('Idempotency-Key', 'snapshot-a')->post('/api/documents/'.$document->id.'/revisions', $changed)
            ->assertConflict()->assertJsonPath('code', 'idempotency_conflict');
        $changed = $payload;
        $changed['purpose_of_issue'] = 'Changed purpose';
        $this->withHeader('Idempotency-Key', 'snapshot-a')->post('/api/documents/'.$document->id.'/revisions', $changed)
            ->assertConflict()->assertJsonPath('code', 'idempotency_conflict');

        $payload['revision_code'] = 'B';
        $this->withHeader('Idempotency-Key', 'snapshot-b')->post('/api/documents/'.$document->id.'/revisions', $payload)->assertCreated();
        $this->assertSame($snapshot, DocumentRevision::findOrFail($revisionId)->getRawOriginal());
        $this->assertSame($revisionId, $document->fresh()->current_revision_id);
        $this->patchJson('/api/revisions/'.$revisionId, ['title' => 'Overwrite'])->assertStatus(405);
        $this->deleteJson('/api/revisions/'.$revisionId)->assertStatus(405);
        $this->assertDatabaseCount('document_revisions', 2);
        $this->assertDatabaseCount('stored_files', 2);
        $this->assertDatabaseCount('audit_events', 2);
        $this->assertDatabaseCount('idempotency_keys', 2);
        Storage::disk('local')->assertExists(DocumentRevision::findOrFail($revisionId)->storedFile->path);
        $this->assertSame("%PDF-1.4\noriginal bytes", Storage::disk('local')->get(DocumentRevision::findOrFail($revisionId)->storedFile->path));
    }

    public function test_failed_revision_write_rolls_back_database_and_private_file(): void
    {
        Storage::fake('local');
        [$user, $document] = $this->topology();
        $this->actingAs($user);
        DocumentRevision::creating(function (): void {
            throw new \RuntimeException('Injected revision write failure');
        });

        try {
            $this->withHeader('Idempotency-Key', 'rollback')->post('/api/documents/'.$document->id.'/revisions', [
                'revision_code' => 'A', 'title' => 'Rollback', 'change_reason' => 'Failure test',
                'file' => UploadedFile::fake()->createWithContent('plan.pdf', '%PDF-1.4'),
            ])->assertStatus(500);
        } finally {
            DocumentRevision::flushEventListeners();
        }

        $this->assertDatabaseCount('document_revisions', 0);
        $this->assertDatabaseCount('stored_files', 0);
        $this->assertDatabaseCount('audit_events', 0);
        $this->assertDatabaseCount('idempotency_keys', 0);
        $this->assertNull($document->fresh()->current_revision_id);
        $this->assertSame([], Storage::disk('local')->allFiles());
    }

    public function test_current_revision_foreign_key_rejects_missing_revision(): void
    {
        [, $document] = $this->topology();
        $this->expectException(QueryException::class);

        DB::transaction(fn () => $document->update(['current_revision_id' => '00000000-0000-0000-0000-000000000001']));
    }

    /** @return array{0: User, 1: Document} */
    private function topology(): array
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMembership::factory()->create(['project_id' => $project->id, 'user_id' => $user->id]);

        return [$user, Document::factory()->create(['project_id' => $project->id, 'created_by' => $user->id])];
    }
}
