<?php

namespace Database\Factories;

use App\Models\StoredFile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<StoredFile> */
class StoredFileFactory extends Factory
{
    protected $model = StoredFile::class;

    public function definition(): array
    {
        return [
            'disk' => 'local',
            'path' => 'documents/'.fake()->uuid().'/sample.pdf',
            'original_filename' => 'sample.pdf',
            'mime_type' => 'application/pdf',
            'size' => 7,
            'checksum' => hash('sha256', 'content'),
            'created_by' => User::factory(),
        ];
    }
}
