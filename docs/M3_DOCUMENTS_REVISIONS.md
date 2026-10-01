# M3 documents and revisions verification

Status: **POSTGRESQL BACKEND DATABASE GATE GREEN** (2026-10-01). Frontend/end-to-end and object-storage integration remain independently tracked; M4 is out of scope.

The existing document/revision APIs, policies, private preview/download, SHA-256 checksums, audit events, and idempotency persistence are verified on PostgreSQL 18.6. All 14 migrations are applied. The complete checkout suite passes **31 tests / 138 assertions** at verification time, including parallel agents' tests. PostgreSQL-specific regression coverage contains **5 tests / 38 assertions**.

## Backend corrections

- Document search uses Laravel `whereLike` / `orWhereLike`, which generates PostgreSQL `ILIKE`. Mixed-case search now retains SQLite's earlier case-insensitive behavior across document number, title, and discipline. Pagination remains project scoped with deterministic ordering.
- A forward migration widens `document_revisions.change_reason` from varchar(255) to text, honoring the existing 1,000-character validation contract. Rollback uses varchar(1000) to preserve valid reasons.
- Revision writes lock the document row inside the transaction before idempotency lookup, duplicate-code checks, revision-order allocation, and current-revision assignment. This serializes API writes to the same document on PostgreSQL. Concurrent upload stress testing has not been performed.
- The idempotency hash now includes purpose of issue, description, metadata snapshot, and original filename, in addition to the existing revision fields and file checksum. Changes to persisted request data produce the existing 409 `idempotency_conflict` response instead of silently replaying an older result.
- A failed transaction removes its newly written private file. Fault-injection coverage confirms no stored-file, revision, audit, or idempotency rows remain, and the current-revision pointer stays null.
- The opt-in local seed is repeatable and creates revisions A and B for each of the three documents. Project metadata refers to the actual project rather than always Line A.

## Verified behavior

PostgreSQL tests verify nested JSON metadata (including booleans, numbers, arrays, and Unicode), the maximum valid change-reason length, exact idempotent response replay, changed-metadata/purpose conflicts, duplicate revision rejection, private file persistence, and rollback cleanup. Native foreign-key and unique-constraint definitions were inspected; missing current-revision IDs are rejected by the database.

Revision-history verification compares every original persisted attribute before and after creating another revision, verifies the original file bytes and checksum, and confirms the first current-revision pointer remains unchanged. Revision PATCH and DELETE return 405. This verifies append-only behavior through the current API; database triggers do not prevent a privileged direct SQL writer or arbitrary model code from editing history.

`ProjectAuthorizationTest` passes on PostgreSQL, including cross-project project/document/revision reads, protected preview/download, and revision creation. Live session/CSRF HTTP checks additionally verify A-to-B and B-to-A denial on all resource/file routes, and Admin access to both projects. Cross-project denial retains the established 403 contract.

The current revision is set for the first upload and is not replaced by later unapproved uploads. Approval-driven supersession and workflow-stage records remain future work. The existing later-revision effective-state convention is retained in this pass.

## Contracts and limits

No response shapes or frontend API contracts changed. Search restores case-insensitive behavior; long reasons already allowed by validation now persist correctly; idempotency conflicts use the existing error shape/code. Existing rows with old idempotency hashes would conflict after the hash correction if replayed; clients can use a new key. This local PostgreSQL database had no such replay records before verification.

Private storage remains local. MinIO, Redis, production hardening, actual CAD preview generation, and frontend browser/end-to-end checks are not prerequisites for declaring this PostgreSQL database portion green. See `M2_BACKEND_BOOTSTRAP.md` for cluster commands, environment settings, seed accounts, and the isolated test-database safeguard.
