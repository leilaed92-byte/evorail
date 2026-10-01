<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approvals', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('document_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('revision_id')->constrained('document_revisions')->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->foreignUuid('approver_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignUuid('requested_by')->constrained('users')->restrictOnDelete();
            $table->timestampTz('requested_at');
            $table->timestampTz('decided_at')->nullable();
            $table->text('decision_reason')->nullable();
            $table->timestampsTz();
            $table->index(['project_id', 'status']);
            $table->index(['project_id', 'approver_user_id', 'status']);
            $table->index(['revision_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approvals');
    }
};
