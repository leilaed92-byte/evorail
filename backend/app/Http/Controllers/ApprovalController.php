<?php

namespace App\Http\Controllers;

use App\Enums\ApprovalStatus;
use App\Http\Requests\ApprovalDecisionRequest;
use App\Http\Requests\ApprovalIndexRequest;
use App\Http\Requests\StoreApprovalRequest;
use App\Http\Resources\ApprovalResource;
use App\Models\Approval;
use App\Models\AuditEvent;
use App\Models\Document;
use App\Models\DocumentRevision;
use App\Models\Project;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ApprovalController extends Controller
{
    public function index(ApprovalIndexRequest $request, Project $project): JsonResponse
    {
        Gate::authorize('viewAny', [Approval::class, $project]);
        $query = $project->approvals()->with(['document', 'revision', 'approver', 'requester']);
        $validated = $request->validated();
        if (isset($validated['status'])) {
            $query->where('status', $validated['status']);
        }
        $approver = $validated['approver_user_id'] ?? $validated['approver'] ?? null;
        if ($approver !== null) {
            $query->where('approver_user_id', $approver);
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
        [$column, $direction] = $this->sort($validated['sort'] ?? '-requested_at');
        $approvals = $query->orderBy($column, $direction)->orderBy('id')->paginate($request->integer('per_page', 25));

        return ApiResponse::data($request, ['items' => ApprovalResource::collection($approvals)->resolve($request), 'pagination' => $this->pagination($approvals)]);
    }

    public function store(StoreApprovalRequest $request, Document $document): JsonResponse
    {
        Gate::authorize('create', [Approval::class, $document->project]);
        $revision = DocumentRevision::query()->whereKey($request->string('revision_id')->toString())->firstOrFail();
        if ($revision->document_id !== $document->id) {
            return ApiResponse::error($request, 'The revision does not belong to this document.', 409, [], 'revision_context_conflict');
        }
        if (! DB::table('project_memberships')->where('project_id', $document->project_id)->where('user_id', $request->string('approver_user_id')->toString())->where('status', 'active')->exists()) {
            return ApiResponse::error($request, 'The approver must be an active project member.', 422, ['approver_user_id' => ['The selected approver is not an active project member.']], 'validation_failed');
        }

        $approval = DB::transaction(function () use ($request, $document, $revision): Approval {
            $approval = Approval::query()->create([
                'project_id' => $document->project_id,
                'document_id' => $document->id,
                'revision_id' => $revision->id,
                'status' => ApprovalStatus::Pending,
                'approver_user_id' => $request->string('approver_user_id')->toString(),
                'requested_by' => $request->user()->id,
                'requested_at' => now(),
            ]);
            $this->audit($approval, $request, 'approval.created', ['revision_id' => $revision->id, 'document_id' => $document->id, 'status' => $approval->status->value]);

            return $approval;
        });

        return ApiResponse::data($request, ['approval' => ApprovalResource::make($this->load($approval))->resolve($request)], 201);
    }

    public function show(Request $request, Approval $approval): JsonResponse
    {
        Gate::authorize('view', $approval);
        $approval = $this->load($approval);
        $activity = AuditEvent::query()->where('project_id', $approval->project_id)->where('entity_type', 'approval')->where('entity_id', $approval->id)->latest('created_at')->get(['id', 'event_type', 'entity_type', 'entity_id', 'metadata', 'created_at']);

        return ApiResponse::data($request, ['approval' => ApprovalResource::make($approval)->resolve($request), 'activity' => $activity]);
    }

    public function approve(ApprovalDecisionRequest $request, Approval $approval): JsonResponse
    {
        return $this->decide($request, $approval, ApprovalStatus::Approved, 'approve');
    }

    public function reject(ApprovalDecisionRequest $request, Approval $approval): JsonResponse
    {
        return $this->decide($request, $approval, ApprovalStatus::Rejected, 'reject');
    }

    private function decide(ApprovalDecisionRequest $request, Approval $approval, ApprovalStatus $status, string $action): JsonResponse
    {
        Gate::authorize($action, $approval);
        $updated = DB::transaction(function () use ($request, $approval, $status, $action): Approval|JsonResponse {
            $locked = Approval::query()->lockForUpdate()->findOrFail($approval->id);
            Gate::authorize($action, $locked);
            if ($locked->status !== ApprovalStatus::Pending) {
                return ApiResponse::error($request, 'This approval already has a final decision.', 409, ['status' => [$locked->status->value]], 'approval_decision_conflict');
            }
            $locked->forceFill(['status' => $status, 'decided_at' => now(), 'decision_reason' => $request->input('reason')])->save();
            $this->audit($locked, $request, 'approval.'.$status->value, ['revision_id' => $locked->revision_id, 'document_id' => $locked->document_id, 'status' => $status->value, 'reason' => $locked->decision_reason]);

            return $locked;
        });
        if ($updated instanceof JsonResponse) {
            return $updated;
        }

        return ApiResponse::data($request, ['approval' => ApprovalResource::make($this->load($updated))->resolve($request)]);
    }

    private function load(Approval $approval): Approval
    {
        return $approval->load(['document', 'revision', 'approver', 'requester']);
    }

    private function audit(Approval $approval, Request $request, string $event, array $metadata): void
    {
        AuditEvent::query()->create(['project_id' => $approval->project_id, 'actor_user_id' => $request->user()->id, 'event_type' => $event, 'entity_type' => 'approval', 'entity_id' => $approval->id, 'metadata' => $metadata]);
    }

    private function sort(string $sort): array
    {
        return [ltrim($sort, '-'), str_starts_with($sort, '-') ? 'desc' : 'asc'];
    }

    private function pagination($paginator): array
    {
        return ['current_page' => $paginator->currentPage(), 'per_page' => $paginator->perPage(), 'total' => $paginator->total(), 'last_page' => $paginator->lastPage()];
    }
}
