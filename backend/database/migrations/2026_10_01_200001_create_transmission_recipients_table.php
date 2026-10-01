<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transmission_recipients', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('transmission_id')->constrained()->cascadeOnDelete();
            $table->string('recipient_type')->default('contact');
            $table->string('recipient_name');
            $table->string('recipient_email')->nullable();
            $table->text('recipient_address')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamps();
            $table->index(['transmission_id', 'recipient_type']);
            $table->index(['transmission_id', 'recipient_email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transmission_recipients');
    }
};
