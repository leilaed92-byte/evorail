# INFRASOFT

## EvoRail V2 — Implementation handoff

_Ingénierie infrastructure ferroviaire_<br>
Document-control workspace for the National Railway Programme · Line A

**Reference brand:** [infrasoft.dz](https://www.infrasoft.dz/)<br>
**Prepared:** 28 September 2026<br>
**Status:** V2 UI foundation implemented

---

## What is done

### Application shell

- Rebuilt the application shell in React/Vite using Astryx components.
- Added a collapsible and resizable SideNav.
- Added TopNav with:
  - Infrasoft/EvoRail product identity
  - current project context: `Ligne A · LNA`
  - global document search
  - Ctrl/Cmd+K discovery hint
  - notifications, help, theme control, and account entry points
- Organized navigation into `PROJECT` and `MANAGEMENT` groups.
- Added active navigation states and responsive shell behavior.

### Authentication

- Added a compact enterprise sign-in experience.
- Added work email and password fields.
- Added password visibility control.
- Added forgot-password affordance.
- Added loading and validation error states.
- Added SSO, Google, and Microsoft entry points.
- Removed consumer-style signup language and replaced it with administrator-controlled access messaging.

### Overview

- Replaced oversized dashboard cards with a compact project summary strip.
- Added Line A project context and client metadata.
- Added workflow navigation for:
  - Tous
  - En revue
  - Retournés
  - Brouillons
  - Actuels
  - IFC
- Made the document work queue the primary overview surface.
- Added a focused overdue-document attention panel.

### Documents register

- Added a dense enterprise document table.
- Added document search.
- Added status filter chips.
- Added row selection and bulk-action presentation.
- Added pagination controls.
- Added column visibility and export entry points.
- Added document actions through Astryx More Menu.
- Added compact document codes, revisions, statuses, owners, due dates, and modification dates.

### Document detail

- Added document breadcrumbs.
- Added revision and status context.
- Added Download, Share, Submit review, and More actions.
- Added Overview, Versions, Reviews, Comments, Transmittals, and History tabs.
- Added document preview placeholder, recent activity, control status, responsibility, dates, revision, and permissions metadata.

### Interaction and theming

- Added Astryx Command Palette.
- Added Ctrl/Cmd+K keyboard discovery.
- Added light and dark theme modes.
- Added responsive layouts for narrower screens.
- Added hover, focus, selected, loading, empty, and error presentation states.
- Added accessible labels to icon-only controls, navigation, tables, filters, and form fields.

---

## Infrasoft brand alignment

The public Infrasoft site presents the company as a multidisciplinary engineering office focused on infrastructure and railway engineering. The V2 handoff keeps the product tone technical, controlled, and project-oriented rather than consumer SaaS-oriented.

### Brand cues captured

| Brand cue | Direction for EvoRail V2 |
| --- | --- |
| Primary accent | Infrasoft red: `#E74C3C` |
| Base surfaces | White and warm neutral surfaces with restrained borders |
| Navigation | Clear, horizontal information architecture with strong active states |
| Imagery direction | Railway, construction, infrastructure, and project-delivery context |
| Typography tone | Humanist sans-serif body text; compact technical labels and metadata |
| Voice | Professional, direct, engineering-led, and operational |
| Section treatment | Uppercase labels, concise section headings, functional grouping |
| Content language | French-first terminology where it matches the project workflow |

### Recommended branded token layer

```css
:root {
  --infrasoft-red: #e74c3c;
  --infrasoft-red-dark: #c0392b;
  --infrasoft-ink: #2f3437;
  --infrasoft-muted: #6b7276;
  --infrasoft-surface: #ffffff;
  --infrasoft-background: #f5f6f4;
  --infrasoft-border: #dfe3e1;
}
```

Use the red accent for active navigation, primary actions, important links, and urgent engineering status only. Keep workflow statuses semantically distinct from brand color wherever possible.

---

## Preview routes

- `/signin` — enterprise authentication
- `/overview` — Line A overview and work queue
- `/documents` — controlled document register
- `/documents/LNA-EVO-TRK-DWG-S05-00188` — document detail
- `/drawings` — register-based drawings view

Local preview:

```text
http://127.0.0.1:5173/overview
```

Demo sign-in values:

```text
Email:    sara.mehdi@evorail.example
Password: Demo-Preview-2026!
```

The current preview only checks that both fields are populated. It is not connected to production authentication.

---

## Astryx implementation

The UI uses the Astryx design system as the component source of truth, including:

- `AppShell`
- `TopNav`
- `SideNav`
- `Table`
- `CommandPalette`
- `SegmentedControl`
- `TabList`
- `Button`
- `IconButton`
- `TextInput`
- `CheckboxInput`
- `Badge`
- `StatusDot`
- `Avatar`
- `Card`
- `MoreMenu`

The shell scaffold was generated from the Astryx `shell-side-nav` template and adapted for the EvoRail document-control workflow.

---

## Known gaps

- Authentication is still presentation-only.
- Document data is currently seed data.
- Upload, export, SSO, sharing, and permission actions are UI entry points only.
- Reviews, transmittals, comments, issues, reports, and organizations need backend-connected pages.
- Production revision, suitability, effective-state, permission, and audit rules must remain server-authoritative.

---

## Next gate

Connect the V2 shell and document surfaces to the Laravel/API backend, then replace seed records with authorized project, document, revision, review, transmittal, and audit data.

The next visual gate should confirm the Infrasoft red accent against the actual product logo, approved typeface, and any official brand guidelines supplied by the organization.
