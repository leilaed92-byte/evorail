# Workflow engine

Workflows are project templates applied to a revision. The Line A default matches the confirmed review path. A project may edit stages, periods, and assignees. It may not skip the rules that bind a decision to a revision and a cycle.

## Objects

- **Template** — ordered stages for a document type, or for the whole project when type is null.
- **Instance** — one run of a template on one revision.
- **Stage instance** — one step, with a due date and assignments.
- **Decision** — one recorded outcome on a stage, always with `revision_id`.
- **Review cycle** — the comment container for that instance. Index starts at 1. A new revision gets a new cycle. Old comments stay on the old cycle.

## Line A default template

Name: `Design review`.

| # | Stage | Kind | Period | Who acts | Permission |
|---|---|---|---|---|---|
| 1 | Submitted | submit | 0 | Originator | submit |
| 2 | Technical review | parallel_review | 14 calendar days | Discipline reviewers named on the stage | review |
| 3 | Comments | decision | 0 | Review coordinator | review |
| 4 | Revision required | decision | author sets resubmission date | Originator, outside this instance | create_revision on the next revision |
| 5 | Resubmitted | submit | 0 | Originator | submit on the new revision |
| 6 | Consultant review | review | 14 calendar days | Consultant organization | review |
| 7 | Client review | decision | 14 calendar days | Owner | approve |
| 8 | Approved / IFC | decision | 0 | Owner or delegated approver | approve and issue |
| 9 | Distributed | distribute | 0 | Document controller | distribute |

Stages 4 and 5 are not a loop inside the same revision. Stage 4 closes this instance as Returned. Stage 5 is the first stage of the next revision's instance, created from the same template with the entry point `Resubmitted` when the previous revision ended in revise-and-resubmit.

A document type may use a shorter template. Example: For Information correspondence attachments use submit and distribute only, with decision `information_only`.

## Decisions

| Decision | Effect on this revision | Next |
|---|---|---|
| approved | Stage completes | Next stage, or Completed if this was the issuing stage |
| approved_with_comments | Stage completes. Comments remain open until answered or explicitly accepted | Next stage. Issuing stage may still set IFC if the approver selects that suitability |
| revise_and_resubmit | Workflow becomes Returned. Suitability unchanged. Effective state unchanged | Author creates the next revision |
| rejected | Workflow Completed. Not Current unless it already was | No automatic next revision |
| information_only | Workflow Completed. Does not supersede an issued Current | Distribution may follow |

Only `approve` may record `approved`, `approved_with_comments`, and `rejected` on a stage whose template permission is approve. A review stage may record `revise_and_resubmit` and `information_only`.

## Parallel review

```text
Submission
├── Track reviewer        slot required
├── Structures reviewer   slot required
└── Systems reviewer      slot optional
        │
        ▼
Review coordinator records the stage decision
        │
        ▼
Next stage
```

Rules:

- Every required slot must submit a slot opinion before the coordinator can approve the stage.
- The coordinator may record `revise_and_resubmit` as soon as one required slot requests it, or wait. Line A default: coordinator waits for all required slots, then decides.
- Optional slots that have not responded when the coordinator decides are marked skipped.
- Slot opinions are not the revision decision. Only the coordinator decision changes workflow state.
- Assignees see the revision in My Work. They do not gain standing access to the rest of that organization's files.

## Due dates

```text
due_on = stage_started_on + review_period_days
```

Calendar days, project timezone `Africa/Algiers` for Line A. The due date is stored, not recomputed if the template period later changes.

Overdue means `due_on < today` in that timezone and the stage is not completed. The same function feeds the overview count, My Work, and the overdue report.

Worked example: submitted 28 Sep 2026, period 14, due 12 Oct 2026.

A stage with period 0 has no due date and cannot be overdue.

## Comments

A comment belongs to one cycle and one revision.

```text
open → responded → accepted
                 → reopened → responded
open → closed
responded → closed
```

Fields: comment id, document, revision, page, author, organization, discipline, severity (`major`, `minor`, `observation`), body, status, cycle. Markup location is reserved and unused in V1.

Closing a comment does not approve the revision.

## Returns and resubmission

1. Coordinator records `revise_and_resubmit` on Rev C. Rev C becomes Returned. Its comments stay on Rev C cycle 1.
2. Author creates Rev D with a change reason. Rev C files are untouched.
3. Author submits Rev D. New workflow instance, new cycle 1 on Rev D, workflow state Resubmitted.
4. Reviewers may see Rev C comments as history. Those rows are not copied unless an author explicitly carries a comment forward by reference. The reference stores both comment ids. It is not a move.

## Distribution stage

Completing Approved / IFC does not issue a transmittal. The distribute stage creates a task for the document controller. Issuing a transmittal is a separate action with its own snapshot rules.

## Notifications produced here

- review assigned
- approval assigned
- due tomorrow
- overdue (once per stage per day)
- comment received
- document returned
- new revision available to assignees
- workflow completed

Copy is factual and links to the revision. No notification includes a record the recipient cannot view.

## Illegal transitions the tests must reject

- Decision without `revision_id`
- Approve from a role that has only review
- Coordinator approval while a required parallel slot is empty, under the Line A wait rule
- Moving a comment to another revision
- Reopening a Completed issuing decision by editing it. A correction is a new revision or a withdrawal.
- Changing `due_on` without `administer_workflow`, and without an audit before/after

## Events

`RevisionSubmitted`, `ReviewAssigned`, `ReviewCompleted`, `RevisionApproved`, `ActionOverdue`. Supersession emits `RevisionSuperseded` from the revision action, not from the workflow template itself.
