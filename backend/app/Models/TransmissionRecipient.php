<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransmissionRecipient extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['transmission_id', 'recipient_type', 'recipient_name', 'recipient_email', 'recipient_address', 'acknowledged_at'];

    protected function casts(): array
    {
        return ['acknowledged_at' => 'datetime'];
    }

    public function transmission(): BelongsTo
    {
        return $this->belongsTo(Transmission::class);
    }
}
