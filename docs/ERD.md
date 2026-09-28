# Entity model

Conceptual model for V1. Names are domain names, not final table names. Identifiers are UUID. Timestamps are UTC. Tenant id is on every tenant-owned row.

This is not a migration. Schema is frozen only after these relationships survive a review against [DOMAIN_RULES.md](DOMAIN_RULES.md).

## Tenant and people

### Tenant

One deploying customer. Holds plan limits and auth settings.

### Organization

`id`, `tenant_id`, `legal_name`, `code`, `type`, `active`.

`type`: `owner`, `engineering_office`, `consultant`, `contractor`, `subcontractor`, `supplier`, `laboratory`, `authority`.

### User

Login identity. `email`, password hash, MFA secret nullable, `active`.

### Person

Directory profile shown on the project. A user may have one person per tenant. `display_name`, `email`, `organization_id`, `job_title`, `active`.

### ProjectMembership

Organization joins a project. `project_id`, `organization_id`, `status` (`active`, `suspended`).

### ProjectMember

Person on a project through a membership. `project_membership_id`, `person_id`, `project_role_id`.

Scope restrictions live on `MemberScope` rows: optional `discipline_id`, `contract_lot_id`, `section_id`, `document_type_id`, `confidentiality` ceiling.

Empty scope means the role's full project reach, still limited by confidentiality rules in the permissions matrix.

## Project structure

### Programme

`name`, `code`.

### Project

`programme_id`, `name`, `code`, `client_organization_id`, `phase`, `status`.

### ContractLot

`project_id`, `code`, `name`.

### Section

`project_id`, `contract_lot_id` nullable, `code`, `name`.

### Discipline

`project_id`, `code`, `name`. Seed list is in the seed data doc. Disciplines are data, not an enum compiled into the UI.

### ProjectStructureNode

Optional extra nodes (geographic segment, station group) when lot/section is not enough. `parent_id`, `kind`, `code`, `name`. V1 registers can filter on lot and section without this table being populated.

## Documents

### DocumentType

`project_id`, `code`, `name`, `is_drawing`. Drawings use the drawing register and the drawing viewer. Other types use the document register.

### MetadataSchema

`document_type_id` nullable (null means project-wide core extensions), `version`.

### CustomFieldDefinition

`metadata_schema_id`, `key`, `label`, `data_type`, `required`, `options` for selects.

`data_type`: `text`, `number`, `date`, `boolean`, `single_select`, `multi_select`, `organization`, `person`, `document_reference`, `structure_reference`.

### Document

Logical engineering document.

`project_id`, `document_type_id`, `number`, `number_source` (`generated`, `reserved`, `legacy`), `originator_organization_id`, `responsible_organization_id`, `discipline_id`, `contract_lot_id`, `section_id`, `confidentiality`, `current_revision_id` nullable.

`current_revision_id` is a cache maintained inside the supersession transaction. Readers that need authority re-check the revision's `effective_state = current`.

Core optional railway fields on the document (copied into each revision snapshot): `line`, `station`, `asset`, `pk_start`, `pk_end`, `work_package`, `design_package`, `system`, `subsystem`, `language`.

Uniqueness: (`project_id`, `number`).

### NumberReservation

`project_id`, `template_id`, `number`, `state` (`reserved`, `consumed`, `cancelled`), `document_id` nullable.

Cancelled rows remain forever.

### NumberingTemplate

`project_id`, `document_type_id` nullable, `pattern`, `sequence_scope`, `next_sequence` per scope stored in `NumberSequence`.

### DocumentRevision

`document_id`, `code`, `title`, `workflow_state`, `suitability`, `effective_state`, `purpose_of_issue`, `issue_date`, `originator_organization_id`, `change_reason`, `description`, `metadata_snapshot` (JSON, frozen at creation and at each controlled metadata edit while draft; frozen solid once submitted).

Unique (`document_id`, `code`).

A submitted revision's snapshot does not change except through a new revision. Draft metadata edits update the draft snapshot and write audit before/after.

### RevisionRelationship

`predecessor_revision_id`, `successor_revision_id`, `kind` (`next_in_sequence`). One successor per predecessor inside a document.

### DocumentRelationship

Typed link between documents or between a document and a specific revision.

`from_document_id`, `from_revision_id` nullable, `to_document_id`, `to_revision_id` nullable, `kind`.

`kind`: `references`, `supersedes`, `replaces`, `derived_from`, `related_to`, `requires`, `responds_to`, `applies_to`.

`supersedes` here is an explicit cross-document link. Same-document revision supersession uses `effective_state`, not this table.

### DocumentFile

`revision_id`, `storage_key`, `checksum_sha256`, `mime`, `byte_size`, `original_filename`, `role` (`original`, `preview`, `thumbnail`, `extracted_text`), `processing_status`.

Bytes live in object storage. The row holds the key and checksum.

### CustomFieldValue

Attached to a revision snapshot. `revision_id`, `field_definition_id`, `value`.

## Workflow and review

### WorkflowTemplate

`project_id`, `name`, `document_type_id` nullable, `active`.

### WorkflowStageTemplate

`template_id`, `position`, `name`, `kind` (`submit`, `review`, `parallel_review`, `decision`, `distribute`), `review_period_days`, `required_permission`.

### WorkflowStageReviewerSlot

`stage_template_id`, `assignment` (`user`, `project_role`, `organization`, `discipline_lead`).

### WorkflowInstance

`revision_id`, `template_id`, `state`, `started_at`, `completed_at`. A resubmission creates a new instance on the new revision. It does not reopen the old instance as if it were the same cycle.

### WorkflowStageInstance

`workflow_instance_id`, `stage_template_id`, `state`, `due_on`, `started_at`, `completed_at`.

### WorkflowAssignment

`stage_instance_id`, `person_id`, `organization_id`, `discipline_id` nullable, `state`.

### WorkflowDecision

`stage_instance_id`, `revision_id`, `actor_person_id`, `organization_id`, `decision`, `comment`, `decided_at`.

`decision`: `approved`, `approved_with_comments`, `revise_and_resubmit`, `rejected`, `information_only`.

### ReviewCycle

`revision_id`, `workflow_instance_id`, `index` starting at 1.

### ReviewComment

`review_cycle_id`, `revision_id`, `page` nullable, `author_person_id`, `organization_id`, `discipline_id`, `severity`, `body`, `status` (`open`, `responded`, `accepted`, `reopened`, `closed`).

### ReviewResponse

`comment_id`, `author_person_id`, `organization_id`, `body`, `created_at`. Status moves on the comment. Responses are never rewritten.

## Transmittals

### Transmittal

`project_id`, `number`, `sender_organization_id`, `purpose`, `contractual_reason`, `cover_note`, `status` (`draft`, `issued`, `closed`), `issued_at`.

Unique (`project_id`, `number`).

### TransmittalRecipient

`transmittal_id`, `organization_id`, `role` (`to`, `cc`), `acknowledgement_status` (`pending`, `acknowledged`), `acknowledged_at`, `acknowledged_by`.

### TransmittalItem

Written at issue time and then immutable.

`transmittal_id`, `document_id`, `revision_id`, `revision_code_snapshot`, `title_snapshot`, `suitability_snapshot`, `document_number_snapshot`.

No update path in application code. Corrections are a new transmittal.

## Correspondence

### Correspondence

`project_id`, `type`, `reference_number`, `subject`, `sender_organization_id`, `contract_lot_id` nullable, `document_date`, `received_on`, `response_due_on`, `responsible_person_id`, `status`, `body`.

`type`: `incoming_letter`, `outgoing_letter`, `instruction`, `notice`, `technical`, `minutes`, `memo`.

### CorrespondenceRecipient

`correspondence_id`, `organization_id`, `person_id` nullable.

### CorrespondenceRelationship

`from_id`, `to_id`, `kind` (`replies_to`, `follows`).

### CorrespondenceDocumentLink

`correspondence_id`, `document_id`, `revision_id`.

### CorrespondenceFile

Same shape as `DocumentFile` for attachments that are not controlled documents.

## Work, notification, audit, views

### ActionItem

Materialized queue row for My Work. `person_id`, `project_id`, `kind`, `revision_id` nullable, `stage_instance_id` nullable, `comment_id` nullable, `due_on`, `state` (`open`, `done`).

Rebuilt from workflow assignments and comment status. Not a free-floating task product.

### Notification

`person_id`, `kind`, `payload`, `read_at`, `subject` pointers. Email delivery is a job, not a second source of truth.

### AuditEvent

Append-only. `actor_person_id`, `organization_id`, `action`, `subject_type`, `subject_id`, `before` JSON, `after` JSON, `reason`, `workflow_instance_id` nullable, `transmittal_id` nullable, `created_at`.

No `updated_at`. No delete policy for ordinary roles.

### SavedView

`person_id` or `project_id` for shared views, `target` (`mdr`, `drawings`, `transmittals`, `correspondence`, `my_work`), `name`, `filters`, `columns`, `sort`.

## Files and processing

Processing status on `DocumentFile`: `pending`, `scanning`, `ready`, `failed`.

Jobs may create sibling rows with `role` preview, thumbnail, or extracted text. Failure leaves the original registered and the processing status visible. It does not roll back a committed revision.

## Relationship sketch

```text
Document 1 ──────< DocumentRevision
                     │
                     ├────< DocumentFile
                     ├────< WorkflowInstance ──< WorkflowStageInstance ──< WorkflowDecision
                     ├────< ReviewCycle ──< ReviewComment ──< ReviewResponse
                     └────< TransmittalItem >──── Transmittal

Organization ──< ProjectMembership >── Project
Person ──< ProjectMember >── ProjectRole ──< RolePermission
```

## Future entities, not in V1 tables

Alignment, GIS feature, asset, BIM model, BIM object, schedule activity, RFI, NCR, inspection, ITP, site photo, progress record, change order, cost code, budget, procurement record, handover package.

`DocumentRelationship.kind` and `metadata_snapshot` can point at those ids later without a vendor SDK. V1 does not create those tables.

## Integrity map

| Rule | Where it lives |
|---|---|
| I1 unique and cancelled numbers | Unique `(project_id, number)` plus `NumberReservation.state` |
| I2 one document per revision | `document_id` not null, no move action |
| I3 frozen transmittal | `TransmittalItem` insert-only after `issued` |
| I4 decision on a revision | `WorkflowDecision.revision_id` not null |
| I5 append-only audit | no update/delete API |
| I6 no hard delete of issued rows | policy plus absence of delete action when `issued_at` or effective state is not draft |
| I7–I9 scope | queries in policies, including search |
| I11 current pointer | set only inside the supersession action |
