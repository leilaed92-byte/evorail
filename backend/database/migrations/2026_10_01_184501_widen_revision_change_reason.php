<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_revisions', function (Blueprint $table): void {
            $table->text('change_reason')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('document_revisions', function (Blueprint $table): void {
            $table->string('change_reason', 1000)->nullable()->change();
        });
    }
};
