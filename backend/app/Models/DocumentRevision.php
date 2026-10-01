<?php

namespace App\Models;

use App\Enums\EffectiveState;
use App\Enums\SuitabilityStatus;
use App\Enums\WorkflowStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentRevision extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'document_id', 'revision_code', 'revision_order', 'title', 'workflow_status',
        'suitability_status', 'effective_state', 'purpose_of_issue', 'issue_date',
        'change_reason', 'description', 'metadata_snapshot', 'stored_file_id', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'workflow_status' => WorkflowStatus::class,
            'suitability_status' => SuitabilityStatus::class,
            'effective_state' => EffectiveState::class,
            'issue_date' => 'date',
            'metadata_snapshot' => 'array',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function storedFile(): BelongsTo
    {
        return $this->belongsTo(StoredFile::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
