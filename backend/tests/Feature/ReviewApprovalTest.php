<?php

namespace Tests\Feature;

use App\Models\Approval;
use App\Models\Document;
use App\Models\DocumentRevision;
use App\Models\Organization;
use App\Models\Project;
use App\Models\ProjectMembership;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewApprovalTest extends TestCase
{
    use RefreshDatabase;

    public function test_review_flow_preserves_exact_revision_and_audit_history(): void
    {
        [$reviewer, $approver, $project, $document, $revision] = $this->topology();

        $this->actingAs($approver)->postJson('/api/documents/'.$document->id.'/reviews', [
            'revision_id' => $revision->id,
            'assignee_user_id' => $reviewer->id,
            'due_at' => now()->addDay()->toISOString(),
        ])->assertCreated()->assertJsonPath('data.review.revision_id', $revision->id)->assertJsonPath('data.review.status', 'open');
        $review = Review::query()->firstOrFail();
        $this->getJson('/api/projects/'.$project->id.'/reviews?status=open&revision_id='.$revision->id)
            ->assertOk()->assertJsonCount(1, 'data.items')->assertJsonPath('data.items.0.revision_id', $revision->id);

        $this->actingAs($reviewer)->postJson('/api/reviews/'.$review->id.'/comments', ['body' => 'Check exact geometry.'])
            ->assertCreated()->assertJsonPath('data.comment.body', 'Check exact geometry.');
        $this->postJson('/api/reviews/'.$review->id.'/start')->assertOk()->assertJsonPath('data.review.status', 'in_progress');
        $this->postJson('/api/reviews/'.$review->id.'/complete')->assertOk()->assertJsonPath('data.review.status', 'completed');
        $this->postJson('/api/reviews/'.$review->id.'/complete')->assertConflict()->assertJsonPath('code', 'review_transition_conflict');

        $this->getJson('/api/reviews/'.$review->id)->assertOk()
            ->assertJsonPath('data.review.revision_id', $revision->id)
            ->assertJsonPath('data.review.comments.0.body', 'Check exact geometry.')
            ->assertJsonPath('data.activity.0.event_type', 'review.completed');
        $this->assertDatabaseHas('audit_events', ['event_type' => 'review.created', 'entity_id' => $review->id]);
        $this->assertDatabaseHas('audit_events', ['event_type' => 'review.commented', 'entity_id' => $review->id]);
        $this->assertDatabaseHas('audit_events', ['event_type' => 'review.started', 'entity_id' => $review->id]);
        $this->assertDatabaseHas('audit_events', ['event_type' => 'review.completed', 'entity_id' => $review->id]);
    }

    public function test_review_return_and_invalid_transition_conflict(): void
    {
        [$reviewer, $approver, $project, $document, $revision] = $this->topology();
        $review = Review::query()->create(['project_id' => $project->id, 'document_id' => $document->id, 'revision_id' => $revision->id, 'status' => 'open', 'assignee_user_id' => $reviewer->id, 'created_by' => $approver->id]);

        $this->actingAs($reviewer)->postJson('/api/reviews/'.$review->id.'/return')->assertConflict();
        $this->postJson('/api/reviews/'.$review->id.'/start')->assertOk();
        $this->postJson('/api/reviews/'.$review->id.'/return')->assertOk()->assertJsonPath('data.review.status', 'returned');
        $this->postJson('/api/reviews/'.$review->id.'/start')->assertOk()->assertJsonPath('data.review.status', 'in_progress');
    }

    public function test_review_and_approval_idor_is_denied_across_projects(): void
    {
        [$reviewer, $approver, $project, $document, $revision] = $this->topology();
        $otherProject = Project::factory()->create(['organization_id' => Organization::factory()->create()->id]);
        $otherDocument = Document::factory()->create(['project_id' => $otherProject->id, 'created_by' => $approver->id]);
        $otherRevision = DocumentRevision::factory()->create(['document_id' => $otherDocument->id, 'created_by' => $approver->id]);
        $otherReview = Review::query()->create(['project_id' => $otherProject->id, 'document_id' => $otherDocument->id, 'revision_id' => $otherRevision->id, 'status' => 'open', 'assignee_user_id' => $approver->id, 'created_by' => $approver->id]);
        $otherApproval = Approval::query()->create(['project_id' => $otherProject->id, 'document_id' => $otherDocument->id, 'revision_id' => $otherRevision->id, 'status' => 'pending', 'approver_user_id' => $approver->id, 'requested_by' => $approver->id, 'requested_at' => now()]);

        $this->actingAs($reviewer)->getJson('/api/projects/'.$otherProject->id.'/reviews')->assertForbidden();
        $this->getJson('/api/reviews/'.$otherReview->id)->assertForbidden();
        $this->postJson('/api/reviews/'.$otherReview->id.'/comments', ['body' => 'No access'])->assertForbidden();
        $this->getJson('/api/projects/'.$otherProject->id.'/approvals')->assertForbidden();
        $this->getJson('/api/approvals/'.$otherApproval->id)->assertForbidden();
        $this->postJson('/api/approvals/'.$otherApproval->id.'/approve')->assertForbidden();
        $this->postJson('/api/approvals/'.$otherApproval->id.'/reject')->assertForbidden();
    }

    public function test_approval_decision_is_final_and_second_decision_conflicts(): void
    {
        [$reviewer, $approver, $project, $document, $revision] = $this->topology();
        $this->actingAs($approver)->postJson('/api/documents/'.$document->id.'/approvals', ['revision_id' => $revision->id, 'approver_user_id' => $approver->id])
            ->assertCreated()->assertJsonPath('data.approval.revision_id', $revision->id)->assertJsonPath('data.approval.status', 'pending');
        $approval = Approval::query()->firstOrFail();
        $this->getJson('/api/projects/'.$project->id.'/approvals?status=pending&revision_id='.$revision->id)
            ->assertOk()->assertJsonCount(1, 'data.items')->assertJsonPath('data.items.0.revision_id', $revision->id);
        $this->getJson('/api/approvals/'.$approval->id)->assertOk()->assertJsonPath('data.approval.revision_id', $revision->id);

        $approval = Approval::query()->firstOrFail();

        $this->actingAs($approver)->postJson('/api/approvals/'.$approval->id.'/approve', ['reason' => 'Approved for controlled issue'])
            ->assertOk()->assertJsonPath('data.approval.status', 'approved')->assertJsonPath('data.approval.revision_id', $revision->id);
        $this->postJson('/api/approvals/'.$approval->id.'/reject', ['reason' => 'Too late'])
            ->assertConflict()->assertJsonPath('code', 'approval_decision_conflict');
        $this->postJson('/api/approvals/'.$approval->id.'/approve')->assertConflict();
        $this->assertDatabaseHas('approvals', ['id' => $approval->id, 'status' => 'approved']);
        $this->assertDatabaseCount('audit_events', 2);
        $this->assertDatabaseHas('audit_events', ['event_type' => 'approval.created', 'entity_id' => $approval->id]);
        $this->assertDatabaseHas('audit_events', ['event_type' => 'approval.approved', 'entity_id' => $approval->id]);
    }

    public function test_approved_issuing_suitability_supersedes_previous_current_revision_atomically(): void
    {
        [$reviewer, $approver, $project, $document, $revision] = $this->topology();
        $revision->forceFill(['effective_state' => 'current', 'suitability_status' => 'approved'])->save();
        $document->forceFill([
            'current_revision_id' => $revision->id,
            'workflow_status' => 'completed',
            'suitability_status' => 'approved',
            'effective_state' => 'current',
        ])->save();
        $replacement = DocumentRevision::factory()->create([
            'document_id' => $document->id,
            'created_by' => $reviewer->id,
            'revision_code' => 'B',
            'revision_order' => 2,
            'workflow_status' => 'under_review',
            'suitability_status' => 'for_approval',
            'effective_state' => 'superseded',
        ]);

        $approval = $this->actingAs($approver)->postJson('/api/documents/'.$document->id.'/approvals', [
            'revision_id' => $replacement->id,
            'approver_user_id' => $approver->id,
        ])->assertCreated()->json('data.approval.id');

        $this->postJson('/api/approvals/'.$approval.'/approve', [
            'reason' => 'Approved for construction',
            'suitability_status' => 'issued_for_construction',
        ])->assertOk()
            ->assertJsonPath('data.approval.approved_suitability_status', 'issued_for_construction');

        $this->assertDatabaseHas('documents', [
            'id' => $document->id,
            'current_revision_id' => $replacement->id,
            'suitability_status' => 'issued_for_construction',
            'effective_state' => 'current',
        ]);
        $this->assertDatabaseHas('document_revisions', ['id' => $revision->id, 'effective_state' => 'superseded']);
        $this->assertDatabaseHas('document_revisions', [
            'id' => $replacement->id,
            'workflow_status' => 'completed',
            'suitability_status' => 'issued_for_construction',
            'effective_state' => 'current',
        ]);
        $this->assertDatabaseHas('audit_events', ['event_type' => 'revision.superseded', 'entity_id' => $revision->id]);
        $this->assertDatabaseHas('audit_events', ['event_type' => 'revision.current', 'entity_id' => $replacement->id]);
    }

    public function test_approval_rejects_an_unknown_suitability_status(): void
    {
        [$reviewer, $approver, $project, $document, $revision] = $this->topology();
        $approval = $this->actingAs($approver)->postJson('/api/documents/'.$document->id.'/approvals', [
            'revision_id' => $revision->id,
            'approver_user_id' => $approver->id,
        ])->assertCreated()->json('data.approval.id');

        $this->postJson('/api/approvals/'.$approval.'/approve', ['suitability_status' => 'secret_state'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.suitability_status.0', 'The selected suitability status is invalid.');
        $this->assertDatabaseHas('approvals', ['id' => $approval, 'status' => 'pending']);
    }

    public function test_unassigned_user_cannot_transition_review_and_non_approver_cannot_decide(): void
    {
        [$reviewer, $approver, $project, $document, $revision] = $this->topology();
        $other = User::factory()->create();
        ProjectMembership::factory()->create(['project_id' => $project->id, 'user_id' => $other->id, 'role' => 'reviewer']);
        $review = Review::query()->create(['project_id' => $project->id, 'document_id' => $document->id, 'revision_id' => $revision->id, 'status' => 'open', 'assignee_user_id' => $reviewer->id, 'created_by' => $approver->id]);
        $approval = Approval::query()->create(['project_id' => $project->id, 'document_id' => $document->id, 'revision_id' => $revision->id, 'status' => 'pending', 'approver_user_id' => $approver->id, 'requested_by' => $reviewer->id, 'requested_at' => now()]);

        $this->actingAs($other)->postJson('/api/reviews/'.$review->id.'/start')->assertForbidden();
        $this->postJson('/api/approvals/'.$approval->id.'/approve')->assertForbidden();
    }

    /** @return array{0: User, 1: User, 2: Project, 3: Document, 4: DocumentRevision} */
    private function topology(): array
    {
        $organization = Organization::factory()->create();
        $project = Project::factory()->create(['organization_id' => $organization->id]);
        $reviewer = User::factory()->create();
        $approver = User::factory()->create();
        ProjectMembership::factory()->create(['project_id' => $project->id, 'user_id' => $reviewer->id, 'role' => 'reviewer']);
        ProjectMembership::factory()->create(['project_id' => $project->id, 'user_id' => $approver->id, 'role' => 'director']);
        $document = Document::factory()->create(['project_id' => $project->id, 'created_by' => $reviewer->id]);
        $revision = DocumentRevision::factory()->create(['document_id' => $document->id, 'created_by' => $reviewer->id]);

        return [$reviewer, $approver, $project, $document, $revision];
    }
}
