# EvoRail implementation status

Current phase: OSS Component Migration Phase 2 after M5
Current gate: Phase 2 implementation complete; final integration verification is required before declaring the exit gate green

## Backend

- [x] Laravel 13.34.0 backend created under `backend/`
- [x] Herd PHP 8.4.25 and Composer 2.10.2 verified
- [x] Sanctum session authentication and CSRF flow
- [x] Project-scoped memberships and server policies
- [x] Document, revision, storage metadata, audit, and idempotency foundation
- [x] M2/M3 API routes and request validation
- [x] PostgreSQL 18.6 runtime: 14 migrations applied, 31 tests / 138 assertions passing, authenticated HTTP APIs and bidirectional project isolation verified (2026-10-01)
- [ ] Redis and MinIO runtime integration
- [x] Separate Review and Approval models, migrations, policies, API resources, filters, comments, transitions, final decisions, and audit events
- [x] Exact revision integrity and project IDOR coverage for Reviews and Approvals
- [ ] Approval-driven suitability/effective-state supersession engine (outside this minimal M4 domain)
- [x] Transmission, recipient, and exact-revision item models with PostgreSQL migrations
- [x] Transactional/idempotent issue with frozen snapshots, immutable issued state, protected manifest, and audit events
- [x] Transmission policy and cross-project/cross-document authorization tests

## UI and MCP

- [x] React TypeScript check and Vite production build
- [x] Current EvoRail sidebar and localhost Vite runtime
- [x] MCP TypeScript build and protocol/safety tests
- [x] React API wiring for `/api/me`, projects, documents, revisions, Reviews, and Approvals
- [x] Frontend test suite with M4 queues, detail views, filters, transitions, confirmation, final-state, and fail-closed coverage
- [x] Frontend transmission register, detail, composer, recipient editor, exact revision picker, review package, issue confirmation, and protected manifest API wiring
- [x] EvoRail component wrappers for async states, status/revision badges, page headers, filters, tables, detail panels, read-only banners, and timelines
- [x] 224px resizable project sidebar, compact 56px context header, dense register spacing, focus-visible states, reduced-motion handling, and mobile shell behavior
- [x] M4/M5 workflow surfaces migrated to shared status, revision, timeline, filter, async-state, and immutable-state wrappers
- [x] Component-system and missing-component decision records added in `COMPONENT_SYSTEM.md` and `MISSING_COMPONENTS.md`
- [x] TanStack-backed `EvoDataTable` adopted for the Documents reference register and transmission item tables
- [x] Schema-driven filter builder, deterministic filter URL serializer, expanded async-state vocabulary, Sonner toaster, Lucide table affordances, and lazy PDF viewer foundation added
- [x] M4/M5 routes split into lazy chunks with initial bundle reduction recorded in `OSS_COMPONENT_MIGRATION_PHASE2.md`
- [x] Responsive shell smoke check at 1440px, 1024px, 768px, and 390px with no document-level horizontal overflow

## Known blockers

- PostgreSQL is running on `127.0.0.1:5432`; `evorail` is the development database and `evorail_test` is the isolated test database. Homebrew is absent; PostgreSQL 18.6 binaries are available locally and in the single-version Postgres.app bundle. Redis/MinIO integration remains separate and does not block this database verification.
- Herd's PHP CLI is healthy, but its Nginx `.test` serving layer reports no configured PHP versions and returns 502. `php artisan serve` using Herd PHP is available at `http://127.0.0.1:8002`.
- The broader approval-driven suitability/effective-state supersession workflow remains a known M4 gap; M5 intentionally does not implement that later workflow engine.

## M5 verification

- 54 backend tests / 313 assertions, 86 frontend tests, and 6 Playwright tests pass locally.
- `composer validate`, Pint, TypeScript checking, Vite build, and `git diff --check` pass. MCP build/test remain part of the final integration gate.
- Production visual QA screenshots were inspected for the overview shell at desktop and mobile widths; the existing protected workflow screenshots remain covered by Playwright.

## Next action

Run the complete Phase 2 exit matrix, review the protected PDF worker behavior in a browser, and keep M6 out of scope.
