<?php

namespace App\Models;

use App\Enums\TransmissionStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transmission extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['project_id', 'reference', 'subject', 'purpose', 'type', 'status', 'created_by', 'issued_by', 'issued_at'];

    protected function casts(): array
    {
        return ['status' => TransmissionStatus::class, 'issued_at' => 'datetime'];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function issuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(TransmissionRecipient::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(TransmissionItem::class);
    }
}
