# EvoRail API contracts

The Laravel backend under `backend/` is the source of the M2/M3 HTTP contract. JSON responses include a `request_id`. Errors use:

```json
{
  "message": "...",
  "code": "unauthenticated|forbidden|not_found|validation_failed|duplicate_revision|idempotency_conflict|preview_unavailable",
  "errors": {},
  "request_id": "uuid"
}
```

## Authentication

- `GET /sanctum/csrf-cookie` sets the CSRF and session cookies.
- `POST /api/login` accepts `email`, `password`, and optional `remember`; it is rate limited to five attempts per minute per email/IP pair.
- `POST /api/logout` invalidates the session and regenerates the CSRF token.
- `GET /api/me` returns the authenticated user, project memberships, and frontend-safe capability hints.

Unauthenticated API access returns `401`; policy failures return `403`. The browser must send credentials and the `Origin`/`Referer` that is listed in `SANCTUM_STATEFUL_DOMAINS`.

## Projects

- `GET /api/projects` returns only active projects for which the user has an active membership.
- `GET /api/projects/{project}` returns one authorized project or `403`.

Each project includes `role` and safe capability hints (`viewProject`, `createDocument`, `createRevision`, `viewAudit`). These hints never replace Laravel policy checks.

## Documents

`GET /api/projects/{project}/documents` supports `search`, `workflow_status`, `suitability`, `effective_state`, `discipline`, `revision`, `current_only`, `sort`, `page`, and `per_page`. It returns deterministic pagination and applies project authorization before filtering.

`GET /api/documents/{document}` returns canonical metadata and the current revision reference. `GET /api/documents/{document}/activity` derives activity from append-only audit events.

## Revisions and files

- `GET /api/documents/{document}/revisions`
- `GET /api/revisions/{revision}`
- `POST /api/documents/{document}/revisions` as multipart form data with `revision_code`, `title`, `change_reason`, optional metadata, and `file`
- `GET /api/revisions/{revision}/preview`
- `GET /api/revisions/{revision}/download`
- `GET /api/revisions/{revision}/compare/{otherRevision}`

Revision creation accepts `Idempotency-Key` and returns `201`. Duplicate revision codes and idempotency conflicts return `409`. Preview/download authorize the exact revision. PDF and image previews stream inline; CAD files return a structured `422 preview_unavailable` response.

The MCP adapter contract remains documented in [MCP_INTEGRATION.md](MCP_INTEGRATION.md); it must call this API rather than implement authorization or persistence itself.

## Reviews

- `GET /api/projects/{project}/reviews` returns a paginated, project-authorized review queue. It supports `status`, `assignee_user_id`/`assignee`, `due_from`, `due_to`, `overdue`, `discipline`, `document_id`, `revision_id`, `sort`, and `per_page`.
- `GET /api/reviews/{review}` returns the review, its exact `revision_id`/revision snapshot, comments, and append-only activity.
- `POST /api/documents/{document}/reviews` creates a review for a required exact `revision_id`.
- `POST /api/reviews/{review}/comments` creates a comment; comments are separate from audit rows.
- `POST /api/reviews/{review}/start`, `/complete`, and `/return` use explicit transitions and return `409 review_transition_conflict` for stale or invalid states.

## Approvals

- `GET /api/projects/{project}/approvals` returns a paginated, project-authorized approval queue. It supports `status`, `approver_user_id`/`approver`, `discipline`, `document_id`, `revision_id`, `sort`, and `per_page`.
- `GET /api/approvals/{approval}` returns the approval, its exact `revision_id`/revision snapshot, and append-only activity.
- `POST /api/documents/{document}/approvals` creates a pending approval for a required exact `revision_id` and assigned approver.
- `POST /api/approvals/{approval}/approve` and `/reject` record a final decision and optional reason. The row is locked and a second decision returns `409 approval_decision_conflict`.

Reviews and approvals are independent resources. Every list, detail, comment, transition, and decision is authorized on the server against project membership and assignment/role capabilities.

## Transmissions

- `GET /api/projects/{project}/transmissions` returns a paginated, project-authorized register. It supports `status`, `issuer_user_id`/`issuer`, `recipient`, `date_from`, `date_to`, `search`, `sort`, `page`, and `per_page`.
- `POST /api/projects/{project}/transmissions` creates a `draft` transmission with `subject` and optional `reference`, `purpose`, and `type`. `Idempotency-Key` is supported.
- `GET /api/transmissions/{transmission}` returns the transmission, recipients, exact items, frozen snapshot fields, and append-only activity.
- `PATCH /api/transmissions/{transmission}` edits draft metadata only.
- `POST`/`DELETE` `/api/transmissions/{transmission}/recipients/{recipient}` manages draft recipients.
- `POST`/`DELETE` `/api/transmissions/{transmission}/items/{item}` manages draft items. Adding an item requires both `document_id` and `revision_id`; the server validates the document/revision/project relationship and never selects a latest revision implicitly.
- `POST /api/transmissions/{transmission}/issue` performs a locked, atomic issue transaction. It requires a recipient and at least one exact item, freezes item metadata, assigns `issued_by`/`issued_at`, generates a reference when needed, and supports idempotent replay with `Idempotency-Key`.
- `GET /api/transmissions/{transmission}/download` returns an authorized frozen manifest and protected exact-revision download URLs. All contents are authorized before the manifest is returned.

Issued transmissions are read-only through ordinary mutation routes. Repeated issue with a new key returns `409 transmission_issue_conflict`; a reused key with another request returns `409 idempotency_conflict`.
