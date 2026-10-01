# EvoRail docs

Working name for Railway Project OS. V1 is engineering information control for major railway projects.

| Document | Role |
|---|---|
| [DOMAIN_RULES.md](DOMAIN_RULES.md) | Numbering, revisions, supersession, confidentiality, invariants |
| [ERD.md](ERD.md) | Domain entities and relationships that guide the backend schema |
| [PERMISSIONS_MATRIX.md](PERMISSIONS_MATRIX.md) | Platform role, project role, object permission, scope |
| [REVISION_STATE_MACHINE.md](REVISION_STATE_MACHINE.md) | Legal transitions across the four status axes |
| [WORKFLOW_ENGINE_SPEC.md](WORKFLOW_ENGINE_SPEC.md) | Templates, stages, parallel review, cycles, due dates |
| [INFORMATION_ARCHITECTURE.md](INFORMATION_ARCHITECTURE.md) | Global shell and project navigation |
| [SCREEN_INVENTORY.md](SCREEN_INVENTORY.md) | 32 V1 screens. First 12 are the prototype set |
| [REALISTIC_RAILWAY_SEED_DATA.md](REALISTIC_RAILWAY_SEED_DATA.md) | Line A seed: organizations, documents, one overdue review, one frozen transmittal, one correspondence chain |
| [MCP_INTEGRATION.md](MCP_INTEGRATION.md) | Authorized MCP transports, tool boundary, and Laravel endpoint contract |
| [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) | Current implementation gate, tests, and environment blockers |
| [M2_BACKEND_BOOTSTRAP.md](M2_BACKEND_BOOTSTRAP.md) | M2 macOS backend verification record |
| [M3_DOCUMENTS_REVISIONS.md](M3_DOCUMENTS_REVISIONS.md) | M3 document and revision verification record |
| [API-CONTRACTS.md](API-CONTRACTS.md) | Backend/API verification boundary |
| [SECURITY_REVIEW.md](SECURITY_REVIEW.md) | Static security review and runtime verification status |
| [TEST_PLAN.md](TEST_PLAN.md) | Executed checks and blocked verification plan |
| [DEPLOYMENT.md](DEPLOYMENT.md) | macOS development and deployment prerequisites |
| [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md) | Implemented Laravel runtime, models, storage, policies, and local serving |
| [DOMAIN_INVARIANTS.md](DOMAIN_INVARIANTS.md) | Runtime invariants enforced by the reconstructed M2/M3 backend |

Source product plan: the v1.0 Railway Project OS master plan (2026-09-28), referenced historically in the original Windows workspace. The source file is not present in this macOS checkout.

These specs come before schema and UI. If a real MDR, numbering standard, or transmittal template arrives, revise these files before the document schema is frozen.

Prototypes: `../prototypes/index.html`. Audit: [PROTOTYPE_AUDIT.md](PROTOTYPE_AUDIT.md).

The current checkout contains the React/Vite prototype, MCP adapter, and reconstructed Laravel backend under `../backend`. See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for the current gate and environmental blockers.
