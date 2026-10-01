<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transmissions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')->constrained()->cascadeOnDelete();
            $table->string('reference')->nullable();
            $table->string('subject');
            $table->string('purpose')->nullable();
            $table->string('type')->nullable();
            $table->string('status')->default('draft');
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignUuid('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('issued_at')->nullable();
            $table->timestamps();
            $table->unique(['project_id', 'reference']);
            $table->index(['project_id', 'status', 'created_at']);
            $table->index(['project_id', 'issued_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transmissions');
    }
};
