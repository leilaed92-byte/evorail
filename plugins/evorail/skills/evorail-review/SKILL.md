---
name: evorail-review
description: Review EvoRail changes for lifecycle, authorization, audit, and MCP safety violations.
---

# EvoRail review checklist

- No controller directly sets suitability, effective state, or `current_revision_id`.
- Every decision and comment points to an exact revision and workflow/review cycle.
- New revisions do not mutate previous files, snapshots, comments, workflow decisions, or transmittal items.
- Issued transmittals have no item-edit route.
- Hidden records are omitted from query construction, search, autocomplete, snippets, exports, notifications, and MCP resources.
- `review` does not imply `approve`; `view` does not imply `download`.
- Controlled mutations and denied sensitive actions are audited.
- MCP has no approval, rejection, supersession, issue, permission-change, contractual-send, or audit-mutation tool.
