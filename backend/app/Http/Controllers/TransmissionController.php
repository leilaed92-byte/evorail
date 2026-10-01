<?php

namespace App\Http\Controllers;

use App\Enums\TransmissionStatus;
use App\Http\Requests\IssueTransmissionRequest;
use App\Http\Requests\StoreTransmissionItemRequest;
use App\Http\Requests\StoreTransmissionRecipientRequest;
use App\Http\Requests\StoreTransmissionRequest;
use App\Http\Requests\TransmissionIndexRequest;
use App\Http\Requests\UpdateTransmissionRequest;
use App\Http\Resources\TransmissionItemResource;
use App\Http\Resources\TransmissionResource;
use App\Models\AuditEvent;
use App\Models\Document;
use App\Models\DocumentRevision;
use App\Models\IdempotencyKey;
use App\Models\Project;
use App\Models\Transmission;
use App\Models\TransmissionItem;
use App\Models\TransmissionRecipient;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class TransmissionController extends Controller
{
    public function index(TransmissionIndexRequest $request, Project $project): JsonResponse
    {
        Gate::authorize('viewAny', [Transmission::class, $project]);
        $query = $project->transmissions()->with(['creator', 'issuer', 'recipients', 'items.document', 'items.revision']);
        $validated = $request->validated();
        if (isset($validated['status'])) {
            $query->where('status', $validated['status']);
        }
        $issuer = $validated['issuer_user_id'] ?? $validated['issuer'] ?? null;
        if ($issuer !== null) {
            $query->where('issued_by', $issuer);
        }
        if (isset($validated['recipient'])) {
            $query->whereHas('recipients', fn ($q) => $q->whereLike('recipient_name', '%'.$validated['recipient'].'%')->orWhereLike('recipient_email', '%'.$validated['recipient'].'%'));
        }
        if (isset($validated['date_from'])) {
            $query->where(function ($q) use ($validated): void {
                $q->where('created_at', '>=', $validated['date_from'])->orWhere('issued_at', '>=', $validated['date_from']);
            });
        }
        if (isset($validated['date_to'])) {
            $query->where(function ($q) use ($validated): void {
                $q->where('created_at', '<=', $validated['date_to'])->orWhere('issued_at', '<=', $validated['date_to']);
            });
        }
        if (isset($validated['search'])) {
            $term = '%'.$validated['search'].'%';
            $query->where(fn ($q) => $q->whereLike('reference', $term)->orWhereLike('subject', $term)->orWhereLike('purpose', $term)->orWhereHas('recipients', fn ($r) => $r->whereLike('recipient_name', $term)->orWhereLike('recipient_email', $term)));
        }
        [$column, $direction] = $this->sort($validated['sort'] ?? '-created_at');
        $transmissions = $query->orderBy($column, $direction)->orderBy('id')->paginate($request->integer('per_page', 25));

        return ApiResponse::data($request, ['items' => TransmissionResource::collection($transmissions)->resolve($request), 'pagination' => $this->pagination($transmissions)]);
    }

    public function store(StoreTransmissionRequest $request, Project $project): JsonResponse
    {
        Gate::authorize('create', [Transmission::class, $project]);
        $idempotencyKey = $request->header('Idempotency-Key');
        $requestHash = $this->hash($request->validated());

        return DB::transaction(function () use ($request, $project, $idempotencyKey, $requestHash): JsonResponse {
            if ($replay = $this->replay($request, $idempotencyKey, $requestHash)) {
                return $replay;
            }
            $transmission = Transmission::query()->create([...$request->validated(), 'project_id' => $project->id, 'status' => TransmissionStatus::Draft, 'created_by' => $request->user()->id]);
            $this->audit($transmission, $request, 'transmission.created', ['status' => 'draft']);
            $payload = ['data' => ['transmission' => TransmissionResource::make($this->load($transmission))->resolve($request)], 'request_id' => $request->attributes->get('request_id')];
            $this->remember($request, $idempotencyKey, $requestHash, $payload, 201);

            return response()->json($payload, 201);
        });
    }

    public function show(Request $request, Transmission $transmission): JsonResponse
    {
        Gate::authorize('view', $transmission);
        $transmission = $this->load($transmission);
        $activity = AuditEvent::query()->where('project_id', $transmission->project_id)->where('entity_type', 'transmission')->where('entity_id', $transmission->id)->latest('created_at')->get(['id', 'event_type', 'entity_type', 'entity_id', 'metadata', 'created_at']);

        return ApiResponse::data($request, ['transmission' => TransmissionResource::make($transmission)->resolve($request), 'activity' => $activity]);
    }

    public function update(UpdateTransmissionRequest $request, Transmission $transmission): JsonResponse
    {
        Gate::authorize('updateDraft', $transmission);

        return DB::transaction(function () use ($request, $transmission): JsonResponse {
            $locked = Transmission::query()->lockForUpdate()->findOrFail($transmission->id);
            if ($locked->status !== TransmissionStatus::Draft) {
                return $this->conflict($request, 'Issued transmissions are immutable.', 'transmission_immutable');
            }
            $before = $locked->only(['reference', 'subject', 'purpose', 'type']);
            $locked->fill($request->validated())->save();
            $this->audit($locked, $request, 'transmission.updated', ['before' => $before, 'after' => $locked->only(['reference', 'subject', 'purpose', 'type'])]);

            return ApiResponse::data($request, ['transmission' => TransmissionResource::make($this->load($locked))->resolve($request)]);
        });
    }

    public function addRecipient(StoreTransmissionRecipientRequest $request, Transmission $transmission): JsonResponse
    {
        Gate::authorize('updateDraft', $transmission);

        return DB::transaction(function () use ($request, $transmission): JsonResponse {
            $locked = Transmission::query()->lockForUpdate()->findOrFail($transmission->id);
            if ($locked->status !== TransmissionStatus::Draft) {
                return $this->conflict($request, 'Issued transmissions are immutable.', 'transmission_immutable');
            }
            $recipient = $locked->recipients()->create($request->validated());
            $this->audit($locked, $request, 'transmission.recipient_added', ['recipient_id' => $recipient->id, 'recipient_name' => $recipient->recipient_name]);

            return ApiResponse::data($request, ['recipient' => $recipient], 201);
        });
    }

    public function removeRecipient(Request $request, Transmission $transmission, TransmissionRecipient $recipient): JsonResponse
    {
        Gate::authorize('updateDraft', $transmission);
        if ($recipient->transmission_id !== $transmission->id) {
            abort(404);
        }

        return DB::transaction(function () use ($request, $transmission, $recipient): JsonResponse {
            $locked = Transmission::query()->lockForUpdate()->findOrFail($transmission->id);
            if ($locked->status !== TransmissionStatus::Draft) {
                return $this->conflict($request, 'Issued transmissions are immutable.', 'transmission_immutable');
            }
            $recipient->delete();
            $this->audit($locked, $request, 'transmission.recipient_removed', ['recipient_id' => $recipient->id]);

            return ApiResponse::data($request, ['deleted' => true]);
        });
    }

    public function addItem(StoreTransmissionItemRequest $request, Transmission $transmission): JsonResponse
    {
        Gate::authorize('updateDraft', $transmission);
        $document = Document::query()->findOrFail($request->string('document_id')->toString());
        $revision = DocumentRevision::query()->with('storedFile')->findOrFail($request->string('revision_id')->toString());
        Gate::authorize('view', $document);
        Gate::authorize('view', $revision);
        if ($document->project_id !== $transmission->project_id || $revision->document_id !== $document->id) {
            return $this->conflict($request, 'The document, revision, and transmission must share one project and document.', 'transmission_item_context_conflict');
        }

        return DB::transaction(function () use ($request, $transmission, $document, $revision): JsonResponse {
            $locked = Transmission::query()->lockForUpdate()->findOrFail($transmission->id);
            if ($locked->status !== TransmissionStatus::Draft) {
                return $this->conflict($request, 'Issued transmissions are immutable.', 'transmission_immutable');
            }
            if ($locked->items()->where('document_id', $document->id)->where('revision_id', $revision->id)->exists()) {
                return $this->conflict($request, 'That exact document revision is already in the transmission.', 'duplicate_transmission_item');
            }
            $item = $locked->items()->create($this->snapshot($document, $revision));
            $this->audit($locked, $request, 'transmission.item_added', ['item_id' => $item->id, 'document_id' => $document->id, 'revision_id' => $revision->id, 'revision_code' => $revision->revision_code]);

            return ApiResponse::data($request, ['item' => TransmissionItemResource::make($item->load(['document', 'revision']))->resolve($request)], 201);
        });
    }

    public function removeItem(Request $request, Transmission $transmission, TransmissionItem $item): JsonResponse
    {
        Gate::authorize('updateDraft', $transmission);
        if ($item->transmission_id !== $transmission->id) {
            abort(404);
        }

        return DB::transaction(function () use ($request, $transmission, $item): JsonResponse {
            $locked = Transmission::query()->lockForUpdate()->findOrFail($transmission->id);
            if ($locked->status !== TransmissionStatus::Draft) {
                return $this->conflict($request, 'Issued transmissions are immutable.', 'transmission_immutable');
            }
            $item->delete();
            $this->audit($locked, $request, 'transmission.item_removed', ['item_id' => $item->id, 'document_id' => $item->document_id, 'revision_id' => $item->revision_id]);

            return ApiResponse::data($request, ['deleted' => true]);
        });
    }

    public function issue(IssueTransmissionRequest $request, Transmission $transmission): JsonResponse
    {
        Gate::authorize('issue', $transmission);
        $idempotencyKey = $request->header('Idempotency-Key');
        $requestHash = $this->hash($request->validated());

        return DB::transaction(function () use ($request, $transmission, $idempotencyKey, $requestHash): JsonResponse {
            if ($replay = $this->replay($request, $idempotencyKey, $requestHash)) {
                return $replay;
            }
            $locked = Transmission::query()->lockForUpdate()->findOrFail($transmission->id);
            if ($locked->status !== TransmissionStatus::Draft) {
                return $this->conflict($request, 'The transmission has already been issued or cancelled.', 'transmission_issue_conflict');
            }
            $locked->load(['recipients', 'items.document', 'items.revision.storedFile', 'creator']);
            if (blank($locked->subject)) {
                return $this->conflict($request, 'A subject is required before issue.', 'transmission_validation_conflict');
            }
            if ($locked->recipients->isEmpty()) {
                return $this->conflict($request, 'At least one recipient is required before issue.', 'transmission_recipient_required');
            }
            if ($locked->items->isEmpty()) {
                return $this->conflict($request, 'At least one exact revision item is required before issue.', 'transmission_item_required');
            }
            foreach ($locked->items as $item) {
                if ($item->document->project_id !== $locked->project_id || $item->revision->document_id !== $item->document_id) {
                    return $this->conflict($request, 'Every item must retain a valid exact revision in the transmission project.', 'transmission_item_context_conflict');
                }
                $item->forceFill($this->snapshot($item->document, $item->revision))->save();
            }
            $locked->forceFill(['reference' => $locked->reference ?: $this->generatedReference($locked->project_id), 'issued_by' => $request->user()->id, 'issued_at' => now(), 'status' => TransmissionStatus::Issued])->save();
            $this->audit($locked, $request, 'transmission.issued', ['reference' => $locked->reference, 'item_revision_ids' => $locked->items->pluck('revision_id')->values()->all(), 'item_revision_codes' => $locked->items->pluck('revision_code_snapshot')->values()->all(), 'note' => $request->input('note')]);
            $payload = ['data' => ['transmission' => TransmissionResource::make($this->load($locked))->resolve($request)], 'request_id' => $request->attributes->get('request_id')];
            $this->remember($request, $idempotencyKey, $requestHash, $payload, 200);

            return response()->json($payload);
        });
    }

    public function download(Request $request, Transmission $transmission): JsonResponse
    {
        Gate::authorize('download', $transmission);
        $transmission = $this->load($transmission);
        foreach ($transmission->items as $item) {
            Gate::authorize('download', $item->revision);
        }
        $this->audit($transmission, $request, 'transmission.downloaded', ['item_count' => $transmission->items->count(), 'revision_ids' => $transmission->items->pluck('revision_id')->values()->all()]);

        return ApiResponse::data($request, ['transmission' => TransmissionResource::make($transmission)->resolve($request), 'manifest' => $transmission->items->map(fn (TransmissionItem $item): array => ['item_id' => $item->id, 'document_id' => $item->document_id, 'revision_id' => $item->revision_id, 'revision_code' => $item->revision_code_snapshot, 'file_name' => $item->file_name_snapshot, 'file_checksum' => $item->file_checksum_snapshot, 'download_url' => url('/api/revisions/'.$item->revision_id.'/download')])->values()->all()]);
    }

    private function load(Transmission $transmission): Transmission
    {
        return $transmission->load(['creator', 'issuer', 'recipients', 'items.document', 'items.revision']);
    }

    private function snapshot(Document $document, DocumentRevision $revision): array
    {
        $file = $revision->storedFile;

        return ['document_id' => $document->id, 'revision_id' => $revision->id, 'document_number_snapshot' => $document->document_number, 'document_title_snapshot' => $document->title, 'revision_code_snapshot' => $revision->revision_code, 'discipline_snapshot' => $document->discipline, 'suitability_snapshot' => $revision->suitability_status?->value, 'workflow_snapshot' => $revision->workflow_status?->value, 'effective_state_snapshot' => $revision->effective_state?->value, 'file_name_snapshot' => $file?->original_filename, 'file_checksum_snapshot' => $file?->checksum, 'file_size_snapshot' => $file?->size, 'file_mime_type_snapshot' => $file?->mime_type];
    }

    private function generatedReference(string $projectId): string
    {
        do {
            $reference = 'TR-'.now()->format('Ymd').'-'.Str::upper(Str::random(8));
        } while (Transmission::query()->where('project_id', $projectId)->where('reference', $reference)->exists());

        return $reference;
    }

    private function audit(Transmission $transmission, Request $request, string $event, array $metadata): void
    {
        AuditEvent::query()->create(['project_id' => $transmission->project_id, 'actor_user_id' => $request->user()->id, 'event_type' => $event, 'entity_type' => 'transmission', 'entity_id' => $transmission->id, 'metadata' => $metadata]);
    }

    private function hash(array $data): string
    {
        return hash('sha256', json_encode($data, JSON_THROW_ON_ERROR));
    }

    private function replay(Request $request, ?string $key, string $hash): ?JsonResponse
    {
        if ($key === null) {
            return null;
        }
        $existing = IdempotencyKey::query()->where('user_id', $request->user()->id)->where('route', $request->path())->where('key', $key)->first();
        if ($existing === null) {
            return null;
        }
        if ($existing->request_hash !== $hash) {
            return ApiResponse::error($request, 'The idempotency key was already used with a different request.', 409, [], 'idempotency_conflict');
        }
        if ($existing->response_body !== null) {
            return response()->json($existing->response_body, $existing->response_status ?? 200)->header('X-Request-Id', (string) $request->attributes->get('request_id'));
        }

        return null;
    }

    private function remember(Request $request, ?string $key, string $hash, array $payload, int $status): void
    {
        if ($key !== null) {
            IdempotencyKey::query()->updateOrCreate(['user_id' => $request->user()->id, 'route' => $request->path(), 'key' => $key], ['request_hash' => $hash, 'response_status' => $status, 'response_body' => $payload, 'expires_at' => now()->addDay()]);
        }
    }

    private function conflict(Request $request, string $message, string $code): JsonResponse
    {
        return ApiResponse::error($request, $message, 409, [], $code);
    }

    private function sort(string $sort): array
    {
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';

        return [ltrim($sort, '-'), $direction];
    }

    private function pagination($paginator): array
    {
        return ['current_page' => $paginator->currentPage(), 'per_page' => $paginator->perPage(), 'total' => $paginator->total(), 'last_page' => $paginator->lastPage()];
    }
}
