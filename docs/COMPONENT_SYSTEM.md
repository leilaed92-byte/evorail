# EvoRail component system

This document records the frontend component contract for the UI/UX rebuild. Domain behavior and API contracts remain in Laravel; these wrappers only standardize rendering, interaction density, and fail-closed states.

## Current foundation

| Component | OSS source / basis | License | EvoRail wrapper | Screens | Accessibility notes |
|---|---|---|---|---|---|
| Buttons, cards, badges | Existing `@astryxdesign/core` foundation | MIT | `EvoStatusBadge`, `EvoDetailPanel` | All current registers and details | Existing semantic buttons and headings retained |
| Data tables | TanStack Table v9, adapted behind a local wrapper | MIT | `EvoDataTable` and data-table modules | Documents reference register, transmissions | Semantic table, keyboard controls, selection labels, explicit states |
| Async states | Elsecase state model, adapted locally | Source pattern only | `EvoAsyncState` | Auth, project, registers, details | Covers loading, refreshing, empty, no-results, unavailable, not-found, validation, permission, and generic error |
| Filters | OpenStatus filter-builder model, adapted locally | Source pattern only | `EvoFilterBuilder`, `EvoFilterChip`, URL serializer, `EvoFilterBar` | Documents and workflow queues | Field/operator/value controls and removable chips |
| Status | ReUI/status vocabulary, adapted locally | Source pattern only | `EvoStatusBadge`, `EvoRevisionBadge` | Workflow, approval, transmission, revision surfaces | Text labels remain present; color is supplemental |
| Activity | ReUI timeline model, adapted locally | Source pattern only | `EvoTimeline` | Detail/activity surfaces | Ordered semantic content with visible dates |
| Detail surfaces | shadcn Sheet/Panel interaction model, adapted locally | Not installed; verify before adoption | `EvoDetailPanel` | Master/detail registers and composer | Heading hierarchy and action grouping preserved |
| Notifications | Sonner | MIT | `EvoToaster`, `evoToast` | Recoverable mutation feedback | Non-critical toast only; critical states remain inline |
| Icons | Lucide React | ISC | New wrapper affordances; legacy Heroicons remain | Table sorting and new components | Icon-only controls retain accessible labels |
| PDF | react-pdf + pdfjs-dist | MIT / Apache-2.0 | `EvoPdfViewer` | Lazy protected PDF foundation | Page controls, status/error states, Blob URL cleanup |

## Rules

- Domain pages consume wrappers rather than styling third-party primitives directly.
- Tables are controlled data registers: server pagination/sort/filter and exact record links remain authoritative.
- Async states never render bundled sample records when the API fails, is forbidden, or is unavailable.
- Issued transmission details use `EvoReadOnlyBanner`; exact revision identity is always visible.
- New wrappers must document their source basis, license, screens, and accessibility behavior here.

## Dependency note

Phase 2 adds only `@tanstack/react-table`, `lucide-react`, `sonner`, `react-pdf`, and its direct `pdfjs-dist` worker dependency. Niko, OpenStatus, ReUI, and Elsecase remain source-pattern references rather than runtime packages. See [OSS_COMPONENT_MIGRATION_PHASE2.md](OSS_COMPONENT_MIGRATION_PHASE2.md).
