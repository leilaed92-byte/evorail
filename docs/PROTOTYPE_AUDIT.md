# Prototype audit

Date: 28 Sep 2026. Set: `prototypes/` against the twelve screens in [SCREEN_INVENTORY.md](SCREEN_INVENTORY.md) and the Line A seed.

## What a reviewer can do

- See Line A counts 40 / 21 current / 6 IFC / 13 in review / 1 overdue / 3 returned.
- Open 00142 Rev D labeled Current and IFC, switch to Rev C, read a superseded banner, and return to Rev D.
- See TR-2026-00810 still naming Rev C from history and from the transmittal register.
- Open the overdue review of 00188 as Leila Cherif and record only revise-and-resubmit or information-only.
- Start Rev E with a written rule that Rev D stays current IFC.
- Build a two-revision transmittal and read the freeze warning.
- Reach 00188 from the command center and from My Work.

## Defects to fix before these screens are copied into the app

1. The register does not list all 40 documents or all 23 drawings. The rest are named in the seed file. A controller cannot scan the full population in the prototype.
2. Saved-view chips are links to other pages, not filters on the same table. Bulk checkboxes do not run an action.
3. The PDF pane is a static page, not PDF.js. Thumbnails do not change the page.
4. Create-transmittal issue and new-revision submit do not add records. They navigate back so the current revision stays put.
5. Command palette, keyboard row movement, column resize, and a real side sheet that follows the selected row are not built. The MDR sheet is fixed on 00142.
6. The signalling stale reference (method statement to 00082 Rev C) is a sentence on the overview, not its own history page.
7. Correspondence is a paragraph on the calculation-note page, not a register.
8. There is no Pontis-signed-in variant, so contractor isolation is described on the organizations page and not demonstrated by a second session.
9. Reports is absent, which matches the prototype cut, and the sidebar does not yet show Project Settings.

None of these contradict the domain rules. They are prototype gaps. Phase E should not treat the abbreviated register as the column or filter specification. The seed file remains the population.
