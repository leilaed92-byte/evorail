# EvoRail backend architecture

The canonical backend lives at `backend/` in this repository. It was reconstructed on 2026-10-01 with the current Composer-selected Laravel release compatible with the installed Herd runtime:

- Laravel Framework 13.34.0
- PHP 8.4.25 through Laravel Herd
- Composer 2.10.2 through Laravel Herd
- Laravel Sanctum 4.3.3 for first-party SPA session authentication

The application uses Laravel's session guard with Sanctum's stateful API middleware. Login and logout run through the web/session middleware, while protected API requests use `auth:sanctum`. CSRF cookies, secure session cookies, CORS credentials, rate-limited login, request IDs, and a consistent JSON error envelope are configured for the React frontend.

## Domain model

The M2/M3 foundation contains UUID-backed `User`, `Organization`, `Project`, and `ProjectMembership` models plus `Document`, `DocumentRevision`, `StoredFile`, `AuditEvent`, and `IdempotencyKey`. Memberships carry a project-specific role and optional capability list; no global user role grants project access.

`WorkflowStatus`, `SuitabilityStatus`, and `EffectiveState` are separate backed enums. A revision is immutable after creation. New revisions create new file metadata and an audit event; the previous revision is never overwritten. The document's `current_revision_id` is only set for the first revision in this foundation. Approval-driven supersession will be added in the next workflow pass.

## Storage

`StoredFile` records disk, private path, original filename, MIME type, byte size, and SHA-256 checksum. The local disk is private. Preview and download routes authorize the exact revision before reading bytes. PDF and image files can be previewed; CAD formats return a structured `preview_unavailable` response until a real preview worker exists. `.env.example` targets PostgreSQL and MinIO-compatible S3; local verification uses SQLite because PostgreSQL, Docker, and MinIO are not installed on this Mac.

## API surface

- `POST /api/login`, `POST /api/logout`, `GET /api/me`
- `GET /api/projects`, `GET /api/projects/{project}`
- `GET /api/projects/{project}/documents`
- `GET /api/documents/{document}`, `GET /api/documents/{document}/activity`
- `GET /api/documents/{document}/revisions`, `POST /api/documents/{document}/revisions`
- `GET /api/revisions/{revision}`
- `GET /api/revisions/{revision}/preview`, `GET /api/revisions/{revision}/download`
- `GET /api/revisions/{revision}/compare/{otherRevision}`

`ProjectPolicy`, `DocumentPolicy`, and `RevisionPolicy` enforce project membership and capability checks. Controllers use Form Requests, deterministic pagination/sorting, transactional revision creation, protected storage, and idempotency-key replay/conflict handling.

## Local runtime

The Herd PHP binary is available at `/Users/hello/Library/Application Support/Herd/bin/php`. Herd's CLI PHP is healthy, but the installed Herd service layer reports no configured PHP versions and returns 502 for `.test` sites. For verified local HTTP checks, run:

```sh
export PATH="/Users/hello/Library/Application Support/Herd/bin:$PATH"
cd /Users/hello/Documents/Codex/2026-10-01/new-chat/evorail/backend
php artisan serve --host=127.0.0.1 --port=8002
```

The frontend remains at `http://127.0.0.1:5174/`.
