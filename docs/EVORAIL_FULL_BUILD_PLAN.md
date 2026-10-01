# EvoRail — Full Build Execution Plan

**Status:** Approved implementation contract  
**Repository:** `Mohamedbeghanem/evorail`  
**Local path:** this repository checkout on macOS (the original Windows path is historical)
**Date baseline:** 28 Sep 2026  
**Product:** EvoRail  
**Product relationship:** Independent product. Not EvoProject.  
**V1:** Engineering information control for major railway projects.

---

# 0. Purpose of this document

This file is the execution plan for building EvoRail from the current repository state into a pilot-ready V1.

It does **not** replace the existing domain specifications. It orchestrates them.

The following repository documents remain authoritative for their subjects:

- `docs/DOMAIN_RULES.md`
- `docs/ERD.md`
- `docs/PERMISSIONS_MATRIX.md`
- `docs/REVISION_STATE_MACHINE.md`
- `docs/WORKFLOW_ENGINE_SPEC.md`
- `docs/INFORMATION_ARCHITECTURE.md`
- `docs/SCREEN_INVENTORY.md`
- `docs/REALISTIC_RAILWAY_SEED_DATA.md`
- `docs/PROTOTYPE_AUDIT.md`

If this file conflicts with a domain rule, permission rule, revision rule, or workflow rule in those files, the specialized file wins.

The purpose here is to define:

1. the build order,
2. the technical architecture,
3. the Laravel/Inertia module structure,
4. database migration order,
5. server-side authorization boundaries,
6. domain services and actions,
7. object-storage behavior,
8. search,
9. audit,
10. notifications,
11. testing,
12. CI,
13. phase gates,
14. pilot criteria,
15. future-module boundaries,
16. PR sequencing for implementation agents.

---

# 1. Product contract

EvoRail V1 is an engineering information control system for major railway projects.

It manages controlled project information through:

- stable document identities,
- immutable revisions,
- document numbering,
- metadata,
- reviews,
- approvals,
- comments,
- transmittals,
- correspondence,
- permissions,
- organization isolation,
- search,
- reports,
- notifications,
- append-only audit.

The system of record is **not a folder tree**.

The system of record is:

```text
Document
└── Revision
    ├── Files
    ├── Workflow
    ├── Review cycle
    ├── Decisions
    ├── Comments
    ├── Transmittal references
    └── Audit history
```

V1 must make a project team trust the answer to these questions:

- Which revision is authoritative?
- Which revision was issued?
- Who approved it?
- Who received it?
- Which comments belong to which revision?
- Is this plan obsolete?
- What was current on a given date?
- Can contractor A see contractor B's confidential package?
- Can a reviewer approve?
- Can an issued transmittal silently change later?
- Can an issued revision be destroyed?

If EvoRail cannot answer those questions reliably, the pilot fails.

---

# 2. Non-negotiable domain invariants

These are hard application rules.

## 2.1 Four status axes remain separate

For a revision, persist separately:

1. revision code,
2. workflow state,
3. suitability,
4. effective state.

Never collapse them into one `status`.

Example:

```text
Document: LNA-EVO-TRK-DWG-S05-00142
Revision: D
Workflow state: Completed
Suitability: Issued for Construction
Effective state: Current
```

`D` does not mean Current.

`Completed` does not mean IFC.

`IFC` does not mean latest letter.

## 2.2 Revision immutability

Creating a new revision inserts a new row.

It must never:

- overwrite the previous revision's files,
- rewrite prior metadata snapshots,
- move comments,
- mutate prior workflow decisions,
- change old transmittal items.

## 2.3 Current is a domain result

Current is produced by an authorized issuing approval.

The current pointer must never be calculated from sorting revision codes.

When a new revision is approved to an issuing suitability:

- lock the document,
- write the decision,
- complete the workflow,
- set new revision Current,
- supersede previous Current,
- update `document.current_revision_id`,
- write audit,
- commit atomically.

## 2.4 Transmittal immutability

Issued transmittals are frozen records.

Each issued item snapshots:

- document id,
- revision id,
- document number,
- revision code,
- title,
- suitability.

If Rev D replaces Rev C later, a transmittal issued with Rev C must still show Rev C forever.

## 2.5 Decisions point at revisions

No approval, rejection, or review decision may target only a document.

Every decision must identify the exact revision and stage instance.

## 2.6 Audit is append-only

Controlled actions create audit events.

Ordinary application flows cannot update or delete audit rows.

## 2.7 Server authorization is authoritative

A hidden UI button is not security.

Every:

- list,
- detail,
- preview,
- download,
- search,
- export,
- transmittal item,
- notification,
- mutation

must apply server-side scope.

## 2.8 Review does not imply approval

`review` and `approve` are distinct permissions.

`view` and `download` are distinct permissions.

## 2.9 Issued records are withdrawn, not destroyed

Issued revisions and issued transmittals have no ordinary hard-delete path.

## 2.10 AI boundary

V1 has no AI product surface.

Future AI may:

- suggest metadata,
- classify,
- summarize,
- compare,
- draft.

AI may not:

- approve,
- reject,
- supersede,
- issue transmittals,
- send contractual correspondence,
- change permissions.

---

# 3. V1 scope

## 3.1 In V1

### Platform

- tenant
- users
- people
- organizations
- projects
- project memberships
- project roles
- permissions
- scope restrictions
- confidentiality
- MFA capability
- audit

### Engineering information

- documents
- drawings
- document types
- metadata schemas
- custom fields
- numbering templates
- reservations
- revisions
- file upload
- previews
- revision history
- document relationships
- saved views
- search

### Workflow

- workflow templates
- workflow stages
- assignments
- parallel review
- review cycles
- comments
- responses
- decisions
- approvals
- My Work
- due dates
- overdue calculations

### Distribution

- transmittal register
- draft transmittals
- recipients
- item selection by exact revision
- issue/freeze
- acknowledgements
- cover-sheet export

### Correspondence

- incoming/outgoing letters
- instructions
- notices
- technical correspondence
- minutes
- memos
- recipients
- links between correspondence
- links to exact document revisions
- response due dates

### Reports and exports

- filtered register exports
- overdue reviews
- outstanding acknowledgements
- workflow status
- document status
- correspondence status
- audit exports where permitted

## 3.2 Explicitly out of V1

Do not create sidebar items, tables, or fake placeholder modules for:

- GIS,
- map,
- BIM,
- IFC models,
- 3D viewer,
- Primavera integration,
- MS Project integration,
- planning,
- progress tracking,
- site management,
- quality,
- NCR,
- ITP,
- inspections,
- costs,
- budgets,
- contracts,
- procurement,
- asset management,
- commissioning,
- handover,
- field photos,
- autonomous AI.

These can exist in roadmap documents only.

---

# 4. Approved application stack

When Phase C starts:

## Backend

- Laravel
- PHP supported by the selected Laravel release
- PostgreSQL
- Redis
- Laravel queues
- Laravel cache
- Laravel scheduler

## Frontend

- Inertia
- React
- TypeScript
- Vite
- Tailwind CSS
- a small accessible component layer

Do not introduce a second SPA API architecture unless a future mobile client requires it.

## Files

S3-compatible object storage.

Local development may use MinIO.

Production may use:

- AWS S3,
- Cloudflare R2 if requirements fit,
- MinIO/on-prem S3,
- another compatible object store.

Database stores metadata and storage keys, not binary documents.

## Preview

V1 viewer:

- PDF.js for PDFs,
- server-generated preview where possible for office formats,
- native download only through authorized signed routes.

## Search

Start with PostgreSQL-native search.

Use:

- indexed normalized columns,
- `tsvector`,
- trigram indexes where useful.

Do not add Elasticsearch/OpenSearch to the pilot unless PostgreSQL search fails realistic-volume tests.

## Email

Transactional email for:

- assignments,
- due-soon,
- overdue,
- return for revision,
- workflow completion,
- acknowledgement requests.

Email is a delivery mechanism, not the source of truth.

## Observability

At minimum:

- structured application logs,
- queue-failure visibility,
- request/error tracking,
- storage processing failures,
- security denied-action logs,
- health endpoints.

---

# 5. Repository target structure

Recommended end state:

```text
evorail/
├── app/
│   ├── Actions/
│   │   ├── Documents/
│   │   ├── Revisions/
│   │   ├── Numbering/
│   │   ├── Workflows/
│   │   ├── Reviews/
│   │   ├── Transmittals/
│   │   ├── Correspondence/
│   │   ├── Memberships/
│   │   └── Audit/
│   ├── Domain/
│   │   ├── Documents/
│   │   ├── Workflows/
│   │   ├── Access/
│   │   ├── Transmittals/
│   │   ├── Correspondence/
│   │   └── Shared/
│   ├── Events/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   ├── Requests/
│   │   └── Resources/
│   ├── Jobs/
│   ├── Models/
│   ├── Notifications/
│   ├── Policies/
│   ├── Queries/
│   ├── Services/
│   │   ├── Files/
│   │   ├── Search/
│   │   ├── Export/
│   │   └── Preview/
│   └── Support/
├── bootstrap/
├── config/
├── database/
│   ├── factories/
│   ├── migrations/
│   └── seeders/
├── docs/
├── prototypes/
├── resources/
│   ├── css/
│   └── js/
│       ├── Components/
│       ├── Layouts/
│       ├── Pages/
│       ├── Features/
│       ├── Hooks/
│       ├── Types/
│       └── lib/
├── routes/
├── storage/
└── tests/
    ├── Feature/
    │   ├── Access/
    │   ├── Documents/
    │   ├── Revisions/
    │   ├── Workflow/
    │   ├── Transmittals/
    │   ├── Correspondence/
    │   ├── Search/
    │   ├── Exports/
    │   └── Audit/
    ├── Unit/
    └── Browser/
```

Do not build one giant `DocumentService`.

Prefer small domain actions with explicit names.

Examples:

- `ReserveDocumentNumber`
- `RegisterDocument`
- `CreateRevision`
- `SubmitRevision`
- `RecordReviewDecision`
- `ApproveRevision`
- `WithdrawRevision`
- `IssueTransmittal`
- `AcknowledgeTransmittal`
- `CreateCorrespondence`
- `LinkCorrespondenceRevision`

---

# 6. Multi-tenancy model

V1 uses shared-database multi-tenancy.

Every tenant-owned row includes `tenant_id` unless ownership is inherited through a guaranteed parent relationship and the implementation team proves query safety.

Default policy:

> Prefer explicit `tenant_id` on security-sensitive first-class tables.

Critical tables with direct tenant scoping should include `tenant_id`:

- organizations
- people
- programmes
- projects
- roles
- documents
- revisions
- transmittals
- correspondence
- audit_events
- notifications
- saved_views

Add composite indexes including tenant where query patterns require them.

Every request resolves:

```text
Authenticated User
→ Tenant
→ optional Project
→ Person
→ Project Member
→ Role
→ Permission Set
→ Scope
```

Never accept tenant id from the client as authority.

---

# 7. Identity and authentication

## Phase D capability

Implement:

- email/password login,
- password reset,
- account activation/suspension,
- optional MFA enrollment,
- session revocation,
- last login tracking,
- tenant membership.

MFA is available in V1 but does not have to be globally mandatory for the first pilot unless the pilot operator requires it.

Security-sensitive roles should be easy to configure as MFA-required later.

## Authentication rule

A valid login does not imply project access.

Project access requires active:

- user,
- person,
- organization,
- project membership,
- project member.

Suspension at any layer closes access.

---

# 8. Authorization architecture

Authorization must not be scattered across controllers.

Use:

- Laravel policies,
- query scopes / authorized query objects,
- project context middleware,
- dedicated permission resolver,
- confidentiality resolver.

Recommended conceptual function:

```text
AccessDecision = authorize(
    person,
    action,
    subject,
    project,
    scope,
    confidentiality
)
```

## 8.1 Inputs

- user/person
- organization
- project membership
- project role
- permission
- member scopes
- confidentiality
- assignment override where allowed
- ownership/originator rules where defined

## 8.2 Outputs

- allowed/denied
- optional reason code for internal logging
- never expose existence of denied records

## 8.3 Denied-read behavior

For record detail:

- return 404-style response for unauthorized hidden records.

For search:

- omit record completely.

For list/register:

- exclude row at query level.

For download:

- 403 or hidden response according to endpoint policy, with denied audit event where specified.

Do not load forbidden rows and filter them in React.

---

# 9. Database migration order

Migrations should follow dependency order and phase gates.

## C1 — platform base

- tenants
- users
- organizations
- people
- programmes
- projects
- project_memberships
- project_members
- project_roles
- permissions
- role_permissions
- member_scopes

## C2 — audit foundation

- audit_events

Build audit infrastructure before document lifecycle mutations.

## D — project configuration

- contract_lots
- sections
- disciplines
- project_structure_nodes
- document_types
- metadata_schemas
- custom_field_definitions
- numbering_templates
- number_sequences

## E1 — documents

- documents
- number_reservations
- document_revisions
- revision_relationships
- document_relationships
- document_files
- custom_field_values

## F — workflow

- workflow_templates
- workflow_stage_templates
- workflow_stage_reviewer_slots
- workflow_instances
- workflow_stage_instances
- workflow_assignments
- workflow_decisions
- review_cycles
- review_comments
- review_responses
- action_items

## G — transmittals

- transmittals
- transmittal_recipients
- transmittal_items

## H — correspondence

- correspondence
- correspondence_recipients
- correspondence_relationships
- correspondence_document_links
- correspondence_files

## Shared utility

- notifications
- saved_views
- import_runs
- import_rows
- export_runs if async export is used

---

# 10. Database constraints

Important invariants must not depend only on UI code.

Use database constraints where practical.

## Required examples

### Documents

Unique:

```text
(tenant_id, project_id, number)
```

### Revisions

Unique:

```text
(document_id, code)
```

### Transmittals

Unique:

```text
(project_id, number)
```

### Revision file ownership

A `DocumentFile` belongs to exactly one revision.

No move operation between revisions.

### Audit

No normal update/delete application path.

### Current revision

Application transaction guarantees one authoritative Current.

Consider a partial unique constraint if the model can express it safely:

```text
one effective_state=current issued revision per document
```

But do not use a database shortcut that breaks the two-track workflow semantics from `REVISION_STATE_MACHINE.md`.

### Foreign keys

Use restrictive foreign keys for controlled history.

Avoid cascade delete on:

- revisions,
- workflow decisions,
- audit events,
- transmittal items,
- issued transmittals.

---

# 11. Audit implementation

Audit is an infrastructure capability, not a later feature.

## 11.1 Event shape

```text
id
tenant_id
project_id nullable
actor_person_id
organization_id
action
subject_type
subject_id
before JSON
after JSON
reason nullable
workflow_instance_id nullable
transmittal_id nullable
ip_address
user_agent
created_at
```

The existing ERD is authoritative; extra transport metadata may be added if useful.

## 11.2 Controlled actions that must audit

At minimum:

- role assignment
- role permission change
- scope change
- confidentiality change
- document registration
- metadata update
- number reservation
- number cancellation
- revision creation
- draft file upload
- submission
- workflow reassignment
- due-date change
- comment
- response
- review decision
- approval
- rejection
- supersession
- withdrawal
- transmittal creation
- transmittal issue
- acknowledgement
- correspondence issue
- denied approval attempts
- denied sensitive downloads

## 11.3 Audit writing

Audit belongs in the same transaction as the controlled mutation when that mutation is atomic.

Never use a best-effort async audit for approvals or supersession.

---

# 12. File architecture

## 12.1 Upload flow

```text
Browser
→ authorized upload request
→ temporary storage or signed direct upload
→ database draft file row
→ checksum
→ malware scan
→ metadata extraction
→ preview job
→ thumbnail job
→ extracted-text job
→ ready
```

## 12.2 Storage key

Do not expose business identity only through filenames.

Example:

```text
tenant/{tenant_uuid}/project/{project_uuid}/revision/{revision_uuid}/{file_uuid}/original
```

Original filename lives in DB.

## 12.3 Checksum

SHA-256 required for original files.

Use it for:

- integrity,
- duplicate detection assistance,
- revision audit,
- pilot verification.

Do not silently deduplicate two revision files into one mutable object reference if that complicates immutability guarantees.

## 12.4 Original file protection

Original object should be treated as immutable after revision submission.

A submitted revision cannot receive a replacement original file.

If wrong:

- return revision,
- create new revision,
- or withdraw according to domain rules.

## 12.5 Downloads

Original download path:

```text
request
→ server policy
→ authorized short-lived signed URL
```

Never expose permanent public object URLs.

---

# 13. Preview processing

## Pilot requirement

PDF previews are required for pilot-quality drawing review.

Use PDF.js in the React viewer.

For PDFs:

- thumbnails,
- page navigation,
- zoom,
- fit width/page,
- page number,
- preview loading state,
- preview failed state.

V1 does not require:

- markup geometry,
- overlay diff,
- CAD rendering,
- BIM rendering.

## Office documents

If preview generation is unreliable, show:

- metadata,
- file icon,
- extracted text when available,
- secure download if allowed.

Do not block document registration because a preview failed.

---

# 14. Numbering engine

The numbering engine must support project configuration.

Line A default:

```text
[PROJECT]-[ORIGINATOR]-[DISCIPLINE]-[TYPE]-[SECTION]-[SEQUENCE]
```

## Requirements

- multiple templates per project,
- optional template by document type,
- sequence scope configuration,
- number reservation,
- cancelled reservation remains dead,
- legacy number import,
- no silent renumbering,
- concurrency-safe sequence allocation.

## Concurrency

Use database locking for sequence issuance.

Two simultaneous requests must not receive the same number.

## Import

If a row carries a legacy number:

- validate uniqueness,
- store as `number_source=legacy`,
- do not force template conformance.

---

# 15. Document registration

## Register document action

Input:

- project
- type
- number or reservation
- title
- originator
- responsible organization
- discipline
- lot
- section
- confidentiality
- railway metadata
- custom metadata
- initial revision data
- file

Output:

- document
- revision
- file processing record
- audit event

## Validation

Must validate:

- project access,
- upload permission,
- required metadata,
- number uniqueness,
- allowed confidentiality,
- type schema,
- scope,
- organization ownership.

---

# 16. Revision lifecycle

Implement revision lifecycle through explicit actions.

## 16.1 CreateRevision

Must:

- require `create_revision`,
- require reason,
- allocate next code according to sequence rules,
- copy title/metadata snapshot as a new snapshot,
- preserve prior revision,
- leave issued Current untouched,
- audit.

## 16.2 EditDraftRevision

Allowed only before submission.

Draft metadata edits:

- update draft snapshot,
- audit before/after.

Submitted metadata:

- frozen.

## 16.3 SubmitRevision

Must:

- validate mandatory fields,
- validate file readiness or accepted processing state according to policy,
- create workflow instance,
- create review cycle,
- transition state,
- assign stage,
- create My Work items,
- notify assignees,
- audit.

## 16.4 ApproveRevision

This is one of the highest-risk actions.

Use a dedicated transaction.

Pseudo-order:

```text
authorize approve
validate assigned stage
validate required parallel reviewers complete
lock document
lock revision
write workflow decision
complete stage
complete workflow if final
set selected issuing suitability
set approved revision Current
supersede previous issued Current
update document current_revision_id
append audit approval
append audit supersession
commit
dispatch after-commit events
```

No controller may directly set:

- suitability,
- effective state,
- current_revision_id.

---

# 17. Workflow engine

Do not build workflow logic as conditionals inside controllers.

Use project-defined templates.

## 17.1 Template capabilities

- ordered stages,
- stage kind,
- permission required,
- review period,
- reviewer slots,
- optional/required slots,
- organization assignment,
- role assignment,
- discipline lead assignment.

## 17.2 Instance capabilities

- one revision per workflow instance,
- due date snapshot,
- assignments,
- decisions,
- review cycle,
- completion.

## 17.3 Parallel review

Required reviewer slots must resolve according to template rules.

Line A default waits for all required slots before coordinator stage decision.

## 17.4 Returned revision

`revise_and_resubmit`:

- closes current revision workflow as Returned,
- does not reopen the same revision later,
- author creates a new revision,
- new revision gets new workflow instance and review cycle.

---

# 18. Comments and review responses

Comment belongs to:

- revision,
- review cycle,
- author,
- organization,
- discipline,
- page if applicable.

Statuses:

```text
open
→ responded
→ accepted

responded
→ reopened
→ responded

open/responded
→ closed
```

Closing a comment does not approve a revision.

Do not copy comments into the next revision.

A future carry-forward link may reference prior comment ids explicitly.

---

# 19. My Work

`ActionItem` is a materialized queue.

It is not a generic task system.

Sources:

- workflow assignments,
- approvals,
- comments needing response,
- acknowledgement where applicable.

Tabs:

- Assigned to me
- Reviews
- Approvals
- Comments to answer
- Due soon
- Overdue
- Completed

Each item must show:

- project,
- document number,
- revision,
- stage,
- originator,
- due date,
- status.

Queue materialization may be rebuilt from canonical workflow records.

Canonical source remains workflow/comments, not ActionItem.

---

# 20. Transmittals

## 20.1 Draft

A draft transmittal may be edited.

User picks exact revisions.

UI must display:

```text
Document number
Revision
Title
Suitability
```

## 20.2 Issue

Issue action:

- requires `distribute`,
- validates every item still exists and caller may distribute it,
- snapshots item fields,
- writes issued timestamp,
- freezes item list,
- writes audit,
- creates recipient acknowledgement state,
- optionally generates cover sheet.

## 20.3 After issue

No edit route for items.

Correction requires a new transmittal.

## 20.4 Acknowledgement

Acknowledgement:

- per recipient organization,
- timestamp,
- actor,
- does not mutate contents.

---

# 21. Correspondence

Correspondence is a first-class controlled project record.

Support:

- incoming letter
- outgoing letter
- instruction
- notice
- technical
- minutes
- memo

## Required fields

- reference number
- subject
- sender
- recipients
- document date
- received date where relevant
- due date
- responsible person
- status
- body
- attachments
- related correspondence
- exact linked revisions

## Critical rule

If correspondence links Rev B, it must stay linked to Rev B after Rev C exists.

---

# 22. Search

Search is permission-aware.

## Search groups

- Documents
- Drawings
- Transmittals
- Correspondence
- People

## Search implementation

Use PostgreSQL indexes.

Searchable document fields:

- number
- title
- revision
- discipline
- lot
- section
- originator
- metadata
- extracted text later if performance permits

## Confidentiality

Authorization must be pushed into query construction.

Do not search all records and remove forbidden hits afterward.

No forbidden title may leak in:

- hit count,
- autocomplete,
- snippet,
- recent search,
- suggestion.

---

# 23. Registers

The table is the core product surface.

## Master Document Register

Must support:

- server pagination,
- search,
- filter,
- saved views,
- column show/hide,
- column ordering,
- column resize,
- sorting,
- result count,
- empty state,
- bulk selection,
- side sheet,
- keyboard row navigation.

Default columns:

- number
- title
- type
- discipline
- lot
- section
- current revision
- suitability
- workflow state
- effective state
- originator
- responsible organization
- review due
- updated

## Drawing register

Same engine filtered by `is_drawing`.

Do not fork a separate table stack.

## Saved views

Store:

- target
- filters
- columns
- order
- sort

Views may be:

- personal
- project-shared if permission allows.

---

# 24. Overview and Home

## Project Overview

Purpose:

> What needs attention on this project?

Use Line A counts exactly in seed fixtures.

Do not create vanity dashboards.

Components:

- controlled documents
- current approved/IFC/info
- IFC
- in review
- overdue
- returned
- drafts
- transmittals issued this week
- outstanding acknowledgements
- recent revisions
- workflow strip
- attention feed
- compact discipline status

## Home

Cross-project personal queue.

Not a duplicate of project overview.

---

# 25. Command palette

V1 command palette supports:

- find document
- find project
- upload document
- create transmittal
- open My Work
- recent records

Commands still pass normal server authorization.

Do not preload hidden documents into the browser to support palette search.

---

# 26. Reports and exports

Exports are generated from authorized server queries.

V1 reports:

- MDR export
- drawing register export
- overdue reviews
- workflow status
- returned revisions
- missing metadata
- transmittal register
- outstanding acknowledgements
- correspondence register
- audit log for authorized roles

Formats:

- CSV
- XLSX
- PDF where presentation is meaningful

Do not export client-loaded rows as the security boundary.

---

# 27. Notifications

Notifications are facts derived from canonical records.

V1 events:

- review assigned
- approval assigned
- due tomorrow
- overdue
- comment received
- response received
- returned for revision
- new revision
- workflow completed
- transmittal acknowledgement needed

Channels:

- in-app
- email

Do not create a notification whose linked subject the user cannot view.

---

# 28. Background jobs

Redis queue jobs:

- virus/malware scan
- PDF preview generation
- thumbnail generation
- text extraction
- email delivery
- export generation
- bulk import processing
- saved search index refresh if needed
- notification batching

Controlled state changes such as approval and supersession must remain synchronous transactions.

---

# 29. Bulk import

Bulk import is important for railway document control.

## Flow

```text
Upload XLSX/CSV
→ parse
→ validation preview
→ dry-run result
→ user confirms
→ import valid rows
→ error report
```

## Rules

- duplicate number does not get silently renamed,
- cancelled number cannot be reused,
- invalid row is reported,
- dry run writes nothing,
- import permissions apply,
- imported records audit origin,
- legacy numbering allowed.

Line A 40-row seed should become an automated import fixture.

---

# 30. UI architecture

Use one stable application shell.

## Global navigation

- Home
- Projects
- Documents
- Organizations
- People
- My Work
- Administration

## Project navigation

- Overview
- Documents
- Drawings
- Transmittals
- Reviews & Approvals
- Correspondence
- My Work
- Organizations
- Reports
- Project Settings

No future modules in V1 navigation.

## UI principles

- engineering density,
- tables first,
- restrained visual hierarchy,
- no dashboard-card soup,
- no gradients for decoration,
- text state labels,
- color only reinforces meaning,
- right-side sheet for register context,
- full-page viewer/review when necessary.

---

# 31. Screen implementation map

## Phase D

13. Sign in  
14. Home shell foundation  
15. Projects  
17. Organizations directory  
18. People directory  
27. Project settings home  
30. Permissions and roles  
31. Audit log  

## Phase E

1. Project command center  
2. MDR  
3. Drawing register  
4. Document detail  
5. Drawing detail + PDF viewer  
6. Revision history  
7. New revision  
16. Global search  
19. Upload document  
20. Bulk upload  
29. Metadata and numbering  
32. Command palette  

## Phase F

8. Review workspace  
11. My Work  
21. Review comments  
22. Approval workspace  
28. Workflow builder  

## Phase G

9. Transmittal register  
10. Create transmittal  
23. Transmittal detail  

## Phase H

24. Correspondence register  
25. Correspondence detail  
26. Reports  

The prototype pages are interaction references, not production component architecture.

---

# 32. Phase B closure before Laravel

Before Phase C begins, close or formally accept the prototype audit.

## Must close

- represent all 40 seed documents in MDR,
- implement real prototype filters against the seed,
- preserve revision/supersession scenarios,
- preserve review-role restrictions,
- demonstrate frozen post-issue transmittal behavior.

## May accept for implementation

- PDF.js absent in static prototype,
- command palette not functional,
- column resize,
- keyboard navigation,
- real side sheet,
- correspondence register,
- second signed-in contractor variant,
- reports.

Update `docs/PROTOTYPE_AUDIT.md` with:

- CLOSED
- ACCEPTED FOR IMPLEMENTATION
- BLOCKING

Phase C starts only when no BLOCKING domain/interaction defect remains.

---

# 33. Phase C — application skeleton

Goal:

> Boot a production-shaped Laravel/Inertia application without document lifecycle yet.

Deliverables:

- Laravel app
- Inertia React
- TypeScript
- PostgreSQL
- Redis
- S3 abstraction
- environment config
- CI
- tenant foundation
- error pages
- authenticated shell skeleton
- basic design tokens

Gate:

- clean install,
- migrations,
- tests,
- CI green,
- no document domain logic yet.

---

# 34. Phase D — identity, organizations, permissions, audit

Build:

- tenant
- login
- people
- organizations
- projects
- memberships
- roles
- permissions
- member scopes
- confidentiality checks
- audit infrastructure
- project shell
- organizations directory
- people directory
- permission management
- audit register

## Mandatory server tests

### Contractor isolation

Pontis cannot discover Tractis organization-confidential method statement through:

- MDR list,
- detail,
- preview,
- download,
- search,
- transmittal item.

### Reviewer cannot approve

Reviewer gets 403 on approve endpoint.

### View != download

Viewer may preview metadata but original download fails.

### Assignment is narrow

A reviewer assignment grants access to assigned revision, not broad foreign-package access.

Gate:

> Contractor isolation proven on the server.

If this fails, do not continue to Phase E.

---

# 35. Phase E — documents, revisions, numbering, registers

Build:

- types
- metadata
- numbering
- reservations
- documents
- revisions
- files
- storage
- previews
- MDR
- drawings
- viewer
- revision history
- single upload
- bulk import
- search
- saved views

## Mandatory tests

- number uniqueness
- cancelled number not reused
- legacy number accepted
- revision code unique per document
- Rev D file does not alter Rev C checksum
- submitted revision immutable
- current not selected by sort order
- superseded history reachable
- hidden record omitted from search
- bulk import dry-run writes nothing

Gate:

> Rev D does not destroy Rev C.

---

# 36. Phase F — workflow, review, approvals, My Work

Build:

- workflow templates
- stages
- assignments
- parallel review
- due dates
- comments
- responses
- review decisions
- approvals
- supersession transaction
- My Work
- approval workspace
- overdue notifications

## Mandatory tests

- decision requires revision id
- comment stays on revision
- reviewer cannot approve
- required parallel slot blocks coordinator
- return leaves old revision Returned
- resubmission creates new revision/workflow
- approval transaction supersedes old Current atomically
- approval rollback leaves all states unchanged
- due date uses Africa/Algiers project date logic
- overdue count matches seed

Gate:

> Decisions point at a revision.

---

# 37. Phase G — transmittals

Build:

- draft transmittals
- recipients
- exact revision selection
- freeze warning
- issue
- frozen detail
- cover sheet
- acknowledgements
- register

## Mandatory tests

- issued item immutable
- Rev D creation does not change transmittal containing Rev C
- item title snapshot preserved
- unauthorized item cannot be added
- recipient acknowledgement does not alter package
- no item edit endpoint after issue

Gate:

> Issued packages stay frozen.

---

# 38. Phase H — correspondence and reports

Build:

- correspondence register
- correspondence detail
- incoming/outgoing
- chains
- revision links
- due dates
- attachments
- reports
- server exports

## Mandatory tests

- correspondence revision link does not float to current
- hidden correspondence omitted from search
- exports contain only authorized rows
- PDF/XLSX export uses server policy
- response due dates persisted

Gate:

> Exports respect permissions.

---

# 39. Phase I — pilot

Pilot uses realistic Line A volume first, then larger synthetic load.

## Pilot dataset minimum

- Line A 40-document fixture
- historical revision chains
- 23 drawing-class records as defined
- workflow assignments
- 3 transmittals
- correspondence chain
- organization-confidential contractor records
- restricted records
- stale reference case
- missing metadata case

## Scale test targets

Before national-scale claims, test at least:

- 50k documents,
- 150k revisions,
- 250k file records,
- 100k workflow decisions/comments,
- 20k transmittals,
- 500 users,
- realistic role/scope joins.

These are engineering validation targets, not product marketing promises.

## Pilot pass criteria

No critical lifecycle invariant failure.

Specifically:

- no wrong Current revision,
- no old revision overwrite,
- no mutable issued transmittal,
- no permission leak,
- no approval by reviewer,
- no missing audit on controlled action,
- no unauthorized export,
- no search leakage,
- no hard delete of issued history.

The pilot fails closed if any V1 critical check fails.

---

# 40. Testing strategy

## Unit tests

For pure domain logic:

- next revision code
- status labels
- overdue calculation
- numbering token resolution
- scope predicates
- confidentiality resolver
- workflow transition validation

## Feature tests

Primary test layer.

Every invariant in `DOMAIN_RULES.md` gets:

- one allowed test,
- one forbidden test.

## Authorization tests

Build a matrix test suite from `PERMISSIONS_MATRIX.md`.

Use real users:

- Amina
- Sara
- Karim
- Leila
- Omar
- Nadia
- Malik
- Hugo
- Samir
- Ines
- Yacine

## Browser tests

Critical journeys only:

1. command center → 00188 review
2. MDR → 00142 Rev D → Rev C → Rev D
3. create Rev E while D stays Current IFC
4. reviewer sees no approve action and endpoint also forbids
5. transmittal issue → frozen detail
6. correspondence chain
7. Pontis session cannot find Tractis confidential record

Do not try to browser-test every filter permutation.

---

# 41. Seed and fixture strategy

The repository's `REALISTIC_RAILWAY_SEED_DATA.md` becomes executable fixtures.

Create deterministic seeders.

Recommended:

- `LineAProgrammeSeeder`
- `LineAOrganizationsSeeder`
- `LineAPeopleSeeder`
- `LineAProjectConfigurationSeeder`
- `LineADocumentsSeeder`
- `LineAWorkflowSeeder`
- `LineATransmittalsSeeder`
- `LineACorrespondenceSeeder`

Seed output must reproduce counts:

- 40 controlled documents
- 21 current approved/IFC/info
- 6 IFC
- 13 in review
- 1 overdue
- 3 returned
- 3 drafts
- 2 transmittals issued this week
- 2 outstanding acknowledgements

Use a test that asserts all counts.

---

# 42. Event architecture

Use domain events only where they add decoupling.

Examples:

- `RevisionSubmitted`
- `ReviewAssigned`
- `ReviewCompleted`
- `RevisionApproved`
- `RevisionSuperseded`
- `ActionOverdue`
- `TransmittalIssued`
- `TransmittalAcknowledged`
- `CorrespondenceIssued`

Controlled state must commit before after-commit listeners run.

Listeners may:

- create notifications,
- send email,
- refresh ActionItem,
- schedule preview,
- invalidate caches.

Listeners must not decide whether approval/supersession is valid.

---

# 43. Transaction boundaries

Use explicit transactions for:

- number allocation
- document registration
- revision creation if number/copy relationships must be atomic
- submission + workflow creation
- approval + supersession
- transmittal issue
- permission changes
- correspondence issue if reference numbering is allocated

Keep file preview jobs outside the transaction.

---

# 44. Concurrency risks

Must test:

## Revision approval race

Two approvers cannot both produce conflicting current pointers.

Use row locks.

## Number allocation race

Two document controllers cannot reserve same next sequence.

## Transmittal issue race

Two issue requests cannot produce two state transitions on same draft.

## Acknowledgement race

Acknowledgement endpoint idempotent.

## Bulk import

Duplicate rows across concurrent imports must respect database uniqueness.

---

# 45. Idempotency

Use idempotency protection for high-risk POST actions where duplicate requests are plausible:

- issue transmittal,
- approve revision,
- acknowledge transmittal,
- bulk import commit,
- correspondence issue.

At minimum protect against browser retry/double-click.

---

# 46. Security baseline

Implement:

- CSRF protection
- secure session cookies
- rate limiting
- password hashing
- MIME validation
- file extension mismatch detection
- malware scanning
- signed file URLs
- tenant isolation
- project authorization
- audit
- no public storage bucket
- secure headers
- content-disposition sanitization
- XSS-safe rendering
- no HTML trust from extracted documents

Consider CSP once viewer behavior is stable.

---

# 47. Data retention and backups

Before pilot:

- PostgreSQL automated backups
- object-storage versioning or equivalent protection
- tested database restore
- tested file restore
- queue failure recovery
- documented RPO/RTO targets

Because document control is trust infrastructure, backup restoration must be tested, not assumed.

---

# 48. Operational administration

Tenant admin:

- tenant settings
- user activation
- project creation
- organization directory

Project admin:

- project settings
- lots
- sections
- disciplines
- types
- metadata
- numbering
- workflows
- roles
- memberships

Configuration changes audit before/after.

Do not let project admins bypass immutable-history rules.

---

# 49. Performance strategy

## Registers

- server pagination
- indexed filter columns
- select only visible columns + required ids
- avoid loading revision history per row
- eager load intentionally
- query count tests

## Viewer

- lazy thumbnails
- page virtualization if needed
- object-storage range support

## Search

- indexed search vector
- authorization predicates
- pagination

## Audit

Audit may become large.

Index:

- tenant
- project
- subject type/id
- actor
- created_at
- action

---

# 50. Cache strategy

Cache configuration and low-volatility dictionaries:

- disciplines
- document types
- role permissions
- project settings

Do not cache authorization results without careful invalidation.

Do not cache Current revision in a way that can show stale authority after approval.

`document.current_revision_id` is already the read optimization.

---

# 51. Logging and observability

Log structured fields:

- request id
- tenant id
- project id
- user/person id
- action
- subject id
- result
- latency

Alert on:

- queue failures
- preview failures spikes
- object storage failures
- 5xx
- failed supersession transaction
- excessive denied sensitive actions
- export failures

Application logs are not the audit log.

---

# 52. CI/CD

Every PR:

1. install backend dependencies
2. install frontend dependencies
3. lint PHP
4. static analysis
5. run unit/feature tests
6. run frontend typecheck
7. frontend lint
8. build assets
9. migration sanity check

Later add browser tests on protected branch or nightly.

No merge if:

- invariant tests fail
- authorization matrix fails
- TypeScript fails
- migration fails.

---

# 53. Branch and PR strategy

Small phase-aligned PRs.

Do not build all of Phase E in one PR.

Suggested sequence follows.

---

# 54. Detailed PR roadmap

## P00 — Bootstrap

- Laravel
- Inertia React
- TypeScript
- Tailwind
- PostgreSQL
- Redis
- S3 config
- CI
- health page

Gate: green empty app.

## P01 — Tenant and identity schema

- tenant
- user
- organization
- person
- login

## P02 — Project membership

- programme
- project
- memberships
- members

## P03 — Roles, permissions, scopes

- permission tables
- policies
- scope resolver

## P04 — Audit infrastructure

- audit table
- writer
- read UI

## P05 — Project configuration

- lots
- sections
- disciplines
- types

## P06 — Metadata schema

- schemas
- definitions
- validation

## P07 — Numbering engine

- templates
- sequences
- reservations
- cancellation

## P08 — Document core

- document
- revision
- relationships

## P09 — File pipeline

- object storage
- checksum
- processing states
- preview jobs

## P10 — Line A executable seed

- deterministic fixtures
- counts test

## P11 — MDR backend

- authorized query
- filters
- pagination
- saved views

## P12 — MDR UI

- dense table
- filters
- side sheet

## P13 — Drawing register

- same engine
- drawing filter

## P14 — Document detail/history

- metadata
- revisions
- activity

## P15 — PDF viewer

- PDF.js
- thumbnails
- permission-safe original download

## P16 — New revision

- create
- edit draft
- state messaging

## P17 — Upload + bulk import

- single upload
- dry run
- commit

## P18 — Global search

- groups
- authorization

## P19 — Workflow templates

- templates
- stage builder

## P20 — Workflow instances

- submission
- assignments
- due dates

## P21 — Review comments

- comments
- responses
- statuses

## P22 — My Work

- materialization
- tabs
- overdue

## P23 — Review workspace

- assigned review
- non-approval decisions

## P24 — Approval transaction

- approve
- reject
- supersession
- current pointer

This PR receives intense invariant review.

## P25 — Notifications

- in-app
- email
- due jobs

## P26 — Transmittal draft

- create
- recipient
- exact revision items

## P27 — Transmittal issue/freeze

- issue transaction
- immutable items

## P28 — Transmittal detail/ack

- detail
- acknowledgement

## P29 — Correspondence core

- register
- detail
- recipients

## P30 — Correspondence chains/revision links

- replies/follows
- exact revision linking

## P31 — Reports/exports

- CSV/XLSX/PDF
- server permissions

## P32 — Command palette

- authorized search/actions

## P33 — Project settings completeness

- roles
- numbering
- workflows
- metadata

## P34 — Browser critical journeys

- seven critical E2E flows

## P35 — Performance/load hardening

- 50k doc synthetic seed
- indexes
- query tuning

## P36 — Pilot hardening

- backup/restore
- security review
- audit verification
- runbook

---

# 55. Coding rules for agents

Any Codex/agent working in EvoRail must follow these rules.

## Before coding

Read:

- this file
- the specialized docs relevant to the task
- current tests
- existing code in the target area

## Never invent a rule

If behavior is ambiguous:

- prefer the existing domain spec,
- document the ambiguity,
- do not silently create a new state or permission.

## No broad refactors during domain PRs

Approval, supersession, permission, and transmittal PRs must stay reviewable.

## No direct state mutation

Do not write:

```php
$revision->update([
    'effective_state' => 'current'
]);
```

from controllers.

Use explicit domain actions.

## Tests before claiming PASS

Every PR report returns:

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

---

# 56. Definition of done per feature

A feature is not done when the UI appears.

It is done when:

- domain action exists,
- server authorization exists,
- audit exists if controlled,
- feature tests exist,
- forbidden case test exists,
- React UI exists,
- empty state exists,
- denied state is safe,
- Line A fixture proves it,
- documentation updated if behavior changed.

---

# 57. Pilot user journeys

The pilot must prove these end-to-end.

## Journey 1 — find authority

Open Line A.

Find:

`LNA-EVO-TRK-DWG-S05-00142`

See Rev D:

- Current
- IFC
- approved by Amina
- 26 Sep

## Journey 2 — historical revision

Switch to Rev C.

See:

- Superseded
- current is Rev D
- Rev C files unchanged
- TR-2026-00810 named Rev C

## Journey 3 — new revision without premature supersession

Create Rev E.

Rev D remains Current IFC.

Rev E is Draft then Under Review.

## Journey 4 — overdue review

Leila opens 00188 Rev C from My Work.

Sees:

- due 25 Sep
- 3 days overdue on 28 Sep
- comment/review controls
- no approval capability

## Journey 5 — server denial

Call approval endpoint as review-only user.

Receive forbidden response.

No suitability/effective state changes.

Denied audit event written.

## Journey 6 — transmittal freeze

Create a transmittal with:

- 00188 Rev C
- 00190 Rev B

Issue.

Later new revisions do not rewrite package.

## Journey 7 — contractor isolation

Login as Pontis.

Search for Tractis organization-confidential method statement.

No result.

Direct URL cannot reveal existence.

## Journey 8 — correspondence chain

Open:

`NRA/IN/2026/0142`

Follow reply:

`EVO/OUT/2026/0881`

See exact Rev B calculation link.

## Journey 9 — bulk MDR import

Dry-run 40-row fixture with one duplicate.

No writes.

Commit valid import.

Duplicate reported.

## Journey 10 — audit reconstruction

For 00142, reconstruct:

- Rev C approved
- transmittal 00810 issued
- Rev D uploaded
- submitted
- approved
- Rev C superseded
- transmittal 01012 issued

---

# 58. Acceptance matrix against existing invariants

## I1

Test document-number uniqueness and dead cancelled numbers.

## I2

Test revision file immutability and document ownership.

## I3

Test issued transmittal snapshot immutability.

## I4

Test decisions/comments require revision.

## I5

Test audit append-only and before/after.

## I6

Test no hard delete of issued records.

## I7

Test authorization on list/detail/search/download.

## I8

Test contractor isolation.

## I9

Test review != approve and view != download.

## I10

Test bulk import invalid-row behavior.

## I11

Test Current is approval result, not highest code.

## I12

Test superseded history remains reachable and visibly obsolete.

No pilot release until all twelve pass.

---

# 59. Prototype-to-production mapping

Current prototype files are UX references.

Production should preserve the proven journeys but improve:

- real 40-row register
- true filters
- pagination
- PDF.js
- dynamic side sheet
- command palette
- keyboard navigation
- real state transitions
- correspondence register
- contractor-isolation sessions
- reports

Do not copy static HTML architecture into React page-by-page without shared components.

Create reusable:

- register shell
- filter bar
- state label
- revision badge
- side sheet
- metadata grid
- activity timeline
- workflow timeline
- file panel
- comment thread
- organization chip
- permission-aware action menu

---

# 60. Future architecture boundaries

V1 should not implement future modules, but avoid blocking them.

Future entities may include:

- alignment
- GIS feature
- asset
- BIM model
- BIM object
- schedule activity
- RFI
- NCR
- inspection
- ITP
- site photo
- progress record
- contract
- cost code
- budget
- change order
- procurement
- handover package

V1 should leave extension points through:

- document relationships
- metadata
- project structure
- stable UUIDs
- events
- exact revision references.

Do not prematurely add nullable foreign keys for every future module.

---

# 61. GIS future phase

Later, after pilot trust:

- railway linear map
- PK ranges
- section visualization
- document overlays
- issue references
- asset references

GIS must consume controlled document data.

It does not become the source of truth for revision authority.

---

# 62. BIM future phase

Later:

- IFC models
- model revisions
- document-model relationships
- object references
- issue linking

Do not conflate BIM model revision with engineering-document revision.

---

# 63. Planning future phase

Later:

- WBS
- schedule activities
- Primavera import
- document deliverables linked to schedule
- approval-delay risk

The first planning integration should likely focus on **design deliverable schedule**, because that fits EvoRail's current information-control foundation.

---

# 64. AI future phase

AI becomes useful only after the lifecycle is trusted.

Potential future capabilities:

- metadata suggestions
- document classification
- revision summaries
- stale-reference detection
- natural-language project search
- transmittal cover-note drafting
- correspondence drafting
- cross-document consistency flags

Every AI answer should cite records.

AI remains outside final authority.

---

# 65. Product metrics for pilot

Track:

- median document registration time
- review turnaround
- overdue stage count
- time to find current revision
- superseded-file open attempts
- transmittal acknowledgement time
- metadata completeness
- search success
- unauthorized access failures
- preview processing success
- import error rate

The strongest product metric is not daily active users.

It is:

> Can the project team reliably identify and distribute the correct controlled information?

---

# 66. Pilot readiness checklist

## Domain

- [ ] all 12 invariants pass
- [ ] revision state transitions tested
- [ ] transmittal freeze tested
- [ ] workflow tested

## Security

- [ ] contractor isolation
- [ ] search isolation
- [ ] download separation
- [ ] export isolation
- [ ] scope tests

## Data

- [ ] Line A seed exact
- [ ] bulk import
- [ ] backups
- [ ] restore test

## Files

- [ ] S3 configured
- [ ] checksums
- [ ] previews
- [ ] signed downloads
- [ ] failed-processing states

## UX

- [ ] 32 V1 screens where required by shipped phases
- [ ] PDF viewer
- [ ] MDR dense enough
- [ ] superseded banner
- [ ] frozen transmittal state
- [ ] permission explanation where safe

## Operations

- [ ] queue monitoring
- [ ] error monitoring
- [ ] support runbook
- [ ] recovery runbook

---

# 67. Release policy

Use release candidates.

Do not call pilot-ready from main just because CI is green.

Suggested:

```text
v0.1 internal domain
v0.2 document register
v0.3 workflow
v0.4 transmittals
v0.5 correspondence
v0.6 pilot RC
v1.0 after pilot sign-off
```

---

# 68. What must never be optimized away

Under schedule pressure, do not remove:

- immutable revisions,
- frozen transmittals,
- revision-bound decisions,
- server-side authorization,
- append-only audit,
- confidentiality,
- denied-case tests,
- exact revision links,
- atomic supersession.

These are the product.

---

# 69. First implementation action after Phase B

Once `PROTOTYPE_AUDIT.md` has no blockers:

Create a branch for **P00 Bootstrap**.

Do only:

- Laravel
- Inertia React
- TypeScript
- PostgreSQL connection
- Redis connection
- S3 abstraction/config
- auth shell placeholder
- CI
- health check
- environment documentation

Do not create `documents` in P00.

Then proceed through P01–P04 until server-side tenancy, memberships, permissions, and audit are real.

Only then begin document lifecycle tables.

---

# 70. Final build principle

EvoRail should not try to impress the pilot with the number of modules.

It should earn trust through controlled history.

A successful V1 means:

> A railway project can use EvoRail as the trusted source for engineering documents because every revision, review, issue, distribution, correspondence link, permission decision, and audit event remains exact and reconstructable.

Once that is trusted, GIS, BIM, planning, field execution, cost, and AI can be built on top of a reliable project-information spine.

Until then, expanding the product is a distraction.

---

# 71. Implementation status template

Keep this at the top of future implementation reports:

```text
EVORAIL IMPLEMENTATION STATUS

Current phase:
Current PR:
Current gate:

Domain:
[ ]

Security:
[ ]

Data:
[ ]

UI:
[ ]

Tests:
[ ]

Known blockers:
-

Next allowed action:
-
```

---

# 72. Source-of-truth hierarchy

When an agent or developer encounters ambiguity, use this order:

1. `DOMAIN_RULES.md`
2. `PERMISSIONS_MATRIX.md`
3. `REVISION_STATE_MACHINE.md`
4. `WORKFLOW_ENGINE_SPEC.md`
5. `ERD.md`
6. `INFORMATION_ARCHITECTURE.md`
7. `SCREEN_INVENTORY.md`
8. `REALISTIC_RAILWAY_SEED_DATA.md`
9. this build execution plan
10. prototypes

Prototypes never override domain rules.

---

# 73. End state of V1

At V1 sign-off, EvoRail should provide:

```text
Tenant
└── Programme
    └── Project
        ├── Organizations
        ├── People
        ├── Permissions
        ├── Documents
        │   └── Immutable revisions
        ├── Drawings + PDF viewer
        ├── Workflow
        │   ├── Reviews
        │   ├── Comments
        │   └── Approvals
        ├── Transmittals
        ├── Correspondence
        ├── My Work
        ├── Search
        ├── Reports
        └── Append-only audit
```

This is the complete V1 build.

Everything else waits behind the pilot gate.
