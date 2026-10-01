<?php

namespace Tests\Feature;

use App\Models\AuditEvent;
use App\Models\Document;
use App\Models\DocumentRevision;
use App\Models\Organization;
use App\Models\Project;
use App\Models\ProjectMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_draft_can_be_created_updated_and_filled_with_recipients_and_exact_revision(): void
    {
        [$user, $project, $document, $revision] = $this->topology();
        $this->actingAs($user);
        $created = $this->postJson('/api/projects/'.$project->id.'/transmissions', ['subject' => 'For review', 'purpose' => 'Design review'], ['Idempotency-Key' => 'tx-create'])->assertCreated();
        $id = $created->json('data.transmission.id');
        $this->patchJson('/api/transmissions/'.$id, ['subject' => 'For review — updated'])->assertOk()->assertJsonPath('data.transmission.subject', 'For review — updated');
        $this->postJson('/api/transmissions/'.$id.'/recipients', ['recipient_type' => 'organization', 'recipient_name' => 'PMC Atlas', 'recipient_email' => 'pmc@example.test'])->assertCreated();
        $this->postJson('/api/transmissions/'.$id.'/items', ['document_id' => $document->id, 'revision_id' => $revision->id])->assertCreated()->assertJsonPath('data.item.revision_id', $revision->id)->assertJsonPath('data.item.snapshot.revision_code', 'C');
        $this->getJson('/api/transmissions/'.$id)->assertOk()->assertJsonPath('data.transmission.status', 'draft')->assertJsonCount(1, 'data.transmission.recipients')->assertJsonCount(1, 'data.transmission.items');
        $this->assertDatabaseHas('audit_events', ['event_type' => 'transmission.created', 'entity_id' => $id]);
        $this->assertDatabaseHas('audit_events', ['event_type' => 'transmission.item_added', 'entity_id' => $id]);
    }

    public function test_item_requires_revision_belonging_to_document_and_project(): void
    {
        [$user, $project, $document] = $this->topology();
        $foreignProject = Project::factory()->create();
        $foreignDocument = Document::factory()->create(['project_id' => $foreignProject->id, 'created_by' => $user->id]);
        $foreignRevision = DocumentRevision::factory()->create(['document_id' => $foreignDocument->id, 'created_by' => $user->id, 'revision_code' => 'Z']);
        $sameProjectDocument = Document::factory()->create(['project_id' => $project->id, 'created_by' => $user->id]);
        $sameProjectRevision = DocumentRevision::factory()->create(['document_id' => $sameProjectDocument->id, 'created_by' => $user->id, 'revision_code' => 'B']);
        $this->actingAs($user);
        $id = $this->postJson('/api/projects/'.$project->id.'/transmissions', ['subject' => 'Exact'])->json('data.transmission.id');
        $this->postJson('/api/transmissions/'.$id.'/items', ['document_id' => $document->id, 'revision_id' => $foreignRevision->id])->assertForbidden();
        $this->postJson('/api/transmissions/'.$id.'/items', ['document_id' => $foreignDocument->id, 'revision_id' => $sameProjectRevision->id])->assertForbidden();
        $this->postJson('/api/transmissions/'.$id.'/items', ['document_id' => $document->id, 'revision_id' => $sameProjectRevision->id])->assertConflict()->assertJsonPath('code', 'transmission_item_context_conflict');
    }

    public function test_issue_freezes_exact_snapshot_and_later_revision_does_not_change_it(): void
    {
        [$user, $project, $document, $revision] = $this->topology();
        $this->actingAs($user);
        $id = $this->postJson('/api/projects/'.$project->id.'/transmissions', ['subject' => 'Issued package'])->json('data.transmission.id');
        $this->postJson('/api/transmissions/'.$id.'/recipients', ['recipient_type' => 'contact', 'recipient_name' => 'NRA'])->assertCreated();
        $this->postJson('/api/transmissions/'.$id.'/items', ['document_id' => $document->id, 'revision_id' => $revision->id])->assertCreated();
        $issued = $this->withHeader('Idempotency-Key', 'issue-c')->postJson('/api/transmissions/'.$id.'/issue', ['note' => 'Freeze C'])->assertOk();
        $issued->assertJsonPath('data.transmission.status', 'issued')->assertJsonPath('data.transmission.items.0.revision_id', $revision->id)->assertJsonPath('data.transmission.items.0.snapshot.revision_code', 'C')->assertJsonPath('data.transmission.items.0.snapshot.file_checksum', $revision->storedFile->checksum);
        $later = DocumentRevision::factory()->create(['document_id' => $document->id, 'created_by' => $user->id, 'revision_code' => 'D', 'revision_order' => 2, 'title' => 'Later title']);
        $this->getJson('/api/transmissions/'.$id)->assertOk()->assertJsonPath('data.transmission.items.0.revision_id', $revision->id)->assertJsonPath('data.transmission.items.0.snapshot.revision_code', 'C')->assertJsonPath('data.transmission.items.0.snapshot.document_title', $document->title)->assertJsonPath('data.transmission.items.0.revision.revision_code', 'C');
        $this->assertNotSame($revision->id, $later->id);
    }

    public function test_issue_requires_recipient_and_item_and_is_immutable_after_success(): void
    {
        [$user, $project, $document, $revision] = $this->topology();
        $this->actingAs($user);
        $id = $this->postJson('/api/projects/'.$project->id.'/transmissions', ['subject' => 'Incomplete'])->json('data.transmission.id');
        $this->postJson('/api/transmissions/'.$id.'/issue', [])->assertConflict()->assertJsonPath('code', 'transmission_recipient_required');
        $this->postJson('/api/transmissions/'.$id.'/recipients', ['recipient_type' => 'contact', 'recipient_name' => 'NRA'])->assertCreated();
        $this->postJson('/api/transmissions/'.$id.'/issue', [])->assertConflict()->assertJsonPath('code', 'transmission_item_required');
        $this->postJson('/api/transmissions/'.$id.'/items', ['document_id' => $document->id, 'revision_id' => $revision->id])->assertCreated();
        $this->withHeader('Idempotency-Key', 'issue-final')->postJson('/api/transmissions/'.$id.'/issue', [])->assertOk();
        $this->patchJson('/api/transmissions/'.$id, ['subject' => 'Mutated'])->assertForbidden();
        $this->postJson('/api/transmissions/'.$id.'/recipients', ['recipient_type' => 'contact', 'recipient_name' => 'Another'])->assertForbidden();
        $this->postJson('/api/transmissions/'.$id.'/items', ['document_id' => $document->id, 'revision_id' => $revision->id])->assertForbidden();
        $this->withHeader('Idempotency-Key', 'issue-again')->postJson('/api/transmissions/'.$id.'/issue', [])->assertConflict()->assertJsonPath('code', 'transmission_issue_conflict');
    }

    public function test_issue_is_idempotent_and_conflicting_key_is_rejected(): void
    {
        [$user, $project, $document, $revision] = $this->topology();
        $this->actingAs($user);
        $id = $this->postJson('/api/projects/'.$project->id.'/transmissions', ['subject' => 'Replay'])->json('data.transmission.id');
        $this->postJson('/api/transmissions/'.$id.'/recipients', ['recipient_type' => 'contact', 'recipient_name' => 'NRA'])->assertCreated();
        $this->postJson('/api/transmissions/'.$id.'/items', ['document_id' => $document->id, 'revision_id' => $revision->id])->assertCreated();
        $first = $this->withHeader('Idempotency-Key', 'same-issue')->postJson('/api/transmissions/'.$id.'/issue', ['note' => 'one'])->assertOk();
        $this->withHeader('Idempotency-Key', 'same-issue')->postJson('/api/transmissions/'.$id.'/issue', ['note' => 'one'])->assertOk()->assertJsonPath('data.transmission.id', $first->json('data.transmission.id'));
        $this->withHeader('Idempotency-Key', 'same-issue')->postJson('/api/transmissions/'.$id.'/issue', ['note' => 'two'])->assertConflict()->assertJsonPath('code', 'idempotency_conflict');
        $this->assertSame(1, AuditEvent::query()->where('event_type', 'transmission.issued')->where('entity_id', $id)->count());
    }

    public function test_foreign_project_transmission_is_hidden_from_user(): void
    {
        [$owner, $project, $document, $revision] = $this->topology();
        $other = User::factory()->create();
        $this->actingAs($owner);
        $id = $this->postJson('/api/projects/'.$project->id.'/transmissions', ['subject' => 'Private'])->json('data.transmission.id');
        ProjectMembership::factory()->create(['project_id' => Project::factory()->create()->id, 'user_id' => $other->id, 'role' => 'admin']);
        $this->actingAs($other)->getJson('/api/transmissions/'.$id)->assertForbidden();
        $this->actingAs($other)->patchJson('/api/transmissions/'.$id, ['subject' => 'No'])->assertForbidden();
        $this->actingAs($other)->getJson('/api/transmissions/'.$id.'/download')->assertForbidden();
        $this->assertNotNull($document->id);
        $this->assertNotNull($revision->id);
    }

    public function test_download_returns_frozen_manifest_and_audit(): void
    {
        [$user, $project, $document, $revision] = $this->topology();
        $this->actingAs($user);
        $id = $this->postJson('/api/projects/'.$project->id.'/transmissions', ['subject' => 'Download'])->json('data.transmission.id');
        $this->postJson('/api/transmissions/'.$id.'/recipients', ['recipient_type' => 'contact', 'recipient_name' => 'NRA'])->assertCreated();
        $this->postJson('/api/transmissions/'.$id.'/items', ['document_id' => $document->id, 'revision_id' => $revision->id])->assertCreated();
        $this->postJson('/api/transmissions/'.$id.'/issue', [])->assertOk();
        $this->getJson('/api/transmissions/'.$id.'/download')->assertOk()->assertJsonPath('data.manifest.0.revision_id', $revision->id)->assertJsonPath('data.manifest.0.revision_code', 'C');
        $this->assertDatabaseHas('audit_events', ['event_type' => 'transmission.downloaded', 'entity_id' => $id]);
    }

    /** @return array{0: User, 1: Project, 2: Document, 3: DocumentRevision} */
    private function topology(): array
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['organization_id' => Organization::factory()->create()->id]);
        ProjectMembership::factory()->create(['project_id' => $project->id, 'user_id' => $user->id, 'role' => 'admin']);
        $document = Document::factory()->create(['project_id' => $project->id, 'created_by' => $user->id, 'title' => 'Track alignment — Section 05']);
        $revision = DocumentRevision::factory()->create(['document_id' => $document->id, 'created_by' => $user->id, 'revision_code' => 'C', 'revision_order' => 1, 'title' => 'Track alignment — Section 05']);

        return [$user, $project, $document, $revision];
    }
}
