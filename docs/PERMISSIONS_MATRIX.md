# Permissions matrix

Access is not Admin versus Member. A person's reach is:

```text
User
+ Organization
+ Project membership
+ Project role
+ Permission set
+ optional scope restrictions
+ confidentiality class of the record
```

Every protected read and write checks this on the server. Hiding a button is not the control.

## Platform roles

Platform roles administer the tenant. They do not grant project document rights by themselves.

| Platform role | Can |
|---|---|
| Tenant owner | Tenant settings, create projects, invite organizations, assign the first project administrator |
| Tenant administrator | Same, except transferring tenant ownership |
| Member | Sign in and open projects where a project membership exists |

A tenant owner who is not on a project does not see that project's restricted documents. Support access, if ever added, is an audited break-glass action. V1 has no break-glass.

## Project roles

Seed roles. A project administrator may clone a role and edit its permission set. They may not create a permission that bypasses confidentiality or audit.

| Role | Intent |
|---|---|
| Project Director | Read across the project, approve, issue, see audit |
| Project Administrator | Configure project, roles, numbering, workflows, metadata |
| Document Controller | Register, number, bulk import, transmittals, distribution |
| Design Manager | Submit, see all design disciplines, distribute inside the design office |
| Discipline Lead | Submit and review inside scoped disciplines |
| Reviewer | Review and comment. Cannot approve |
| Engineer | Create drafts and revisions inside own organization and discipline |
| Contractor Coordinator | Upload and view own organization's package. Cannot see other contractors' organization-confidential records |
| Viewer | View and, only if granted, download |

## Object permissions

| Permission | Effect |
|---|---|
| view | See metadata, preview, history the confidentiality class allows |
| upload | Add a file to a draft revision |
| create_revision | Open the next revision on a document |
| edit_metadata | Edit draft metadata. Submitted snapshots stay frozen |
| submit | Move a draft into the workflow |
| review | Comment and record a non-approval decision on an assigned stage |
| approve | Record approval, approval with comments, or rejection when the stage requires it, and trigger supersession when the suitability rule says so |
| issue | Set an issuing suitability as part of an approval. Does not by itself distribute |
| download | Fetch original bytes through a short-lived authorized URL |
| distribute | Create and issue transmittals |
| administer_workflow | Edit templates, reassign, change due dates |

`review` does not imply `approve`. `view` does not imply `download`.

## Seed grants

`Y` granted. Blank means denied.

| Permission | Director | Admin | Doc controller | Design manager | Discipline lead | Reviewer | Engineer | Contractor coordinator | Viewer |
|---|---|---|---|---|---|---|---|---|---|
| view | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| upload | Y | Y | Y | Y | Y | | Y | Y | |
| create_revision | Y | Y | Y | Y | Y | | Y | Y | |
| edit_metadata | Y | Y | Y | Y | Y | | Y | | |
| submit | Y | Y | Y | Y | Y | | Y | Y | |
| review | Y | | Y | Y | Y | Y | | | |
| approve | Y | | | Y | | | | | |
| issue | Y | | Y | Y | | | | | |
| download | Y | Y | Y | Y | Y | Y | Y | Y | |
| distribute | Y | | Y | Y | | | | | |
| administer_workflow | | Y | Y | | | | | | |

Project Administrator has no approve grant. Configuration is not a signature.

Discipline Lead approves only if a project clones the role and adds `approve`. The seed lead reviews inside the discipline and does not sign IFC.

Design Manager may approve design-office stages. Client IFC on Line A is the Project Director of the owner organization, or a delegated role that has `approve` and is assigned to the client stage.

## Scope restrictions

A grant applies only inside scope. Scope dimensions:

- project
- organization
- discipline
- contract / lot
- section
- document type
- confidentiality ceiling

Examples:

- Engineer at Evo Engineering, discipline Track, lot 03: create and submit track drafts on Lot 03. No signalling package, no Pontis records.
- Reviewer assigned to a stage: review that revision even if outside their standing discipline scope, for that revision only. Assignment does not open the rest of the foreign package.
- Contractor Coordinator at Tractis: organization scope Tractis. Sees project-class and Tractis organization-class records on Lot 01. Does not see Pontis organization-class records.

Owner and Document Controller are not limited by organization scope. They are still limited by an explicit `Restricted` ceiling unless their role's ceiling includes `Restricted`. On Line A, Project Director and Document Controller include `Restricted`. Viewer does not.

## Confidentiality

| Class | Who can view |
|---|---|
| Project | Any project member with `view` and matching discipline/lot/section/type scope |
| Discipline | Members whose discipline scope includes that discipline, plus owner, document controller, and director |
| Organization | Owning organization, plus owner, document controller, and director |
| Restricted | Only roles whose ceiling includes Restricted, and only organizations named on the record's access list |

When a class and a scope both apply, both must pass.

## Worked checks

These are the Phase D release tests.

### Contractor isolation

Pontis coordinator calls, as Pontis:

- MDR list
- document detail
- preview
- download
- search for a distinctive phrase in the title
- open the transmittal item

for Tractis method statement `LNA-TRC-GEN-MST-S01-00014`, class Organization.

Each call returns not-found or an empty search group. It does not return 200 with the title. The audit log records denied reads for detail and download only; search misses are not listed as titles.

### Reviewer cannot approve

SIG Conseil reviewer on the signalling stage of `LNA-EVO-SIG-DWG-S04-00082` may comment and send `revise_and_resubmit` if that decision is enabled on the stage. The approve endpoint returns 403 and writes a denied audit event. No suitability change, no supersession.

### Download split

A Viewer with `view` and without `download` can open metadata and the preview rendered by the server. The original-file URL endpoint returns 403.

### Assignment is narrow

A structures reviewer assigned to one calculation note cannot list other organization-class structures documents they are not scoped to.

## Audit of permission changes

Granting a role, changing a permission set, and changing scope write audit events with before and after. They require Project Administrator. They are not delegated to Engineer or Contractor Coordinator.

## Search, notifications, exports

- Search documents, transmittals, correspondence, comments, and people through the same policy as the register.
- Notification bodies for a record the recipient cannot view are not created.
- CSV, XLSX, and PDF exports are the filtered rows the caller can view, generated on the server, not a client-side dump of a previously loaded page.
