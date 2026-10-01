<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransmissionRecipientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'transmission_id' => $this->transmission_id, 'recipient_type' => $this->recipient_type, 'recipient_name' => $this->recipient_name, 'recipient_email' => $this->recipient_email, 'recipient_address' => $this->recipient_address, 'acknowledged_at' => $this->acknowledged_at?->toISOString()];
    }
}
