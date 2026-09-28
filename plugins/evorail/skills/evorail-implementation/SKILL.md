---
name: evorail-implementation
description: Implement and review EvoRail features against the authoritative railway information-control specifications.
---

# EvoRail implementation rules

Before changing code, read the relevant files in `docs/` using this authority order:

1. `DOMAIN_RULES.md`
2. `PERMISSIONS_MATRIX.md`
3. `REVISION_STATE_MACHINE.md`
4. `WORKFLOW_ENGINE_SPEC.md`
5. `ERD.md`
6. `INFORMATION_ARCHITECTURE.md`
7. `SCREEN_INVENTORY.md`
8. `REALISTIC_RAILWAY_SEED_DATA.md`
9. `EVORAIL_FULL_BUILD_PLAN.md`
10. prototypes

Never invent a state or permission. Keep revision code, workflow state, suitability, and effective state separate. Current is an authorized approval result, not the highest revision code. Issued transmittals are immutable snapshots. Audit is append-only. Authorization is enforced on the server for lists, details, previews, downloads, search, exports, notifications, and mutations.

MCP may read authorized records and create safe drafts. It may not approve, reject, supersede, issue a transmittal, send contractual correspondence, change permissions, or mutate audit history.

Every implementation report must include:

```text
STATUS
FILES CHANGED
DOMAIN RULES TOUCHED
TESTS ADDED
TESTS RUN
SECURITY IMPACT
KNOWN GAPS
NEXT GATE
```
