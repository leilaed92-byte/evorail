<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transmission_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('transmission_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('document_id')->constrained()->restrictOnDelete();
            $table->foreignUuid('revision_id')->constrained('document_revisions')->restrictOnDelete();
            $table->string('document_number_snapshot');
            $table->string('document_title_snapshot');
            $table->string('revision_code_snapshot');
            $table->string('discipline_snapshot')->nullable();
            $table->string('suitability_snapshot')->nullable();
            $table->string('workflow_snapshot')->nullable();
            $table->string('effective_state_snapshot')->nullable();
            $table->string('file_name_snapshot')->nullable();
            $table->string('file_checksum_snapshot', 64)->nullable();
            $table->unsignedBigInteger('file_size_snapshot')->nullable();
            $table->string('file_mime_type_snapshot')->nullable();
            $table->timestamps();
            $table->unique(['transmission_id', 'document_id', 'revision_id'], 'transmission_items_exact_unique');
            $table->index(['transmission_id', 'document_id']);
            $table->index(['document_id', 'revision_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transmission_items');
    }
};
