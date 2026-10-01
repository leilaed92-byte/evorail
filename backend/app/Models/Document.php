<?php

namespace App\Models;

use App\Enums\EffectiveState;
use App\Enums\SuitabilityStatus;
use App\Enums\WorkflowStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Document extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'project_id', 'document_number', 'title', 'discipline', 'current_revision_id',
        'workflow_status', 'suitability_status', 'effective_state', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'workflow_status' => WorkflowStatus::class,
            'suitability_status' => SuitabilityStatus::class,
            'effective_state' => EffectiveState::class,
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(DocumentRevision::class);
    }

    public function currentRevision(): BelongsTo
    {
        return $this->belongsTo(DocumentRevision::class, 'current_revision_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class);
    }
}
