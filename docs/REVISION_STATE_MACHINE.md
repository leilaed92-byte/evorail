# Revision state machine

Four axes move independently. This file lists legal transitions. Anything not listed is rejected and audited as a denied transition.

Axes and field names match [DOMAIN_RULES.md](DOMAIN_RULES.md).

## Revision code

Assigned once at creation. Not a state machine. Line A drawing sequence: `A`, `B`, `C`, `D`, then `E`. Numeric sequences (`0`, `1`, `2`) are allowed when the document type says so. The next code is the next unused code in that document's sequence. Skipped codes are not filled by guessing. A cancelled draft code is not reused.

Creating the next revision requires `create_revision` and a reason. The new row copies forward the document's number and the previous revision's title as a starting title. The copy is a new snapshot. The previous row is not updated by the copy.

## Workflow state

```text
Draft ──submit──► Submitted ──start review──► Under Review
                                               │
                          ┌────────────────────┼─────────────────────┐
                          │                    │                     │
                     return for           approve /              reject
                     revision             information            (terminal
                          │                    │                  for this
                          ▼                    ▼                  revision)
                      Returned             Completed
                          │
                     new revision
                     (different row)
                          │
                          ▼
                      Resubmitted ──start review──► Under Review
```

| From | Event | To | Who |
|---|---|---|---|
| (none) | create revision | Draft | create_revision |
| Draft | submit | Submitted | submit |
| Submitted | first assignment starts | Under Review | system when a reviewer is assigned |
| Under Review | decision revise_and_resubmit | Returned | review on that stage |
| Under Review | decision rejected | Completed | approve, because rejection closes the revision |
| Under Review | decision approved, approved_with_comments, or information_only on the final required stage | Completed | approve, or review when the decision is information_only |
| Returned | author creates the next revision and submits it | The new revision becomes Resubmitted. The returned revision stays Returned | create_revision + submit |

`Resubmitted` is the workflow state of the new revision, not a second life for the old one.

Parallel stage: the stage stays `Under Review` until every required slot has decided or the coordinator records the stage decision, as specified in the workflow spec. Partial slot decisions do not change the revision workflow state.

Illegal:

- Draft to Completed
- Completed back to Under Review
- Editing workflow state by a direct field write
- Submit with required metadata missing

## Suitability

Set at creation to the purpose selected by the author (`For Information`, `For Review`, `For Approval`). Later changes:

| Event | New suitability |
|---|---|
| Author submits for review | For Review, unless they explicitly submitted For Information |
| Final approval | The suitability chosen on the approval: Approved or Issued for Construction |
| Approval with comments that the stage treats as acceptance | Approved or Issued for Construction, as chosen |
| As-built upload approved | As-Built |
| Rejected or revise and resubmit | Suitability unchanged |

Information-only distribution does not set Approved or Issued for Construction.

Illegal: an Engineer setting Issued for Construction without an approval decision. Suitability is not a free dropdown on a submitted revision.

## Effective state

| From | Event | To |
|---|---|---|
| (new) | create, and no issuing approval yet | no Current flag. Stored effective state is `Current` only if this is the first revision and the project rule says drafts occupy current. Line A rule: effective state starts as `Current` only when there is no prior revision; otherwise the new draft is `Current` for authoring visibility but does not replace an issued Current. See the two-track rule below. |
| Current (draft or in review) | a different revision of the same document is approved to Approved, IFC, or As-Built | The approved revision becomes Current. The previous Current becomes Superseded if it had been issued. If the previous was an unissued draft, it stays addressable and is marked Superseded so the register has one Current. |
| Current issued | newer approval to an issuing suitability | Superseded |
| Current or Superseded | withdraw | Withdrawn |
| any except hard-deleted | archive | Archived |

### Line A two-track rule

The register must not call an in-review Rev E "the current IFC" while Rev D is the issued IFC.

So effective state is not enough on its own for the label. The UI label is:

- **Current IFC** when `effective_state = Current` and suitability is Issued for Construction (or Approved / As-Built with that word in the label).
- **In review** when workflow is Submitted, Under Review, or Resubmitted, even if this draft is the latest code.
- **Superseded** when effective state is Superseded, with the current code named in the banner.
- **Withdrawn** / **Archived** as named.

Implementation detail: while an issued Current exists, a newer unapproved revision does not take `current_revision_id`. It is the latest revision, stored as `latest_revision_id` if we need it, and its effective state is not Current. On approval it swaps with the previous Current in one transaction.

If the document has never been issued, the in-flight revision may be Current so the register is not empty, and the label is the workflow state, not IFC.

Withdrawn and Archived revisions cannot become Current again. A replacement is a new revision.

## Same-transaction supersession

When approval sets an issuing suitability and completes the workflow:

1. Lock the document row.
2. Write the decision on this revision id.
3. Set this revision workflow to Completed, suitability to the chosen issuing value, effective state to Current.
4. Set the previous Current revision, if any, to Superseded.
5. Point `document.current_revision_id` at this revision.
6. Write audit events for the approval and for the supersession.
7. Emit `RevisionApproved` and `RevisionSuperseded`.

If any step fails, none of the state changes commit.

## What creation must not do

Creating Rev D:

- does not change Rev C checksums, snapshot, comments, or transmittal items
- does not mark Rev C superseded unless Rev D is approved under the rule above
- does not move comments forward
- does not alter transmittal `TR-2026-00810`

## Discard

Only workflow state `Draft`, never submitted, and never referenced by an issued transmittal. Discard sets nothing public; the row is retained with workflow `Draft` and effective `Withdrawn`, number code not reused, audit event written. This satisfies "no silent destruction" without a hard delete.

## Worked Line A path

Document `LNA-EVO-TRK-DWG-S05-00142`:

| Code | After its own approval | After Rev D is approved IFC |
|---|---|---|
| A | was Current, then Superseded by B | Superseded |
| B | was Current, then Superseded by C | Superseded |
| C | Current IFC until 26 Sep 2026 | Superseded. Still the revision inside `TR-2026-00810` |
| D | Current, Issued for Construction, workflow Completed | Current |

A later Rev E uploaded for review on 28 Sep 2026 stays Under Review and does not become Current until approved.
