# EvoRail verification record

Executed on 2026-10-01 from the EvoRail checkout. The verification layer uses PHPUnit/Laravel feature tests, Vitest with Testing Library, and Playwright browser flows.

## M5 Transmissions

- Backend tests cover draft creation/update, recipient management, exact document/revision item insertion, duplicate item conflict, invalid relationship, cross-project denial, issue prerequisites, atomic snapshot creation, duplicate/stale issue, idempotent replay, conflicting idempotency key, issued immutability, later-revision stability, protected manifest download, and audit events.
- Frontend tests cover real register filters, issued/draft detail, exact revision and frozen checksum display, protected download errors, composer draft creation, recipient entry, explicit document/revision selection, issue confirmation, and fail-closed `403` handling.
- The browser flow covers real draft setup, exact revision review, issue confirmation, issued read-only detail, protected manifest, creation of a later revision, and proof that the issued package still shows the historical revision.

## M4 Reviews and Approvals

- Review API tests cover authorized list/detail, exact revision association, comments, start/complete/return, invalid transitions (`409`), assignment authorization (`403`), and cross-project IDOR.
- Approval API tests cover list/detail, exact revision association, approve/reject, final immutability, duplicate/stale decisions (`409`), assigned-approver authorization (`403`), and cross-project IDOR.
- Audit assertions cover `review.created`, `review.commented`, `review.started`, `review.returned`, `review.completed`, and approval creation/final decision events.
- Frontend tests cover server-side filters, exact revision display, comments/actions, approval confirmation, immutable final controls, `403`, `409`, and no-fixture error states.
- Row locking is exercised by the final-state conflict path; a database-level concurrent request must leave only one final approval outcome and one final-decision audit event.

## STATUS

M2/M3 regression and M4 verification are green locally. The backend suite is PostgreSQL-backed and isolated to `evorail_test`. The browser suite runs against the seeded User A/User B/Admin topology.

## FRONTEND TESTS

- 86 Vitest tests passed across API, provider, shell, document, revision, preview, Reviews, Approvals, My Work, Transmissions, and fail-closed behavior.
- Coverage includes auth bootstrap, login, logout, `/api/me`, 401/403/419/422/409/5xx handling, unavailable-server state, project selection, saved-project validation, explicit unauthorized project URLs, document filters, sort, pagination, exact revisions, preview/download URL identity, revision upload payloads, and no-fixture fallback.
- `npm run build` passed with TypeScript checking and Vite production output.

## BACKEND TESTS

- 54 PHPUnit tests passed with 313 assertions, including authentication, project/document/revision contracts, Reviews, Approvals, Transmissions, exact-revision scoping, transitions, final-decision conflicts, filters, sorting, pagination, validation, preview/download, idempotency, immutability, CORS preflight, production CSRF rejection, and PostgreSQL runtime checks.
- `vendor/bin/pint --dirty --format agent` passed.

## E2E

- 6 Playwright tests passed.
- The main flow covers login → project → Documents → search/filter → exact revision A → create revision B → refresh, then verifies revision A metadata and downloaded bytes are unchanged.
- A security flow verifies User A is denied direct Project B, Document B, Revision B, Preview B, Download B, and multipart create-revision access.
- An outage flow verifies unauthenticated/unavailable API states do not render demo documents.
- The M5 flow verifies draft → exact revision → issue → later revision while the issued snapshot remains historical.
- The local PHP server must run with a writable upload temporary directory; `npm run test:e2e` supplies `TMPDIR=/var/tmp`.

## IDOR

User A cannot cross the project boundary for project detail, document list/detail, revision list/detail, preview, download, or create revision. Tests also cover a shared organization without project membership and viewer download/create restrictions. Unauthorized writes leave revisions, stored files, and audit events unchanged.

## SANCTUM / CORS

Stateful Sanctum session cookies, CSRF bootstrap, HTTP-only session behavior, login throttling, logout invalidation, credentialed allowed-origin preflight, and foreign-origin rejection are covered. CORS and Sanctum settings were preserved.

## SECURITY FINDINGS

- No unresolved application security finding remains in the M2/M3/M4 boundary.
- CAD preview intentionally returns `422 preview_unavailable` until a worker exists.
- Production HTTPS cookie/domain values and the complete workflow/approval authorization matrix remain deployment gates.

## QUALITY RESULTS

- `npm run quality` passed: backend tests, frontend tests, frontend build, MCP build, MCP tests, and `git diff --check`.
- MCP tests: 2 passed.
- `composer validate` passed.
- Responsive shell smoke check passed at 1440px, 1024px, 768px, and 390px; `scrollWidth` matched `clientWidth` at every viewport.
- Overview screenshots were inspected at desktop and mobile widths after the shell/header refactor.

## FILES CHANGED

- `tests/frontend/`, `tests/e2e/`, `vitest.config.ts`, `playwright.config.ts`.
- `backend/app/Enums/`, `Models/`, `Policies/`, `Http/Controllers/`, `Http/Requests/`, `Http/Resources/`, M4 migrations, and `ReviewApprovalTest.php`.
- `backend/tests/Feature/DocumentQueryTest.php`, `SessionSecurityTest.php`, `DocumentRevisionTest.php`, `ProjectAuthorizationTest.php`.
- `package.json`, `package-lock.json`, `.gitignore`.

## BLOCKERS

No M2/M3 verification blocker remains on this macOS setup. PostgreSQL, Redis, MinIO, and HTTPS production deployment are environmental follow-up gates, not test failures.
