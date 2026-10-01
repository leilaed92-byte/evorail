<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransmissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'project_id' => $this->project_id, 'reference' => $this->reference, 'subject' => $this->subject, 'purpose' => $this->purpose, 'type' => $this->type, 'status' => $this->status?->value,
            'created_by' => $this->whenLoaded('creator', fn (): ?array => $this->creator ? ['id' => $this->creator->id, 'name' => $this->creator->name, 'email' => $this->creator->email] : null),
            'issued_by' => $this->whenLoaded('issuer', fn (): ?array => $this->issuer ? ['id' => $this->issuer->id, 'name' => $this->issuer->name, 'email' => $this->issuer->email] : null),
            'issued_at' => $this->issued_at?->toISOString(), 'created_at' => $this->created_at?->toISOString(), 'updated_at' => $this->updated_at?->toISOString(),
            'recipients' => TransmissionRecipientResource::collection($this->whenLoaded('recipients')),
            'items' => TransmissionItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
