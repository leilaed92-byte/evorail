<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table): void {
            $table->string('document_type')->default('document')->after('document_number');
            $table->string('drawing_type')->nullable()->after('discipline');
            $table->string('zone')->nullable()->after('drawing_type');
            $table->string('location')->nullable()->after('zone');
            $table->index(['project_id', 'document_type', 'drawing_type']);
            $table->index(['project_id', 'zone']);
        });

        DB::table('documents')
            ->where('document_number', 'like', '%-DWG-%')
            ->update(['document_type' => 'drawing']);
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table): void {
            $table->dropIndex(['documents_project_id_document_type_drawing_type_index']);
            $table->dropIndex(['documents_project_id_zone_index']);
            $table->dropColumn(['document_type', 'drawing_type', 'zone', 'location']);
        });
    }
};
