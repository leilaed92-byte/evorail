# Domain rules

EvoRail controls engineering information for a railway project. A file in a folder is not a controlled document. The system of record is the document, its immutable revisions, and the workflows, transmittals, and audit events attached to those revisions.

Seed vocabulary lives in [REALISTIC_RAILWAY_SEED_DATA.md](REALISTIC_RAILWAY_SEED_DATA.md). Line A is the worked example. These rules are project-configurable where noted. They are not one client's hard-coded standard.

## 1. Four things that stay separate

| Concept | Persisted as | Line A example |
|---|---|---|
| Document | Stable identity and number | `LNA-EVO-TRK-DWG-S05-00142` Track Alignment — Section 05 |
| Revision | Immutable record with its own files and metadata snapshot | Rev D, issued 26 Sep 2026 |
| Workflow state | Where this revision is in review | Completed |
| Suitability | Why it was issued | Issued for Construction |
| Effective state | Whether people should use it | Current |

Revision code, workflow state, suitability, and effective state are four fields. A change to one does not rewrite the others.

### Document

The document number is the identity. The title may change on a later revision; the number does not. Files hang off a revision, not off the document.

### Revision

Creating Rev D inserts a new revision. It does not replace Rev C's file bytes, metadata snapshot, comments, workflow, or transmittal links.

Each revision stores: revision code, title if changed, workflow state, suitability, effective state, purpose of issue, issue date, originator, files, metadata snapshot, change reason, revision description, and links to its workflow, comments, approvals, and transmittals.

### Workflow state

`Draft`, `Submitted`, `Under Review`, `Returned`, `Resubmitted`, `Completed`.

### Suitability

Project-configurable. Line A seed values:

`For Information`, `For Review`, `For Approval`, `Approved`, `Issued for Construction`, `As-Built`.

`Issued for Construction` is the suitability users mean by IFC. The UI label may say IFC. The stored code is `issued_for_construction`.

### Effective state

`Current`, `Superseded`, `Withdrawn`, `Archived`.

`Current` means this revision is the one normal work should use. It is set by the supersession rule below, not by taking the highest revision code.

## 2. Project structure

Railway structure, not a building tree.

```text
Programme
└── Project
    ├── Contract / Lot
    ├── Section
    ├── Discipline
    ├── Geographic segment (metadata)
    └── Asset / Structure (metadata)
```

PK start and PK end are optional metadata. They are not the parent of a document. A document may also carry line, station, zone, structure, work package, design package, system, and subsystem.

Line A shape:

```text
National Railway Programme
└── Line A (LNA)
    ├── Lot 01 — Sections 01, 02, 03
    ├── Lot 02 — Section 04
    └── Lot 03 — Section 05
```

## 3. Numbering

A project defines one or more templates. Line A default:

```text
[PROJECT]-[ORIGINATOR]-[DISCIPLINE]-[TYPE]-[SECTION]-[SEQUENCE]
```

Example: `LNA-EVO-TRK-DWG-S05-00142`.

Rules:

- Sequences are per template scope (project + the tokens that the template marks as sequence scope). Line A sequence scope is project + originator + discipline + type + section.
- Numbers are unique inside the project.
- A controller may reserve a number before the file exists.
- A cancelled number stays reserved and is never reissued.
- Imported legacy numbers are stored as issued numbers even when they do not match the template. They still must be unique.
- The filename is not parsed as the source of truth. Filename parsing may suggest metadata. A person confirms it before registration.

## 4. Supersession

When a revision becomes authoritative, prior applicable revisions of that document move to `Superseded` and remain readable by people who may see history.

Line A rule:

- A revision becomes `Current` when an authorized approver records an approval whose resulting suitability is `Approved`, `Issued for Construction`, or `As-Built`, and the workflow reaches `Completed`.
- The previous `Current` revision, if any, becomes `Superseded` in the same transaction.
- `For Information` and `For Review` do not take `Current` away from an already issued revision.
- `Withdrawn` and `Archived` are explicit later actions. They are not a side effect of uploading the next letter.
- If no revision has yet been approved to an issuing suitability, the document has no `Current` revision. The latest draft is not displayed as current.

The register and the viewer label effective state in text. Color may reinforce it. Opening a superseded revision shows: which revision is current, that revision's suitability, and a link to open it.

## 5. Transmittals

A transmittal is a first-class issued record. On issue, each item stores document id, revision id, revision code, title, and suitability as they were at that moment.

Later revisions, title edits, and status changes do not alter issued items. Acknowledgements are per recipient organization and do not rewrite the package.

## 6. Comments, approvals, correspondence

- A review comment references one revision and one review cycle.
- An approval or rejection references one revision and one workflow stage instance.
- Correspondence may link to document revisions. The link stores the revision id. It does not float onto "whatever is current later."
- Response due dates are stored. They are not inferred from filenames.

## 7. Deletion

Controlled issued records are not hard-deleted through ordinary UI. Withdraw or archive them. Draft revisions that were never submitted may be discarded by a document controller. Discard writes an audit event. Reserved and cancelled numbers are not freed.

## 8. Audit

Every controlled action records: actor, organization, action, subject type and id, timestamp, before, after, optional reason, and the workflow or transmittal id when the action happened through one.

Audit rows are append-only. The UI does not offer edit or delete on them.

## 9. Confidentiality

Classes for Line A: `Project`, `Discipline`, `Organization`, `Restricted`.

`Organization` means visible to the owning organization plus the owner, the document controller, and roles explicitly granted that class. Another contractor on the same project does not receive it.

Search, registers, previews, downloads, transmittal item open, and notifications all apply the same scope. A hidden record does not appear as a title or snippet.

## 10. AI boundary

AI may later suggest metadata, summarize, and draft. It cannot approve, reject, supersede, issue a transmittal, send contractual correspondence, or change permissions. Those actions require a human with the matching permission. V1 does not ship the AI surface.

## 11. Invariants

Each rule has one allowed case and one forbidden case. Phase E–I tests should encode these.

### I1. Numbers are unique and cancelled numbers stay dead

Allowed: reserve `LNA-EVO-TRK-DWG-S05-00150`, cancel it, then issue `00151` for the next track drawing in Section 05.

Forbidden: after cancellation, register a new document as `LNA-EVO-TRK-DWG-S05-00150`.

### I2. A revision belongs to one document and never overwrites another

Allowed: add Rev D to `LNA-EVO-TRK-DWG-S05-00142` with a new file. Rev C's stored checksum is unchanged.

Forbidden: upload a replacement file onto Rev C, or attach Rev D's file row to two documents.

### I3. Issued transmittal contents do not mutate

Allowed: transmittal `TR-2026-00810` was issued with Rev C of the Section 05 alignment. After Rev D exists, that transmittal still shows Rev C and the title snapshot from 11 Aug 2026.

Forbidden: regenerating the issued package so it now lists Rev D, or editing the item title in place.

### I4. Decisions and comments point at a revision

Allowed: client approval of IFC stores revision id of Rev D and the stage instance id.

Forbidden: an approval row with only the document id, applied later to whatever revision is current.

### I5. Audit is append-only and stores before/after

Allowed: title change on a draft records previous title and new title, actor, organization, time.

Forbidden: an ordinary user editing that audit row, or a metadata update with no before/after.

### I6. Issued records are withdrawn, not destroyed

Allowed: withdraw Rev B of a drawing that was issued in error. History still shows Rev B, its transmittals, and the withdrawal event.

Forbidden: hard-delete of an issued revision or an issued transmittal from the register.

### I7. Authorization is server-side, including search

Allowed: a signalling reviewer searches "alignment" and sees Section 05 track drawings they are allowed to view.

Forbidden: the same search returning the title of Tractis's restricted method statement when the caller is Pontis.

### I8. Contractor isolation

Allowed: Tractis (Lot 01) downloads its own organization-confidential method statement. The project document controller and the owner can also open it.

Forbidden: Pontis (Lot 02) opening that statement, its preview, or its transmittal item.

### I9. Review is not approval, view is not download

Allowed: a Reviewer records comments and the decision `revise and resubmit` if the stage grants review.

Forbidden: that Reviewer calling approve, or downloading the native file when the role has view but not download.

### I10. Bulk import does not commit invalid rows

Allowed: a 40-row MDR import with one duplicate number. The other 39 valid rows import only if the run is not in dry-run, and the bad row is reported and skipped. A dry-run writes nothing.

Forbidden: inserting the duplicate, or silently inventing a new number for the bad row.

### I11. Current is a domain result

Allowed: Rev D is `Current` / `Issued for Construction` because it was approved. Rev C is `Superseded`. The register shows those labels.

Forbidden: treating Rev D as current only because `D` sorts after `C`, while Rev D is still `Draft`.

### I12. History stays reachable and obsolete use is visible

Allowed: opening Rev C shows a superseded banner and a control that opens Rev D.

Forbidden: a viewer that presents Rev C with the same current treatment as Rev D.

## 12. Configurable versus fixed

Project administrators may configure: document types, metadata fields, numbering templates, suitability values that count as issuing, workflow templates, review periods, confidentiality class labels, disciplines, lots, and sections.

Application code fixes: revision immutability, transmittal snapshot immutability, audit append-only behavior, server-side scope, the four status axes, and the rule that AI and reviewers cannot approve without the approve permission.
