<?php

namespace Database\Factories;

use App\Models\Document;
use App\Models\DocumentRevision;
use App\Models\StoredFile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<DocumentRevision> */
class DocumentRevisionFactory extends Factory
{
    protected $model = DocumentRevision::class;

    public function definition(): array
    {
        return [
            'document_id' => Document::factory(),
            'revision_code' => 'A',
            'revision_order' => 1,
            'title' => fake()->sentence(4),
            'workflow_status' => 'draft',
            'suitability_status' => 'for_information',
            'effective_state' => 'current',
            'purpose_of_issue' => 'For Information',
            'change_reason' => 'Initial revision',
            'metadata_snapshot' => [],
            'stored_file_id' => StoredFile::factory(),
            'created_by' => User::factory(),
        ];
    }
}
