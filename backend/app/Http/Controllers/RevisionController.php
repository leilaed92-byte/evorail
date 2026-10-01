<?php

namespace App\Http\Controllers;

use App\Enums\EffectiveState;
use App\Enums\SuitabilityStatus;
use App\Enums\WorkflowStatus;
use App\Http\Requests\StoreRevisionRequest;
use App\Http\Resources\RevisionResource;
use App\Models\AuditEvent;
use App\Models\Document;
use App\Models\DocumentRevision;
use App\Models\IdempotencyKey;
use App\Models\StoredFile;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class RevisionController extends Controller
{
    public function index(Request $request, Document $document): JsonResponse
    {
        Gate::authorize('view', $document);

        $revisions = $document->revisions()->with('storedFile')->orderByDesc('revision_order')->get();

        return ApiResponse::data($request, ['items' => RevisionResource::collection($revisions)->resolve($request)]);
    }

    public function show(Request $request, DocumentRevision $revision): JsonResponse
    {
        $revision->load(['document', 'storedFile']);
        Gate::authorize('view', $revision);

        return ApiResponse::data($request, ['revision' => RevisionResource::make($revision)->resolve($request)]);
    }

    public function store(StoreRevisionRequest $request, Document $document): JsonResponse
    {
        $revision = (new DocumentRevision)->setRelation('document', $document);
        Gate::authorize('create', $revision);

        $idempotencyKey = $request->header('Idempotency-Key');
        $requestHash = hash('sha256', json_encode([
            'revision_code' => $request->input('revision_code'),
            'title' => $request->input('title'),
            'change_reason' => $request->input('change_reason'),
            'purpose_of_issue' => $request->input('purpose_of_issue'),
            'description' => $request->input('description'),
            'metadata_snapshot' => $request->input('metadata_snapshot'),
            'file_name' => $request->file('file')->getClientOriginalName(),
            'file_checksum' => hash_file('sha256', $request->file('file')->getRealPath()),
        ], JSON_THROW_ON_ERROR));

        $path = null;
        try {
            return DB::transaction(function () use ($request, $document, $idempotencyKey, $requestHash, &$path): JsonResponse {
                $document = Document::query()->lockForUpdate()->findOrFail($document->id);

                if ($idempotencyKey !== null) {
                    $existing = IdempotencyKey::query()
                        ->where('user_id', $request->user()->id)
                        ->where('route', $request->path())
                        ->where('key', $idempotencyKey)
                        ->first();

                    if ($existing !== null) {
                        if ($existing->request_hash !== $requestHash) {
                            return ApiResponse::error($request, 'The idempotency key was already used with a different request.', 409, [], 'idempotency_conflict');
                        }

                        if ($existing->response_body !== null) {
                            return response()->json($existing->response_body, $existing->response_status ?? 201)
                                ->header('X-Request-Id', (string) $request->attributes->get('request_id'));
                        }
                    }
                }

                if ($document->revisions()->where('revision_code', $request->string('revision_code')->toString())->exists()) {
                    return ApiResponse::error($request, 'That revision code already exists for this document.', 409, [], 'duplicate_revision');
                }

                /** @var UploadedFile $uploadedFile */
                $uploadedFile = $request->file('file');
                $disk = 'local';
                $path = $uploadedFile->storeAs(
                    'documents/'.$document->id,
                    Str::uuid()->toString().'-'.$uploadedFile->getClientOriginalName(),
                    $disk,
                );

                $storedFile = StoredFile::query()->create([
                    'disk' => $disk,
                    'path' => $path,
                    'original_filename' => $uploadedFile->getClientOriginalName(),
                    'mime_type' => $uploadedFile->getMimeType() ?: 'application/octet-stream',
                    'size' => $uploadedFile->getSize(),
                    'checksum' => hash_file('sha256', $uploadedFile->getRealPath()),
                    'created_by' => $request->user()->id,
                ]);

                $nextOrder = ((int) $document->revisions()->max('revision_order')) + 1;
                $hasCurrent = $document->current_revision_id !== null;
                $effectiveState = $hasCurrent ? EffectiveState::Superseded : EffectiveState::Current;
                $revision = DocumentRevision::query()->create([
                    'document_id' => $document->id,
                    'revision_code' => $request->string('revision_code')->toString(),
                    'revision_order' => $nextOrder,
                    'title' => $request->string('title')->toString(),
                    'workflow_status' => WorkflowStatus::Draft,
                    'suitability_status' => SuitabilityStatus::ForInformation,
                    'effective_state' => $effectiveState,
                    'purpose_of_issue' => $request->input('purpose_of_issue'),
                    'change_reason' => $request->string('change_reason')->toString(),
                    'description' => $request->input('description'),
                    'metadata_snapshot' => $request->input('metadata_snapshot'),
                    'stored_file_id' => $storedFile->id,
                    'created_by' => $request->user()->id,
                ]);

                if (! $hasCurrent) {
                    $document->forceFill([
                        'current_revision_id' => $revision->id,
                        'title' => $revision->title,
                        'workflow_status' => $revision->workflow_status,
                        'suitability_status' => $revision->suitability_status,
                        'effective_state' => $revision->effective_state,
                    ])->save();
                }

                AuditEvent::query()->create([
                    'project_id' => $document->project_id,
                    'actor_user_id' => $request->user()->id,
                    'event_type' => 'revision.created',
                    'entity_type' => 'revision',
                    'entity_id' => $revision->id,
                    'metadata' => [
                        'document_id' => $document->id,
                        'revision_code' => $revision->revision_code,
                        'file_checksum' => $storedFile->checksum,
                    ],
                ]);

                $payload = ['data' => ['revision' => RevisionResource::make($revision->load('storedFile'))->resolve($request)], 'request_id' => $request->attributes->get('request_id')];

                if ($idempotencyKey !== null) {
                    IdempotencyKey::query()->updateOrCreate(
                        ['user_id' => $request->user()->id, 'route' => $request->path(), 'key' => $idempotencyKey],
                        ['request_hash' => $requestHash, 'response_status' => 201, 'response_body' => $payload, 'expires_at' => now()->addDay()],
                    );
                }

                return response()->json($payload, 201);
            });
        } catch (\Throwable $exception) {
            if ($path !== null) {
                Storage::disk('local')->delete($path);
            }

            throw $exception;
        }
    }

    public function preview(Request $request, DocumentRevision $revision): JsonResponse|BinaryFileResponse
    {
        $revision->load(['document', 'storedFile']);
        Gate::authorize('preview', $revision);

        if (! in_array($revision->storedFile->mime_type, ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'], true)) {
            return ApiResponse::error($request, 'A protected preview is not available for this file type yet.', 422, [
                'state' => 'unsupported',
                'mime_type' => $revision->storedFile->mime_type,
            ], 'preview_unavailable');
        }

        return response()->file(Storage::disk($revision->storedFile->disk)->path($revision->storedFile->path), [
            'Content-Type' => $revision->storedFile->mime_type,
            'Content-Disposition' => 'inline; filename="'.addslashes($revision->storedFile->original_filename).'"',
            'X-Request-Id' => (string) $request->attributes->get('request_id'),
        ]);
    }

    public function download(Request $request, DocumentRevision $revision): BinaryFileResponse
    {
        $revision->load(['document', 'storedFile']);
        Gate::authorize('download', $revision);

        return response()->download(
            Storage::disk($revision->storedFile->disk)->path($revision->storedFile->path),
            $revision->storedFile->original_filename,
            [
                'Content-Type' => $revision->storedFile->mime_type,
                'X-Request-Id' => (string) $request->attributes->get('request_id'),
            ],
        );
    }

    public function compare(Request $request, DocumentRevision $revision, DocumentRevision $otherRevision): JsonResponse
    {
        $revision->load(['document', 'storedFile']);
        $otherRevision->load(['document', 'storedFile']);
        Gate::authorize('view', $revision);
        Gate::authorize('view', $otherRevision);

        if ($revision->document_id !== $otherRevision->document_id) {
            return ApiResponse::error($request, 'Revisions must belong to the same document.', 409, [], 'revision_document_conflict');
        }

        $fields = ['revision_code', 'title', 'workflow_status', 'suitability_status', 'effective_state', 'description'];
        $changes = [];
        foreach ($fields as $field) {
            $left = $revision->{$field} instanceof \BackedEnum ? $revision->{$field}->value : $revision->{$field};
            $right = $otherRevision->{$field} instanceof \BackedEnum ? $otherRevision->{$field}->value : $otherRevision->{$field};
            if ($left !== $right) {
                $changes[$field] = ['from' => $left, 'to' => $right];
            }
        }

        $changes['file'] = [
            'from' => ['filename' => $revision->storedFile->original_filename, 'checksum' => $revision->storedFile->checksum, 'size' => $revision->storedFile->size],
            'to' => ['filename' => $otherRevision->storedFile->original_filename, 'checksum' => $otherRevision->storedFile->checksum, 'size' => $otherRevision->storedFile->size],
        ];

        return ApiResponse::data($request, [
            'document_id' => $revision->document_id,
            'from' => $revision->revision_code,
            'to' => $otherRevision->revision_code,
            'changes' => $changes,
        ]);
    }
}
