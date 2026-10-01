<?php

namespace App\Http\Controllers;

use App\Enums\ReviewStatus;
use App\Http\Requests\ReviewIndexRequest;
use App\Http\Requests\StoreReviewCommentRequest;
use App\Http\Requests\StoreReviewRequest;
use App\Http\Resources\ReviewCommentResource;
use App\Http\Resources\ReviewResource;
use App\Models\AuditEvent;
use App\Models\Document;
use App\Models\DocumentRevision;
use App\Models\Project;
use App\Models\Review;
use App\Models\ReviewComment;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ReviewController extends Controller
{
    public function index(ReviewIndexRequest $request, Project $project): JsonResponse
    {
        Gate::authorize('viewAny', [Review::class, $project]);
        $query = $this->baseQuery($project);
        $validated = $request->validated();

        if (isset($validated['status'])) {
            $query->where('status', $validated['status']);
        }
        $assignee = $validated['assignee_user_id'] ?? $validated['assignee'] ?? null;
        if ($assignee !== null) {
            $query->where('assignee_user_id', $assignee);
        }
        if (isset($validated['due_from'])) {
            $query->where('due_at', '>=', $validated['due_from']);
        }
        if (isset($validated['due_to'])) {
            $query->where('due_at', '<=', $validated['due_to']);
        }
        if (array_key_exists('overdue', $validated)) {
            $validated['overdue'] ? $query->whereNotNull('due_at')->where('due_at', '<', now())->whereIn('status', [ReviewStatus::Open->value, ReviewStatus::InProgress->value, ReviewStatus::Returned->value]) : $query->where(fn ($builder) => $builder->whereNull('due_at')->orWhere('due_at', '>=', now()));
        }
        if (isset($validated['discipline'])) {
            $query->whereHas('document', fn ($documents) => $documents->where('discipline', $validated['discipline']));
        }
        if (isset($validated['document_id'])) {
            $query->where('document_id', $validated['document_id']);
        }
        if (isset($validated['revision_id'])) {
            $query->where('revision_id', $validated['revision_id']);
        }

        [$column, $direction] = $this->sort($validated['sort'] ?? '-created_at');
        $reviews = $query->orderBy($column, $direction)->orderBy('id')->paginate($request->integer('per_page', 25));

        return ApiResponse::data($request, [
            'items' => ReviewResource::collection($reviews)->resolve($request),
            'pagination' => $this->pagination($reviews),
        ]);
    }

    public function store(StoreReviewRequest $request, Document $document): JsonResponse
    {
        Gate::authorize('create', [Review::class, $document->project]);
        $revision = DocumentRevision::query()->whereKey($request->string('revision_id')->toString())->firstOrFail();
        $this->assertRevisionContext($request, $document, $revision);
        $this->assertProjectUser($request, $document->project_id, $request->input('assignee_user_id'));

        $review = DB::transaction(function () use ($request, $document, $revision): Review {
            $review = Review::query()->create([
                'project_id' => $document->project_id,
                'document_id' => $document->id,
                'revision_id' => $revision->id,
                'status' => ReviewStatus::Open,
                'assignee_user_id' => $request->input('assignee_user_id'),
                'created_by' => $request->user()->id,
                'due_at' => $request->input('due_at'),
            ]);
            $this->audit($review, $request, 'review.created', ['revision_id' => $revision->id, 'document_id' => $document->id, 'status' => $review->status->value]);

            return $review;
        });

        return ApiResponse::data($request, ['review' => ReviewResource::make($this->load($review))->resolve($request)], 201);
    }

    public function show(Request $request, Review $review): JsonResponse
    {
        Gate::authorize('view', $review);
        $review = $this->load($review);
        $activity = AuditEvent::query()->where('project_id', $review->project_id)->whereIn('entity_id', [$review->id, ...$review->comments->pluck('id')->all()])->latest('created_at')->get(['id', 'event_type', 'entity_type', 'entity_id', 'metadata', 'created_at']);

        return ApiResponse::data($request, [
            'review' => ReviewResource::make($review)->resolve($request),
            'activity' => $activity,
        ]);
    }

    public function comment(StoreReviewCommentRequest $request, Review $review): JsonResponse
    {
        Gate::authorize('comment', $review);
        if ($review->status === ReviewStatus::Cancelled) {
            return ApiResponse::error($request, 'Cancelled reviews cannot receive comments.', 409, [], 'review_state_conflict');
        }

        $comment = DB::transaction(function () use ($request, $review): ReviewComment {
            $comment = ReviewComment::query()->create(['review_id' => $review->id, 'author_user_id' => $request->user()->id, 'body' => $request->string('body')->toString()]);
            $this->audit($review, $request, 'review.commented', ['revision_id' => $review->revision_id, 'comment_id' => $comment->id]);

            return $comment;
        });

        return ApiResponse::data($request, ['comment' => ReviewCommentResource::make($comment->load('author'))->resolve($request)], 201);
    }

    public function start(Request $request, Review $review): JsonResponse
    {
        return $this->transition($request, $review, 'start');
    }

    public function complete(Request $request, Review $review): JsonResponse
    {
        return $this->transition($request, $review, 'complete');
    }

    public function return(Request $request, Review $review): JsonResponse
    {
        return $this->transition($request, $review, 'return');
    }

    private function transition(Request $request, Review $review, string $action): JsonResponse
    {
        Gate::authorize($action, $review);
        $updated = DB::transaction(function () use ($request, $review, $action): Review|JsonResponse {
            $locked = Review::query()->lockForUpdate()->findOrFail($review->id);
            Gate::authorize($action, $locked);
            $allowed = match ($action) {
                'start' => [ReviewStatus::Open, ReviewStatus::Returned],
                'complete', 'return' => [ReviewStatus::InProgress],
                default => [],
            };
            if (! in_array($locked->status, $allowed, true)) {
                return ApiResponse::error($request, 'The review cannot perform this transition from its current state.', 409, ['status' => [$locked->status->value]], 'review_transition_conflict');
            }
            $before = $locked->status->value;
            $locked->forceFill(match ($action) {
                'start' => ['status' => ReviewStatus::InProgress, 'started_at' => $locked->started_at ?? now(), 'returned_at' => null],
                'complete' => ['status' => ReviewStatus::Completed, 'completed_at' => now()],
                'return' => ['status' => ReviewStatus::Returned, 'returned_at' => now()],
            })->save();
            $eventName = match ($action) {
                'start' => 'started',
                'complete' => 'completed',
                default => 'returned',
            };
            $event = 'review.'.$eventName;
            $this->audit($locked, $request, $event, ['revision_id' => $locked->revision_id, 'before_status' => $before, 'after_status' => $locked->status->value]);

            return $locked;
        });
        if ($updated instanceof JsonResponse) {
            return $updated;
        }

        return ApiResponse::data($request, ['review' => ReviewResource::make($this->load($updated))->resolve($request)]);
    }

    private function baseQuery(Project $project)
    {
        return $project->reviews()->with(['document', 'revision', 'assignee', 'creator']);
    }

    private function load(Review $review): Review
    {
        return $review->load(['document', 'revision', 'assignee', 'creator', 'comments.author']);
    }

    private function assertRevisionContext(Request $request, Document $document, DocumentRevision $revision): void
    {
        if ($revision->document_id !== $document->id) {
            abort(ApiResponse::error($request, 'The revision does not belong to this document.', 409, [], 'revision_context_conflict'));
        }
    }

    private function assertProjectUser(Request $request, string $projectId, ?string $userId): void
    {
        if ($userId !== null && ! DB::table('project_memberships')->where('project_id', $projectId)->where('user_id', $userId)->where('status', 'active')->exists()) {
            abort(ApiResponse::error($request, 'The assignee must be an active project member.', 422, ['assignee_user_id' => ['The selected assignee is not an active project member.']], 'validation_failed'));
        }
    }

    private function audit(Review $review, Request $request, string $event, array $metadata): void
    {
        AuditEvent::query()->create(['project_id' => $review->project_id, 'actor_user_id' => $request->user()->id, 'event_type' => $event, 'entity_type' => 'review', 'entity_id' => $review->id, 'metadata' => $metadata]);
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
