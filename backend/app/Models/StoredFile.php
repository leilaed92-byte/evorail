<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class StoredFile extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'disk', 'path', 'original_filename', 'mime_type', 'size', 'checksum', 'created_by',
    ];

    public function revision(): HasOne
    {
        return $this->hasOne(DocumentRevision::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
