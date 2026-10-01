<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_revisions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('document_id')->constrained()->cascadeOnDelete();
            $table->string('revision_code');
            $table->unsignedInteger('revision_order');
            $table->string('title');
            $table->string('workflow_status')->default('draft');
            $table->string('suitability_status')->default('for_information');
            $table->string('effective_state')->default('current');
            $table->string('purpose_of_issue')->nullable();
            $table->date('issue_date')->nullable();
            $table->string('change_reason')->nullable();
            $table->text('description')->nullable();
            $table->json('metadata_snapshot')->nullable();
            $table->foreignUuid('stored_file_id')->constrained()->restrictOnDelete();
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->unique(['document_id', 'revision_code']);
            $table->unique(['document_id', 'revision_order']);
            $table->index(['document_id', 'effective_state']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_revisions');
    }
};
