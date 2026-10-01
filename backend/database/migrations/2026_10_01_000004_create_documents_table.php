<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')->constrained()->cascadeOnDelete();
            $table->string('document_number');
            $table->string('title');
            $table->string('discipline')->nullable();
            $table->uuid('current_revision_id')->nullable();
            $table->string('workflow_status')->default('draft');
            $table->string('suitability_status')->default('for_information');
            $table->string('effective_state')->default('current');
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->unique(['project_id', 'document_number']);
            $table->index(['project_id', 'workflow_status', 'suitability_status', 'effective_state']);
            $table->index(['project_id', 'discipline']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
