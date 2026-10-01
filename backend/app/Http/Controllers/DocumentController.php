<?php

namespace App\Http\Controllers;

use App\Http\Requests\DocumentIndexRequest;
use App\Http\Resources\DocumentResource;
use App\Models\AuditEvent;
use App\Models\Document;
use App\Models\Project;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DocumentController extends Controller
{
    public function index(DocumentIndexRequest $request, Project $project): JsonResponse
    {
        Gate::authorize('viewAny', [Document::class, $project]);

        $query = $project->documents()->with(['currentRevision.storedFile'])->select('documents.*');
        $validated = $request->validated();

        if ($request->filled('search')) {
            $term = '%'.$request->string('search')->toString().'%';
            $query->where(function ($builder) use ($term): void {
                $builder->whereLike('document_number', $term)
                    ->orWhereLike('title', $term)
                    ->orWhereLike('discipline', $term);
            });
        }

        foreach ([
            'workflow_status' => 'workflow_status',
            'suitability' => 'suitability_status',
            'effective_state' => 'effective_state',
            'discipline' => 'discipline',
        ] as $input => $column) {
            if (array_key_exists($input, $validated) && $validated[$input] !== null) {
                $query->where($column, $validated[$input]);
            }
        }

        if ($request->boolean('current_only')) {
            $query->where('effective_state', 'current');
        }

        if ($request->filled('revision')) {
            $query->whereHas('revisions', fn ($revisions) => $revisions->where('revision_code', $request->string('revision')->toString()));
        }

        $sort = $request->string('sort', 'document_number')->toString();
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column = ltrim($sort, '-');
        $query->orderBy($column, $direction)->orderBy('id');

        $documents = $query->paginate($request->integer('per_page', 25));

        return ApiResponse::data($request, [
            'items' => DocumentResource::collection($documents)->resolve($request),
            'pagination' => [
                'current_page' => $documents->currentPage(),
                'per_page' => $documents->perPage(),
                'total' => $documents->total(),
                'last_page' => $documents->lastPage(),
            ],
        ]);
    }

    public function show(Request $request, Document $document): JsonResponse
    {
        Gate::authorize('view', $document);
        $document->load(['currentRevision.storedFile', 'project']);

        return ApiResponse::data($request, ['document' => DocumentResource::make($document)->resolve($request)]);
    }

    public function activity(Request $request, Document $document): JsonResponse
    {
        Gate::authorize('view', $document);

        $revisionIds = $document->revisions()->pluck('id');
        $events = AuditEvent::query()
            ->where('project_id', $document->project_id)
            ->where(function ($query) use ($document, $revisionIds): void {
                $query->where(function ($entity) use ($document): void {
                    $entity->where('entity_type', 'document')->where('entity_id', $document->id);
                })->orWhere(function ($entity) use ($revisionIds): void {
                    $entity->where('entity_type', 'revision')->whereIn('entity_id', $revisionIds);
                });
            })
            ->latest('created_at')
            ->get(['id', 'event_type', 'entity_type', 'entity_id', 'metadata', 'created_at']);

        return ApiResponse::data($request, ['items' => $events]);
    }
}
