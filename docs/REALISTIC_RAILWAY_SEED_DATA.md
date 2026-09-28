# Line A seed data

Realistic data for prototypes and later fixtures. Counts on the command center must match this file. Today in the story is **28 Sep 2026**. Timezone `Africa/Algiers`.

This is not a production import. Legacy numbers and the signalling cross-reference are deliberate.

## Programme and project

| Field | Value |
|---|---|
| Programme | National Railway Programme (`NRP`) |
| Project | Line A (`LNA`) |
| Client | National Railway Authority |
| Phase | Detailed design |
| PK | 0+000 to 53+200 |
| Numbering | `[PROJECT]-[ORIGINATOR]-[DISCIPLINE]-[TYPE]-[SECTION]-[SEQUENCE]` |

### Lots and sections

| Lot | Name | Sections |
|---|---|---|
| L01 | Civil and earthworks | S01, S02, S03 |
| L02 | Structures and systems | S04 |
| L03 | Track and traction | S05 |

### Disciplines

Track `TRK`, Civil Works `CIV`, Earthworks `ERW`, Structures `STR`, Geotechnical `GEO`, Hydraulics `HYD`, Stations `STA`, Signalling `SIG`, Telecommunications `TEL`, Electrification `ELE`, Power `PWR`, Systems `SYS`, Architecture `ARC`, Environment `ENV`, Safety `SAF`, Surveying `SUR`, General `GEN`.

### Suitability values that issue Current

`Approved`, `Issued for Construction`, `As-Built`. Stored IFC code is `issued_for_construction`. UI may say IFC.

## Organizations

| Code | Name | Type | On Line A |
|---|---|---|---|
| NRA | National Railway Authority | owner | Client, all lots |
| EVO | Evo Engineering | engineering_office | Designer, all lots |
| PMC | PMC Atlas | consultant | Project management consultant, all lots |
| SIGC | SIG Conseil | consultant | Signalling review, Lot 02 |
| TRC | Tractis | contractor | Lot 01 |
| PNT | Pontis | contractor | Lot 02 |
| LAB | GeoLab | laboratory | Geotech tests, Lot 01 |

## People

| Person | Organization | Project role | Scope |
|---|---|---|---|
| Amina Kaci | NRA | Project Director | All lots, confidentiality ceiling Restricted |
| Sara Mehdi | EVO | Document Controller | All lots, Restricted |
| Karim Haddad | EVO | Design Manager | All design disciplines |
| Leila Cherif | EVO | Discipline Lead | Track |
| Omar Boudiaf | EVO | Engineer | Track, Lot 03 |
| Nadia Ferhat | EVO | Engineer | Structures, Lot 02 |
| Malik Cherbi | SIGC | Reviewer | Signalling |
| Hugo Lambert | PMC | Reviewer | All disciplines, review only, no approve |
| Samir Taleb | TRC | Contractor Coordinator | Organization Tractis, Lot 01 |
| Ines Rahmani | PNT | Contractor Coordinator | Organization Pontis, Lot 02 |
| Yacine Belkacem | LAB | Engineer | Geotechnical tests authored by GeoLab |

Samir cannot see Pontis organization-class records. Ines cannot see Tractis organization-class records. Malik can review signalling assignments and cannot approve.

## Documents

Effective labels used below: **Current IFC**, **Current Approved**, **Current (info)**, **In review**, **Returned**, **Draft**, **Superseded** (only when the row is a historical revision, not the register row).

Register rows are documents. Revision detail is extra.

| Number | Title | Type | Disc. | Lot | Sec. | Rev | Label | Conf. |
|---|---|---|---|---|---|---|---|---|
| LNA-EVO-TRK-DWG-S05-00142 | Track alignment — Section 05 | Drawing | TRK | L03 | S05 | D | Current IFC | Project |
| LNA-EVO-TRK-DWG-S05-00143 | Track typical cross-section — Section 05 | Drawing | TRK | L03 | S05 | C | Current IFC | Project |
| LNA-EVO-TRK-DWG-S05-00188 | Platform drainage interface — Section 05 | Drawing | TRK | L03 | S05 | C | In review, overdue | Project |
| LNA-EVO-TRK-DWG-S05-00190 | Ballast profile — Section 05 | Drawing | TRK | L03 | S05 | B | In review | Project |
| LNA-EVO-CIV-DWG-S01-00011 | Corridor layout — Section 01 | Drawing | CIV | L01 | S01 | B | Current Approved | Project |
| LNA-EVO-CIV-DWG-S02-00022 | Corridor layout — Section 02 | Drawing | CIV | L01 | S02 | A | In review | Project |
| LNA-EVO-CIV-DWG-S03-00031 | Corridor layout — Section 03 | Drawing | CIV | L01 | S03 | A | Draft | Project |
| LNA-EVO-ERW-DWG-S01-00008 | Earthworks typical sections — Section 01 | Drawing | ERW | L01 | S01 | C | Current IFC | Project |
| LNA-EVO-STR-DWG-S04-00044 | Bridge BR-017 deck reinforcement | Drawing | STR | L02 | S04 | B | Returned | Project |
| LNA-PNT-STR-DWG-S04-00021 | Bridge BR-017 general arrangement | Drawing | STR | L02 | S04 | B | In review | Project |
| LNA-EVO-STR-DWG-S02-00018 | Culvert CV-017 general arrangement | Drawing | STR | L01 | S02 | A | Current IFC | Project |
| LNA-EVO-GEO-DWG-S01-00004 | Borehole location plan — Section 01 | Drawing | GEO | L01 | S01 | B | Current Approved | Project |
| LNA-EVO-HYD-DWG-S03-00012 | Drainage long section — Section 03 | Drawing | HYD | L01 | S03 | A | In review | Project |
| LNA-EVO-STA-DWG-S02-00009 | Khemis station platform plan | Drawing | STA | L01 | S02 | C | In review | Project |
| LNA-EVO-SIG-DWG-S04-00082 | Signalling schematic — Section 04 | Drawing | SIG | L02 | S04 | D | Current IFC | Project |
| LNA-EVO-TEL-DWG-S04-00015 | Telecom duct route — Section 04 | Drawing | TEL | L02 | S04 | A | In review | Project |
| LNA-EVO-ELE-DWG-S05-00027 | OCS layout — Section 05 | Drawing | ELE | L03 | S05 | B | Current Approved | Project |
| LNA-EVO-PWR-DWG-S02-00006 | Substation single line | Drawing | PWR | L01 | S02 | A | Draft | Discipline |
| LNA-EVO-SYS-DWG-S04-00003 | Systems architecture — Lot 02 | Drawing | SYS | L02 | S04 | B | In review | Project |
| LNA-EVO-ARC-DWG-S02-00002 | Khemis platform canopy | Drawing | ARC | L01 | S02 | A | Returned | Project |
| LNA-EVO-ENV-DWG-S01-00001 | Noise barrier locations — Section 01 | Drawing | ENV | L01 | S01 | A | Current (info) | Project |
| LNA-EVO-SAF-DWG-S05-00005 | Emergency access — Section 05 | Drawing | SAF | L03 | S05 | A | In review | Project |
| LNA-EVO-SUR-DWG-S03-00007 | Control survey — Section 03 | Drawing | SUR | L01 | S03 | D | Current Approved | Project |
| LNA-EVO-STR-CAL-S04-00017 | Bridge BR-017 calculation note | Calc note | STR | L02 | S04 | B | In review, client stage | Project |
| LNA-EVO-TRK-SPC-S05-00002 | Trackwork specification — Section 05 | Spec | TRK | L03 | S05 | C | Current IFC | Project |
| LNA-EVO-GEO-REP-S01-00003 | Geotechnical interpretive report — Section 01 | Report | GEO | L01 | S01 | A | Current Approved | Project |
| LNA-LAB-GEO-TST-S01-00011 | BH-14 laboratory summary | Test report | GEO | L01 | S01 | A | Current (info) | Project |
| LNA-EVO-SIG-MST-S04-00007 | Signalling installation method | Method | SIG | L02 | S04 | B | Current Approved | Project |
| LNA-TRC-GEN-MST-S01-00014 | Earthworks method statement — Lot 01 | Method | GEN | L01 | S01 | B | Current Approved | Organization |
| LNA-PNT-GEN-MST-S04-00009 | Bridge erection method — Lot 02 | Method | GEN | L02 | S04 | A | Draft | Organization |
| LNA-EVO-CIV-BOQ-S01-00001 | Lot 01 civil bill of quantities | BOQ | CIV | L01 | S01 | A | In review | Organization |
| LNA-EVO-GEN-SCH-S00-00004 | Design submission schedule | Schedule | GEN | — | — | C | Current (info) | Project |
| LNA-EVO-GEN-MIN-S00-00022 | Coordination minutes 18 Sep 2026 | Minutes | GEN | — | — | A | Current (info) | Project |
| LNA-EVO-STR-RPT-S04-00006 | Bridge BR-017 design report | Report | STR | L02 | S04 | A | In review | Project |
| LNA-EVO-TRK-NOT-S05-00008 | Alignment design note — Section 05 | Tech note | TRK | L03 | S05 | A | Current Approved | Project |
| LNA-EVO-HYD-CAL-S03-00002 | Hydraulic calculation — Section 03 | Calc note | HYD | L01 | S03 | A | Returned | Project |
| LNA-EVO-ELE-SPC-S05-00001 | OCS specification — Section 05 | Spec | ELE | L03 | S05 | B | In review | Project |
| LNA-EVO-SAF-PRO-S00-00002 | Design hazard procedure | Procedure | SAF | — | — | A | Current Approved | Project |
| CERT-C30-S01 | Concrete mix certificate C30 — Section 01 | Certificate | — | L01 | S01 | A | Current (info) | Project |
| LNA-EVO-SUR-REP-S05-00002 | Topographic report — Section 05 | Report | SUR | L03 | — | A | Current (info) | Project |

40 documents. `CERT-C30-S01` is a legacy number (`number_source = legacy`) and has no discipline. `LNA-EVO-SUR-REP-S05-00002` has no section. Both appear in the Missing Metadata view.

`LNA-EVO-CIV-BOQ-S01-00001` is organization-class for Evo Engineering. Contractors do not see it. The two method statements `00014` and `00009` are visible to their own contractor, the owner, the document controller, and the director.

### Revision chains that matter

**LNA-EVO-TRK-DWG-S05-00142** Track alignment — Section 05. Originator Evo Engineering. PK 18+400 to 27+150.

| Rev | Suitability at issue | Effective now | Date | Note |
|---|---|---|---|---|
| A | For Review | Superseded | 14 Apr 2026 | First issue |
| B | Approved | Superseded | 02 Jun 2026 | |
| C | Issued for Construction | Superseded | 11 Aug 2026 | Still inside TR-2026-00810 |
| D | Issued for Construction | Current | 26 Sep 2026 | Approved by Amina Kaci. Inside TR-2026-01012 |

Files are distinct checksums per revision. Rev D approval id `AP-00281`. Change reason on D: "Revised horizontal alignment between PK 22+180 and PK 23+040 after geotech addendum."

**LNA-EVO-TRK-DWG-S05-00188** Platform drainage interface.

| Rev | State on 28 Sep 2026 |
|---|---|
| A | Superseded, was For Review, 02 Aug 2026 |
| B | Superseded, Returned, 28 Aug 2026 |
| C | Under Review, For Review. Submitted 11 Sep 2026. Technical review period 14 days. Due 25 Sep 2026. Overdue by 3 days. Assignee Leila Cherif |

**LNA-EVO-SIG-DWG-S04-00082** Signalling schematic — Section 04.

| Rev | Effective now | Date |
|---|---|---|
| C | Superseded, was IFC | 04 Sep 2026 |
| D | Current IFC | 21 Sep 2026 |

`LNA-EVO-SIG-MST-S04-00007` Rev B **references** revision C of 00082. That link is intentional bad data for a later consistency check. V1 shows the link. It does not auto-fix it.

**LNA-EVO-STR-CAL-S04-00017** Rev B is in client review. Stage started 22 Sep 2026, period 14, due 6 Oct 2026. Assignee Amina Kaci. Related drawing `LNA-PNT-STR-DWG-S04-00021`. Not overdue.

**LNA-EVO-STR-DWG-S04-00044** Rev B Returned 24 Sep 2026. One open major comment from Hugo Lambert: "Shear link spacing at pier P2 does not match the calculation note Rev B." Comment id `CM-1044`.

## Transmittals

### TR-2026-00810 — frozen history

| Field | Value |
|---|---|
| Issued | 11 Aug 2026 |
| From | Evo Engineering |
| To | PMC Atlas, National Railway Authority |
| Purpose | For Construction |
| Status | Issued, both recipients acknowledged |
| Item | `LNA-EVO-TRK-DWG-S05-00142` Rev **C**, title snapshot `Track alignment — Section 05`, suitability snapshot Issued for Construction |

After Rev D exists, this item still says Rev C.

### TR-2026-01012 — current IFC issue

| Field | Value |
|---|---|
| Issued | 26 Sep 2026 10:19 |
| From | Evo Engineering |
| To | PMC Atlas, National Railway Authority, Pontis |
| Purpose | For Construction |
| Acknowledgements | PMC acknowledged 26 Sep. NRA acknowledged 27 Sep. Pontis pending |
| Items | 00142 Rev D; 00143 Rev C; `LNA-EVO-TRK-SPC-S05-00002` Rev C |

### TR-2026-00982 — awaiting acknowledgement

| Field | Value |
|---|---|
| Issued | 28 Sep 2026 |
| From | Evo Engineering |
| To | PMC Atlas |
| CC | National Railway Authority |
| Purpose | For Review |
| Acknowledgements | PMC pending. CC does not owe acknowledgement |
| Items | 00188 Rev C; 00190 Rev B; `LNA-EVO-HYD-DWG-S03-00012` Rev A; `LNA-EVO-STA-DWG-S02-00009` Rev C; `LNA-EVO-TEL-DWG-S04-00015` Rev A; `LNA-EVO-SYS-DWG-S04-00003` Rev B; `LNA-EVO-ELE-SPC-S05-00001` Rev B; `LNA-EVO-STR-RPT-S04-00006` Rev A |

Eight items. The package is immutable once issued. Prototype copy must not invent a 42-document package and then list eight.

## Correspondence

### NRA/IN/2026/0142

Incoming instruction. 20 Sep 2026. From NRA to Evo Engineering. Subject: Submit Bridge BR-017 calculation for client review. Response due 4 Oct 2026. Status: answered. Lot 02.

### EVO/OUT/2026/0881

Outgoing letter. 22 Sep 2026. From Evo Engineering to NRA. CC PMC Atlas. Subject: BR-017 calculation note Rev B submitted. `replies_to` NRA/IN/2026/0142. Links `LNA-EVO-STR-CAL-S04-00017` Rev B. Status: issued. Responsible: Nadia Ferhat.

## Audit excerpt for 00142 Rev D

```text
11 Aug 09:40 — Rev C approved IFC — Amina Kaci / NRA
11 Aug 09:41 — Rev B marked superseded
11 Aug 11:05 — TR-2026-00810 issued — Sara Mehdi / Evo Engineering
26 Sep 09:10 — Rev D uploaded — Omar Boudiaf / Evo Engineering
26 Sep 09:18 — Rev D submitted — Omar Boudiaf / Evo Engineering
26 Sep 10:14 — Rev D approved IFC — Amina Kaci / NRA — decision AP-00281
26 Sep 10:17 — Rev C marked superseded
26 Sep 10:19 — TR-2026-01012 issued — Sara Mehdi / Evo Engineering
```

Metadata edit example, separate document: on 27 Sep Sara Mehdi set discipline of nothing on `CERT-C30-S01` (left empty) after import. The import audit stores before `discipline: null` and after `discipline: null`, with reason `Legacy MDR row imported without discipline`.

## Counts for the command center

Derived from the table. "Current approved" includes Current Approved, Current IFC, and Current (info).

| Indicator | Value |
|---|---|
| Controlled documents | 40 |
| Current (approved, IFC, or information) | 21 |
| Of which Issued for Construction | 6 |
| In review | 13 |
| Overdue reviews | 1 (`00188` Rev C, due 25 Sep) |
| Returned | 3 (deck `00044`, canopy `00002`, hydraulic calc `00002`) |
| Drafts | 3 (corridor `S03-00031`, substation `00006`, Pontis method `00009`) |
| Transmittals issued this week (24–28 Sep) | 2 (`01012`, `00982`) |
| Outstanding acknowledgements | 2 (PMC on `00982`, Pontis on `01012`) |
| Revisions received this week | `00142` Rev D on 26 Sep |

In review: `00188`, `00190`, corridor `S02-00022`, Pontis `00021`, drainage long section, Khemis station, telecom duct, systems architecture, emergency access, calc `00017`, BR-017 design report, OCS spec, civil BOQ.

Issued for construction among the current set: `00142` D, `00143` C, earthworks `00008` C, culvert `00018` A, signalling `00082` D, trackwork spec `00002` C.

## Attention feed (exact sentences)

- Track drawing `LNA-EVO-TRK-DWG-S05-00188` Rev C is 3 days overdue for technical review. Due 25 Sep 2026. Assignee Leila Cherif.
- Transmittal `TR-2026-00982` has 8 documents waiting for acknowledgement from PMC Atlas.
- `LNA-EVO-SIG-DWG-S04-00082` Rev C was superseded by Rev D. Method statement `LNA-EVO-SIG-MST-S04-00007` still references Rev C.
- `LNA-EVO-TRK-DWG-S05-00142` Rev D is the current IFC. Transmittal `TR-2026-00810` still contains Rev C.
- 2 documents are missing mandatory metadata: `CERT-C30-S01` (discipline), `LNA-EVO-SUR-REP-S05-00002` (section).

## Saved views

| View | Filter |
|---|---|
| My Reviews | Assigned to the signed-in person, stage open |
| Overdue Reviews | Due before 28 Sep 2026, stage open. One row: 00188 |
| Track — IFC | Discipline TRK, suitability IFC, effective Current. Rows: 00142, 00143, trackwork spec |
| Missing Metadata | Legacy certificate and survey report |
| Lot 03 | Section S05 / lot L03 |
| Returned for Revision | Workflow Returned. Three rows |

## Permission spot checks

- Ines Rahmani searches `earthworks method`. No hit for `LNA-TRC-GEN-MST-S01-00014`. She may see `LNA-EVO-ERW-DWG-S01-00008` because it is project-class.
- Samir Taleb does not see `LNA-PNT-GEN-MST-S04-00009` or the Pontis general arrangement if that drawing is project-class he **does** see it. `00021` is project-class, so Samir can view it. He cannot see `00009`.
- Malik Cherbi does not get an approve action on 00082.
- A Viewer account is not in the seed. Download checks use a role fixture later, not a fake person.
