<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectMembership extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['project_id', 'user_id', 'role', 'capabilities', 'status'];

    protected function casts(): array
    {
        return ['capabilities' => 'array'];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function grants(string $capability): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        $capabilities = $this->capabilities ?? self::roleCapabilities($this->role);

        return in_array('*', $capabilities, true) || in_array($capability, $capabilities, true);
    }

    /** @return list<string> */
    public static function roleCapabilities(string $role): array
    {
        return match ($role) {
            'admin' => ['*'],
            'engineer' => [
                'project.view', 'document.list', 'document.view', 'document.create', 'document.update',
                'revision.view', 'revision.create', 'revision.preview', 'revision.download', 'audit.view',
                'transmission.list', 'transmission.view', 'transmission.download',
            ],
            'reviewer' => [
                'project.view', 'document.list', 'document.view', 'revision.view', 'revision.preview',
                'review.view', 'review.comment', 'review.start', 'review.complete', 'review.return',
                'transmission.list', 'transmission.view',
            ],
            'director' => [
                'project.view', 'document.list', 'document.view', 'revision.view', 'revision.preview',
                'review.view', 'approval.view', 'approval.approve', 'approval.reject',
                'transmission.list', 'transmission.view', 'transmission.create', 'transmission.updateDraft', 'transmission.issue', 'transmission.download',
            ],
            'design_manager' => [
                'project.view', 'document.list', 'document.view', 'revision.view', 'revision.preview',
                'review.view', 'review.comment', 'review.start', 'review.complete', 'review.return',
                'approval.view', 'approval.approve', 'approval.reject',
                'transmission.list', 'transmission.view', 'transmission.create', 'transmission.updateDraft', 'transmission.issue', 'transmission.download',
            ],
            'viewer' => ['project.view', 'document.list', 'document.view', 'revision.view', 'revision.preview', 'transmission.list', 'transmission.view'],
            default => [],
        };
    }
}
