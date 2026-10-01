<?php

namespace Database\Factories;

use App\Models\Document;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Document> */
class DocumentFactory extends Factory
{
    protected $model = Document::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'document_number' => fake()->unique()->bothify('LNA-EVO-TRK-DWG-S##-#####'),
            'title' => fake()->sentence(4),
            'discipline' => 'TRK',
            'workflow_status' => 'draft',
            'suitability_status' => 'for_information',
            'effective_state' => 'current',
            'created_by' => User::factory(),
        ];
    }
}
