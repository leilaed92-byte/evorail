<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_revision_id_approver_user_id_requested_at_unique');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE approvals ADD CONSTRAINT approvals_revision_id_approver_user_id_requested_at_unique UNIQUE (revision_id, approver_user_id, requested_at)');
    }
};
