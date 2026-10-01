<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentRevision;
use App\Models\Project;
use App\Models\ProjectMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class DocumentQueryTest extends TestCase
{
    use RefreshDatabase;

    public static function filters(): array
    {
        return [
            'search title' => ['search=Bridge'],
            'search number' => ['search=DOC-001'],
            'discipline' => ['discipline=STR'],
            'workflow' => ['workflow_status=completed'],
            'suitability' => ['suitability=approved'],
            'effective state' => ['effective_state=current'],
            'current only' => ['current_only=1'],
            'revision' => ['revision=C'],
            'combined' => ['search=Bridge&discipline=STR&workflow_status=completed'],
        ];
    }

    #[DataProvider('filters')]
    public function test_filters_return_only_matching_authorized_documents(string $query): void
    {
        [$user, $project] = $this->topology();
        $match = Document::factory()->create(['project_id' => $project->id, 'created_by' => $user->id, 'title' => 'Bridge design', 'document_number' => 'DOC-001', 'discipline' => 'STR', 'workflow_status' => 'completed', 'suitability_status' => 'approved', 'effective_state' => 'current']);
        DocumentRevision::factory()->create(['document_id' => $match->id, 'created_by' => $user->id, 'revision_code' => 'C']);
        Document::factory()->create(['project_id' => $project->id, 'created_by' => $user->id, 'title' => 'Track design', 'document_number' => 'DOC-002', 'discipline' => 'TRK', 'workflow_status' => 'draft', 'suitability_status' => 'for_information', 'effective_state' => 'superseded']);
        Document::factory()->create(['title' => 'Bridge design', 'document_number' => 'DOC-001', 'discipline' => 'STR']);

        $this->actingAs($user)->getJson('/api/projects/'.$project->id.'/documents?'.$query)
            ->assertOk()->assertJsonCount(1, 'data.items')->assertJsonPath('data.items.0.id', $match->id);
    }

    public function test_sort_and_pagination_return_stable_pages_and_totals(): void
    {
        [$user, $project] = $this->topology();
        foreach (['DOC-003', 'DOC-001', 'DOC-002'] as $number) {
            Document::factory()->create(['project_id' => $project->id, 'created_by' => $user->id, 'document_number' => $number]);
        }
        $this->actingAs($user);

        $this->getJson('/api/projects/'.$project->id.'/documents?sort=document_number&per_page=1&page=2')
            ->assertOk()->assertJsonPath('data.items.0.document_number', 'DOC-002')
            ->assertJsonPath('data.pagination', ['current_page' => 2, 'per_page' => 1, 'total' => 3, 'last_page' => 3]);
        $this->getJson('/api/projects/'.$project->id.'/documents?sort=-document_number&per_page=2')
            ->assertOk()->assertJsonPath('data.items.0.document_number', 'DOC-003')->assertJsonPath('data.items.1.document_number', 'DOC-002');
    }

    public static function invalidQueries(): array
    {
        return [['sort=title%3B%20DROP%20TABLE%20documents', 'sort'], ['per_page=101', 'per_page'], ['page=0', 'page'], ['workflow_status=invalid', 'workflow_status']];
    }

    #[DataProvider('invalidQueries')]
    public function test_invalid_queries_return_422(string $query, string $field): void
    {
        [$user, $project] = $this->topology();

        $this->actingAs($user)->getJson('/api/projects/'.$project->id.'/documents?'.$query)
            ->assertUnprocessable()->assertJsonPath('code', 'validation_failed')->assertJsonValidationErrors($field);
    }

    /** @return array{0: User, 1: Project} */
    private function topology(): array
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMembership::factory()->create(['user_id' => $user->id, 'project_id' => $project->id, 'role' => 'engineer']);

        return [$user, $project];
    }
}
