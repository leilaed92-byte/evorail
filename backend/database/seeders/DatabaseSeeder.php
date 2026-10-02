<?php

namespace Database\Seeders;

use App\Enums\EffectiveState;
use App\Enums\SuitabilityStatus;
use App\Enums\WorkflowStatus;
use App\Models\Document;
use App\Models\DocumentRevision;
use App\Models\Organization;
use App\Models\Project;
use App\Models\ProjectMembership;
use App\Models\StoredFile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local') || ! (bool) env('EVORAIL_DEMO_SEED', false)) {
            return;
        }

        DB::transaction(function (): void {
            $organizationA = Organization::query()->firstOrCreate(['code' => 'EVO'], ['legal_name' => 'Evo Engineering', 'type' => 'engineering_office']);
            $organizationB = Organization::query()->firstOrCreate(['code' => 'PNT'], ['legal_name' => 'Pontis Infrastructure', 'type' => 'contractor']);
            $projectA = Project::query()->firstOrCreate(['code' => 'LNA'], ['organization_id' => $organizationA->id, 'name' => 'Line A', 'phase' => 'construction', 'status' => 'active']);
            $projectB = Project::query()->firstOrCreate(['code' => 'LNB'], ['organization_id' => $organizationB->id, 'name' => 'Line B', 'phase' => 'design', 'status' => 'active']);

            $userA = User::query()->firstOrCreate(['email' => 'user-a@example.test'], ['name' => 'User A', 'password' => Hash::make('password')]);
            $userB = User::query()->firstOrCreate(['email' => 'user-b@example.test'], ['name' => 'User B', 'password' => Hash::make('password')]);
            $admin = User::query()->firstOrCreate(['email' => 'admin@example.test'], ['name' => 'EvoRail Admin', 'password' => Hash::make('password')]);

            ProjectMembership::query()->firstOrCreate(['project_id' => $projectA->id, 'user_id' => $userA->id], ['role' => 'engineer', 'status' => 'active']);
            ProjectMembership::query()->firstOrCreate(['project_id' => $projectB->id, 'user_id' => $userB->id], ['role' => 'engineer', 'status' => 'active']);
            ProjectMembership::query()->firstOrCreate(['project_id' => $projectA->id, 'user_id' => $admin->id], ['role' => 'admin', 'status' => 'active']);
            ProjectMembership::query()->firstOrCreate(['project_id' => $projectB->id, 'user_id' => $admin->id], ['role' => 'admin', 'status' => 'active']);

            $this->createDocument($projectA, $userA, 'LNA-EVO-TRK-DWG-S05-00142', 'Track alignment — Section 05', ['drawing_type' => 'Alignment plan', 'zone' => 'S05', 'location' => 'Section 05']);
            $this->createDocument($projectA, $userA, 'LNA-EVO-STR-CAL-S04-00017', 'BR-017 calculation note');
            $this->createDocument($projectB, $userB, 'LNB-PNT-GEN-MST-S01-00009', 'Pontis method statement');
        });
    }

    /** @param array{drawing_type?: string, zone?: string, location?: string} $drawingMetadata */
    private function createDocument(Project $project, User $creator, string $number, string $title, array $drawingMetadata = []): Document
    {
        $document = Document::query()->firstOrCreate([
            'project_id' => $project->id,
            'document_number' => $number,
        ], [
            'title' => $title,
            'document_type' => $drawingMetadata === [] ? 'document' : 'drawing',
            'discipline' => str_contains($number, '-STR-') ? 'STR' : 'TRK',
            'drawing_type' => $drawingMetadata['drawing_type'] ?? null,
            'zone' => $drawingMetadata['zone'] ?? null,
            'location' => $drawingMetadata['location'] ?? null,
            'workflow_status' => WorkflowStatus::Completed,
            'suitability_status' => SuitabilityStatus::IssuedForConstruction,
            'effective_state' => EffectiveState::Current,
            'created_by' => $creator->id,
        ]);
        if ($drawingMetadata !== []) {
            $document->forceFill(['document_type' => 'drawing', ...$drawingMetadata])->save();
        }

        foreach (['A', 'B'] as $index => $code) {
            if ($document->revisions()->where('revision_code', $code)->exists()) {
                continue;
            }

            $path = 'documents/'.$document->id.'/rev-'.strtolower($code).'.pdf';
            $bytes = "%PDF-1.4\n% EvoRail demo document revision ".$code."\n";
            Storage::disk('local')->put($path, $bytes);
            $storedFile = StoredFile::query()->create([
                'disk' => 'local',
                'path' => $path,
                'original_filename' => $number.'-Rev-'.$code.'.pdf',
                'mime_type' => 'application/pdf',
                'size' => strlen($bytes),
                'checksum' => hash('sha256', $bytes),
                'created_by' => $creator->id,
            ]);
            $revision = DocumentRevision::query()->create([
                'document_id' => $document->id,
                'revision_code' => $code,
                'revision_order' => $index + 1,
                'title' => $title,
                'workflow_status' => $index === 0 ? WorkflowStatus::Completed : WorkflowStatus::Draft,
                'suitability_status' => $index === 0 ? SuitabilityStatus::IssuedForConstruction : SuitabilityStatus::ForInformation,
                'effective_state' => $index === 0 ? EffectiveState::Current : EffectiveState::Superseded,
                'purpose_of_issue' => 'Issued for Construction',
                'issue_date' => now()->toDateString(),
                'change_reason' => 'Seeded '.$project->name.' revision '.$code,
                'metadata_snapshot' => ['line' => $project->name, 'revision' => $code],
                'stored_file_id' => $storedFile->id,
                'created_by' => $creator->id,
            ]);
            if ($document->current_revision_id === null) {
                $document->update(['current_revision_id' => $revision->id]);
            }
        }

        return $document;
    }
}
