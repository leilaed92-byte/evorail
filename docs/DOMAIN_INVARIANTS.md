# EvoRail backend invariants

The backend follows the durable rules in [DOMAIN_RULES.md](DOMAIN_RULES.md) and [REVISION_STATE_MACHINE.md](REVISION_STATE_MACHINE.md).

- Workflow status, suitability, effective state, and revision code remain separate fields.
- Project membership is the authorization boundary. A user with access to Project A receives no Project B metadata, documents, revisions, previews, downloads, or revision-creation path.
- Revision creation inserts a new revision and a new `StoredFile`; it does not mutate an earlier revision's metadata, checksum, or file path.
- Revision codes are unique within a document. A duplicate returns `409 duplicate_revision`.
- The revision creation transaction authenticates, authorizes, validates, stores the private file, creates metadata, writes the audit event, and records an idempotency response.
- Reusing an idempotency key with the same request replays the original response. Reusing it with a different request returns `409 idempotency_conflict`.
- Audit events are append-only application records. No mutation routes are exposed.
- File bytes are never returned from a public URL. Preview and download authorize the exact revision first.
- PDF/image preview is direct protected streaming. CAD preview returns an explicit unsupported state; the backend does not fake rendering.
- Demo data is gated by `EVORAIL_DEMO_SEED=true` and only runs in the local environment.
- Reviews and approvals are separate persisted resources. A review never grants approval authority and an approval never replaces the review cycle.
- Every review comment, review transition, and approval decision stores the exact `revision_id`; neither domain resolves decisions through `documents.current_revision_id`.
- Review transitions are explicit (`open`/`returned` → `in_progress` → `completed` or `returned`). Invalid or stale transitions return `409`.
- Approval decisions lock the row, accept only `pending`, and become immutable `approved` or `rejected` decisions. A competing or repeated decision returns `409`.
- Review/approval lists and details are project-membership scoped. Review mutations additionally enforce assignment/capability; approval mutations enforce the assigned approver and approval capability.
- Review/approval creation and controlled mutations append audit events containing project, entity, actor, and exact revision metadata. Audit has no update/delete route.
- Transmissions are first-class records with distinct `draft`, `issued`, and `cancelled` states. A transmission item stores both `document_id` and the explicitly selected `revision_id`.
- Issuance locks the transmission, validates recipient/item completeness and exact revision relationships, freezes document/revision/file snapshots, sets issuer/time/status, and writes one `transmission.issued` audit event in the same transaction.
- Issued transmission metadata, recipients, and items cannot be changed through draft mutation routes. A later document revision does not rewrite an issued item or its checksum, filename, title, suitability, workflow, or effective-state snapshot.
- Transmission creation and issue support request-hash idempotency. Same-key same-payload calls replay the stored response; a different payload returns `409 idempotency_conflict`; unsafe mutation calls are not automatically retried by the frontend.
- Transmission list/detail/item/download authorization is project-scoped and server-authoritative. Cross-project transmission access and cross-project document/revision injection are denied before persistence.
- Transmission audit events (`created`, `updated`, recipient/item add/remove, `issued`, and `downloaded`) are append-only and include exact revision identifiers where relevant.
