# Screen inventory

32 V1 screens. The first 12 are the HTML prototype set. Prototypes use [REALISTIC_RAILWAY_SEED_DATA.md](REALISTIC_RAILWAY_SEED_DATA.md) and must be clickable through the journeys below. Screens 13–32 are specified so the shell does not invent them later. Screens 33–40 in the master plan (map, BIM, planning, field, cost) are not V1 screens.

Shell on every authenticated screen: sidebar, project context when inside a project, search, command palette.

## Prototype set

| # | Screen | Journey it proves |
|---|---|---|
| 1 | Project command center | What needs attention on Line A |
| 2 | Master Document Register | Find and filter controlled documents. Side sheet keeps the table |
| 3 | Drawing register | Drawing types only, current revision obvious |
| 4 | Document detail | Non-drawing record, metadata, history link |
| 5 | Drawing detail + PDF viewer | Glanceable Current / IFC, superseded path, preview |
| 6 | Revision history | Revisions, cycles, transmittals, audit for one number |
| 7 | New revision | Rev E upload does not claim to replace Rev D files |
| 8 | Review workspace | Reviewer finishes a review without leaving for other modules |
| 9 | Transmittal register | Issued packages and acknowledgement state |
| 10 | Create transmittal | Pick exact revisions, then issue freezes them |
| 11 | My Work | Queue: overdue 00188, returned BR-017, approvals |
| 12 | Project organizations | Memberships and the Tractis / Pontis split |

### 1. Project command center

Overview for Line A. Counts from the seed, not the scaled sample in the master plan. Attention feed links to 00188 (overdue), TR-2026-00982 (acknowledgements), 00142 Rev C superseded by D, and the legacy certificate missing metadata. Discipline strip lists seed disciplines with status counts. No future-module widgets.

### 2. Master Document Register

All 40 seed documents the caller is allowed to see. Pontis coordinator does not see `LNA-TRC-GEN-MST-S01-00014`. Saved views: My Reviews, Overdue Reviews, Track — IFC, Missing Metadata, Lot 03, Returned for Revision. Columns configurable. Bulk selection visible. Opening a row slides the sheet over the table.

### 3. Drawing register

`is_drawing` types only. Columns include current code, suitability, effective state, workflow. `00142` shows D, IFC, Current. Superseded revisions are not separate register rows. They appear in history.

### 4. Document detail

Worked record: `LNA-EVO-STR-CAL-S04-00017` Bridge BR-017 calculation note, Rev B, under client review. Metadata, files, workflow stage, related drawing, related letters, activity. Full page, not only the sheet.

### 5. Drawing detail + PDF viewer

`LNA-EVO-TRK-DWG-S05-00142` Rev D. PDF canvas with page thumbnails, zoom, metadata panel, revision selector, related documents, approval and transmittal history. Download shown only as an allowed action for roles with download. Revision selector includes C. Choosing C swaps to the superseded banner and does not look like the current sheet.

### 6. Revision history

Same drawing. Table of A–D with dates from the seed. Each row opens files, decisions, comments, and transmittals that named that revision. `TR-2026-00810` appears on C. `TR-2026-01012` appears on D.

### 7. New revision

From 00142, start Rev E. Form: code E (not editable into C), file, change reason, purpose For Review. Copy explains that Rev D stays the current IFC until E is approved. Primary action saves a draft. Submit is a second action.

### 8. Review workspace

Caller is the signalling reviewer on `LNA-EVO-TRK-DWG-S05-00188` Rev C, or the track lead. One screen: file, metadata, comment list, decision `revise and resubmit` / `information only`. No approve button for this role. Due date 25 Sep 2026 shown as overdue. Submitting the decision stays on a confirmation that names the revision code.

### 9. Transmittal register

`TR-2026-00810`, `TR-2026-00982`, `TR-2026-01012`. Status, from, to, purpose, item count, acknowledgement. 00810 is issued and historical. 00982 has outstanding acknowledgement.

### 10. Create transmittal

Draft package. Add exact revisions (00188 Rev C, 00190 Rev B). Recipient PMC Atlas. Purpose For Review. Issue action states that the listed revisions will be frozen. After issue, the detail page is read-only on items.

### 11. My Work

Tabs: Assigned to me, Reviews, Approvals, Comments to answer, Due soon, Overdue, Completed. Seed rows for Leila Cherif (track lead): overdue review 00188, comment response on the returned canopy or hydraulic calc. Amina Kaci sees the BR-017 calculation approval. Rows show project, number, revision, stage, originator, due date.

### 12. Project organizations

NRA, Evo Engineering, PMC Atlas, SIG Conseil, Tractis, Pontis, GeoLab. Type, lots, roles present. Tractis row does not list Pontis documents. A membership page states organization scope in one sentence.

## Remaining V1 screens

| # | Screen | Phase | Notes |
|---|---|---|---|
| 13 | Sign in | D | Email and password. MFA enrollment available, not forced |
| 14 | Home | D–F | Cross-project personal queue |
| 15 | Projects | D | Line A card with honest counts |
| 16 | Global search | E | Groups: Documents, Drawings, Transmittals, Correspondence, People |
| 17 | Organizations directory | D | Tenant companies, not only the open project |
| 18 | People directory | D | Person, organization, project roles |
| 19 | Upload document | E | Single file, metadata confirmation, numbering preview |
| 20 | Bulk upload | E | Validation preview, error rows, no silent insert |
| 21 | Review comments | F | Cycle thread for one revision. Can live inside screen 8 and also open alone |
| 22 | Approval workspace | F | Same shell as review, with approve / reject and suitability choice. Director only |
| 23 | Transmittal detail | G | Frozen items, cover sheet, acknowledgements |
| 24 | Correspondence register | H | |
| 25 | Correspondence detail | H | Chain NRA/IN/2026/0142 ↔ EVO/OUT/2026/0881 |
| 26 | Reports | H | Export list from the implementation plan |
| 27 | Project settings home | D | Links to the configuration screens |
| 28 | Workflow builder | F | Edit the Line A template. Does not hard-code a second engine |
| 29 | Metadata and numbering | E | Template `[PROJECT]-[ORIGINATOR]-[DISCIPLINE]-[TYPE]-[SECTION]-[SEQUENCE]` |
| 30 | Permissions and roles | D | Matrix in [PERMISSIONS_MATRIX.md](PERMISSIONS_MATRIX.md) |
| 31 | Audit log | D | Filterable, no edit, before/after visible |
| 32 | Command palette | E | Overlay, not a page |

## Prototype acceptance

A prototype set passes when a reviewer can, without explanation from the author:

1. Point at the current revision of the Section 05 alignment in one glance.
2. Open Rev C and see that it is superseded, then jump to Rev D.
3. See `TR-2026-00810` still naming Rev C from the history screen.
4. Complete a review decision on 00188 inside the review workspace.
5. Build a transmittal from named revisions and read the freeze warning before issue.
6. Land on 00188 from My Work and from the command center without using a folder path.

Visual polish follows Aurora tokens. Density stays at engineering-register level: the table is the product, the overview is not a card gallery.
