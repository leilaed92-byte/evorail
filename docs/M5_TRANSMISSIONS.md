# M5 — Transmissions

M5 adds canonical project transmissions as first-class controlled records. A transmission is not generic document sharing: it is a draft package that names exact revisions, then becomes an immutable issued snapshot.

## Lifecycle

`draft → recipients → exact document/revision items → review package → issue → issued snapshot → protected manifest/download → audit`

Drafts can update metadata, add/remove recipients, and add/remove exact items. Issue is explicit and confirmation-gated in the UI. Issued records expose no draft mutation controls.

## Backend contract

The Laravel API exposes the project register at `/api/projects/{project}/transmissions` and transmission actions at `/api/transmissions/{transmission}`. Item creation requires both `document_id` and `revision_id`. The server validates project membership, document ownership, revision ownership, and exact relationship before inserting the item.

The issue action locks the row and runs in one transaction. It requires a subject, recipient, and item; refreshes the item snapshot from the named revision; assigns the final reference when needed; sets issuer/time/status; writes the exact revision identifiers into `transmission.issued`; and commits the canonical response. An idempotency key replays the same response or rejects a changed payload.

## Frozen item snapshot

Each item retains:

- document id and document number/title snapshot,
- exact revision id and revision code snapshot,
- discipline, suitability, workflow, and effective-state snapshots,
- original filename, checksum, size, and MIME snapshot.

Creating a later document revision does not update these fields. The download endpoint returns a server-authorized manifest whose URLs still name each exact revision.

## Frontend

`src/m5.tsx` provides the real API-backed register, detail pane, composer, recipient editor, explicit document → revision picker, review-package step, issue confirmation, frozen issued view, and protected manifest action. Routes remain under the existing `/transmittals` navigation surface, with canonical backend resources named `transmissions`.

## Verification

- Backend: 54 PostgreSQL-backed tests and 313 assertions.
- Frontend: 86 Vitest tests, including 4 transmission tests.
- Browser: 6 Playwright flows, including the M5 draft/issue/later-revision snapshot flow and M2–M4 regressions.
- Quality: Composer validation, Pint, TypeScript, Vite build, MCP build/tests, and `git diff --check` are integration gates.

## Known gaps

The synchronous download endpoint currently returns an authorized manifest and protected exact-revision URLs rather than assembling a queued ZIP. Contact/address-book management, acknowledgements beyond the existing nullable recipient timestamp, and approval-driven suitability supersession remain outside M5.
