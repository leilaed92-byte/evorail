<?php

namespace Database\Factories;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Organization> */
class OrganizationFactory extends Factory
{
    protected $model = Organization::class;

    public function definition(): array
    {
        return [
            'legal_name' => fake()->company(),
            'code' => fake()->unique()->bothify('ORG-###'),
            'type' => 'engineering_office',
            'active' => true,
        ];
    }
}
