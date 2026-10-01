# Security review status

The M2/M3 security gate is green on the local PostgreSQL topology. The verification layer now exercises the browser origin as well as the API boundary.

- Sanctum stateful SPA sessions, CSRF bootstrap, HTTP-only session behavior, login throttling, and logout invalidation are covered.
- Credentialed CORS preflight is allowed only for configured frontend origins; a foreign origin receives no allow-origin header. These settings were not weakened for E2E.
- Server-authoritative `ProjectPolicy`, `DocumentPolicy`, and `RevisionPolicy` checks deny User A access to Project B, Document B, Revision B, Preview B, Download B, and create-revision in B.
- The same boundary is tested when projects share an organization, and for a viewer who may view but cannot download or create revisions.
- Protected files require exact-revision authorization before preview/download.
- Revision rows and stored-file metadata are immutable by contract. Creating revision B leaves revision A metadata, checksum, and bytes unchanged.
- Append-only audit rows and idempotency-key request hash checks prevent duplicate or conflicting write effects.
- Missing authentication returns 401; authorization returns 403; missing resources return 404; invalid input returns 422; duplicate/idempotency conflicts return 409.
- Production fail-closed tests verify that API outage or unauthenticated state does not expose bundled demo documents.

The first browser flow and security flow pass with a writable PHP upload temp directory. CAD preview intentionally remains unsupported until a real worker exists. Production HTTPS cookie/domain values and the complete workflow/approval authorization matrix remain deployment gates.

## M4 security review

- Review and Approval are separate resources, policies, routes, and audit subjects.
- Review and approval list/detail/mutation paths are server-authorized by project membership. Review actions require the assigned reviewer (or management capability); approval actions require the assigned approver and approval capability.
- Review comments and approval decisions cannot cross project boundaries. Exact revision identifiers are validated at creation and returned in every detail response.
- Review transitions and approval decisions use database row locks and reject stale state with `409`; approval final states are not editable through the API.
- No unsafe mutation retries were added to the frontend. `403`, `409`, `422`, and unavailable-server responses remain visible and fail closed without fixtures.
- M4 gap: approval does not yet trigger the broader suitability/effective-state supersession engine; that remains a later workflow milestone and current revision pointers are unchanged by these endpoints.

## M5 transmission security review

- Transmission list, detail, draft mutation, issue, item insertion, and manifest download are server-authorized by project membership and explicit transmission capabilities. User A cannot use a Project B transmission URL or download route.
- Item insertion requires an exact `document_id` plus `revision_id`. The backend authorizes both objects and rejects cross-project or cross-document relationships; no current/latest fallback exists.
- Issue uses a database row lock and transaction. Only a draft can transition to issued, and the final audit event is written within that transaction. Issued metadata, recipients, and items are immutable through the API.
- The protected manifest authorizes the transmission and every exact revision before returning URLs. Downloading the manifest appends `transmission.downloaded` without exposing unauthenticated file bytes.
- Same-key idempotent issue replays the stored canonical response. A changed payload with the same key returns `409`; a stale issue with a new key returns `409 transmission_issue_conflict`. The browser does not auto-retry issue or other unsafe mutations.
- M5 snapshot regression proves a later revision does not change the issued revision code, title, checksum, filename, or exact revision identifier.
