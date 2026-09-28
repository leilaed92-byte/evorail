# Information architecture

V1 navigation is the engineering-control workspace. Future modules exist in the master plan and are absent from the sidebar until they are real products.

## Global shell

Desktop:

```text
┌──────────┬───────────────────────────────────────────────┐
│ Sidebar  │ Context: project, search, account            │
│          ├───────────────────────────────────────────────┤
│          │ Workspace                                     │
└──────────┴───────────────────────────────────────────────┘
```

One stable sidebar. Do not nest a second tree of modules inside it.

Global items:

| Item | Question it answers |
|---|---|
| Home | What needs me across projects? |
| Projects | Which railway projects can I open? |
| Documents | Search controlled documents I may see, across projects |
| Organizations | Which companies exist on this tenant? |
| People | Who has a project role? |
| My Work | My queue, all projects |
| Administration | Tenant settings. Visible to tenant owner and tenant administrator |

Analytics is not a V1 destination. Counts live on Home and on the project overview.

Command palette (`Ctrl/Cmd+K`): find document, go to project, upload, create transmittal, my reviews, recent records.

## Project workspace

Opening a project replaces the global list with project context. The project name and code stay visible on document screens.

```text
Overview
Documents
Drawings
Transmittals
Reviews & Approvals
Correspondence
My Work
Organizations
Reports
Project Settings
```

| Item | Contents |
|---|---|
| Overview | Attention, workflow counts, discipline status. Not a grid of vanity cards |
| Documents | Master Document Register for every controlled type |
| Drawings | The same engine filtered to drawing types, plus the drawing viewer |
| Transmittals | Register, detail, create, acknowledgements |
| Reviews & Approvals | Stages waiting in this project. A person can also work from My Work |
| Correspondence | Letters, instructions, notices, minutes, memos, and their chains |
| My Work | This project's slice of the personal queue |
| Organizations | Memberships and roles on this project |
| Reports | The V1 export list |
| Project Settings | Disciplines, types, numbering, metadata, workflow templates, roles. Project administrator and document controller |

There is no Planning, Map, Site, Quality, Contracts, Costs, Procurement, BIM, or Handover item.

## Home

Personal, not a second project dashboard.

- Reviews assigned to me
- Overdue reviews
- Recent transmittals that need acknowledgement
- Documents returned with comments
- Approvals waiting
- Recent changes on my projects
- Open comment responses

Each row names project, document number, revision, and due date, and opens that record.

## Projects

Rows or cards: name, code, client, phase, controlled-document count, pending reviews, overdue actions, latest activity. Counts respect permissions.

## Registers

Documents and drawings are tables first.

- Sticky header, server pagination, saved views, filter chips
- Column show/hide, resize, reorder stored on the saved view
- Bulk selection for metadata edits and safe workflow actions the caller may perform
- Keyboard movement along rows
- Row opens a side sheet: metadata, current revision, preview, workflow, relationships, recent activity
- Full page remains one action away for review, history, and the PDF viewer

Default drawing columns: number, title, discipline, lot, section, current revision, suitability, workflow, effective state, originator, review due, updated.

Effective state and suitability are text labels. A superseded row is labeled Superseded even when filters are cleared.

## Record hierarchy

```text
Project
└── Document (stable number)
    └── Revision
        ├── Files
        ├── Workflow instance
        ├── Review cycle and comments
        └── Transmittal items that cited this revision
```

The user does not walk a folder tree to find a controlled document. Search and the register are the way in. Project structure (lot, section, discipline) is metadata and filters.

## Search groups

A query such as `TRK 142` groups hits into Documents, Drawings, Transmittals, Correspondence, People. Drawing rows prefer the current issued revision and show other revisions under history. Inaccessible records are omitted entirely.

## Overview content

Primary counts: controlled documents, current approved or IFC, under review, overdue reviews, rejected or revise-and-resubmit, issued this week, active transmittals, outstanding acknowledgements, overdue actions, revisions received this week.

Workflow strip for the project, for example Submitted, Under Review, Comments issued, Resubmission due, Approved, IFC, Overdue.

Attention feed uses sentences that name the record and link to it. Examples are in the seed data.

Discipline status is one compact breakdown (Track, Civil Works, Structures, Signalling, and the rest of the seed disciplines), not a card per discipline.

## States the UI must show in words

Current, Under review, Rejected, Superseded, Withdrawn, Archived, plus the suitability (For Review, Approved, IFC, As-Built).

Opening a superseded revision shows a banner: which revision is current, its suitability, and a link to open it.

## Settings information architecture

Project Settings is a short list, not a second product:

- General (name, code, client, phase, timezone)
- Structure (lots, sections)
- Disciplines
- Document types and metadata
- Numbering
- Workflow templates
- Roles and memberships
- Confidentiality labels (rename only; the four classes stay)

## Empty and denied

- Empty register: explain that no documents are registered yet, and offer upload if the caller has permission.
- Denied record: same response as missing. Do not confirm that a number exists.
- Processing preview: the revision is registered; the viewer says the preview is not ready.
