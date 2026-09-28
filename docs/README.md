# EvoRail docs

Working name for Railway Project OS. V1 is engineering information control for major railway projects.

| Document | Role |
|---|---|
| [DOMAIN_RULES.md](DOMAIN_RULES.md) | Numbering, revisions, supersession, confidentiality, invariants |
| [ERD.md](ERD.md) | Entities and relationships. No migrations yet |
| [PERMISSIONS_MATRIX.md](PERMISSIONS_MATRIX.md) | Platform role, project role, object permission, scope |
| [REVISION_STATE_MACHINE.md](REVISION_STATE_MACHINE.md) | Legal transitions across the four status axes |
| [WORKFLOW_ENGINE_SPEC.md](WORKFLOW_ENGINE_SPEC.md) | Templates, stages, parallel review, cycles, due dates |
| [INFORMATION_ARCHITECTURE.md](INFORMATION_ARCHITECTURE.md) | Global shell and project navigation |
| [SCREEN_INVENTORY.md](SCREEN_INVENTORY.md) | 32 V1 screens. First 12 are the prototype set |
| [REALISTIC_RAILWAY_SEED_DATA.md](REALISTIC_RAILWAY_SEED_DATA.md) | Line A seed: organizations, documents, one overdue review, one frozen transmittal, one correspondence chain |
| [MCP_INTEGRATION.md](MCP_INTEGRATION.md) | Authorized MCP transports, tool boundary, and Laravel endpoint contract |
| [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) | Current implementation gate, tests, and environment blockers |

Source product plan: `C:\Users\Moham\Downloads\RAILWAY_PROJECT_OS_MASTER_PLAN.md` (v1.0, 2026-09-28).

These specs come before schema and UI. If a real MDR, numbering standard, or transmittal template arrives, revise these files before the document schema is frozen.

Prototypes: `../prototypes/index.html`. Audit: [PROTOTYPE_AUDIT.md](PROTOTYPE_AUDIT.md).

Not in this folder yet: technical architecture, application code. The Laravel app starts after the prototype gaps in the audit are accepted or closed.
