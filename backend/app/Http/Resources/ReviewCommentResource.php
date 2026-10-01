<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewCommentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'review_id' => $this->review_id,
            'author' => $this->whenLoaded('author', fn (): ?array => $this->author ? ['id' => $this->author->id, 'name' => $this->author->name] : null),
            'body' => $this->body,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
