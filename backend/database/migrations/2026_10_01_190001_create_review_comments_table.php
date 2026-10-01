<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('review_comments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('review_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('author_user_id')->constrained('users')->restrictOnDelete();
            $table->text('body');
            $table->timestampsTz();
            $table->index(['review_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('review_comments');
    }
};
