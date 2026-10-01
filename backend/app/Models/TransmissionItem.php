<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransmissionItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'transmission_id', 'document_id', 'revision_id', 'document_number_snapshot', 'document_title_snapshot',
        'revision_code_snapshot', 'discipline_snapshot', 'suitability_snapshot', 'workflow_snapshot',
        'effective_state_snapshot', 'file_name_snapshot', 'file_checksum_snapshot', 'file_size_snapshot', 'file_mime_type_snapshot',
    ];

    public function transmission(): BelongsTo
    {
        return $this->belongsTo(Transmission::class);
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function revision(): BelongsTo
    {
        return $this->belongsTo(DocumentRevision::class, 'revision_id');
    }
}
