<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('document_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('revision_id')->constrained('document_revisions')->cascadeOnDelete();
            $table->string('status')->default('open');
            $table->foreignUuid('assignee_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->timestampTz('due_at')->nullable();
            $table->timestampTz('started_at')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->timestampTz('returned_at')->nullable();
            $table->timestampsTz();
            $table->index(['project_id', 'status']);
            $table->index(['project_id', 'assignee_user_id', 'status']);
            $table->index(['revision_id', 'status']);
            $table->index(['project_id', 'due_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
