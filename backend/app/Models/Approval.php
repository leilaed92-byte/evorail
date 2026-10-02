<?php

namespace App\Models;

use App\Enums\ApprovalStatus;
use App\Enums\SuitabilityStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Approval extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'project_id', 'document_id', 'revision_id', 'status', 'approver_user_id', 'requested_by',
        'requested_at', 'decided_at', 'decision_reason',
        'approved_suitability_status',
    ];

    protected function casts(): array
    {
        return [
            'status' => ApprovalStatus::class,
            'requested_at' => 'datetime',
            'decided_at' => 'datetime',
            'approved_suitability_status' => SuitabilityStatus::class,
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function revision(): BelongsTo
    {
        return $this->belongsTo(DocumentRevision::class, 'revision_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_user_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
