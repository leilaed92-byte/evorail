# EvoRail OSS component migration — Phase 2

Status: implementation complete pending the final backend, MCP, browser, and responsive verification pass.

## Adopted

- `@tanstack/react-table` 9.2.4, MIT: headless table state for `EvoDataTable` with selection, sorting, pagination, sizing, pinning, and visibility feature hooks.
- `lucide-react` 1.49.0, ISC: new table sort indicators and wrapper-level icon migration.
- `sonner` 2.0.8, MIT: recoverable mutation feedback through `EvoToaster` / `evoToast`; critical errors remain inline.
- `react-pdf` 11.0.0 plus `pdfjs-dist` 6.3.289, MIT / Apache-2.0: lazy PDF viewer foundation with protected Blob/object-URL cleanup.

## Evaluated and not added

- Niko Table: useful source-copy patterns around TanStack registries, but no runtime dependency added; EvoRail keeps its wrapper contract.
- OpenStatus filter builder: field/operator/value model adapted locally to preserve EvoRail URL/API semantics.
- ReUI: timeline/status/stepper patterns adapted locally; no package dependency.
- Elsecase: async-state vocabulary adapted locally; no package dependency.
- Charts, form frameworks, and broad icon replacement: deferred until their API/data contracts or migration scope is explicit.

## Architecture decisions

Domain screens consume `src/components/evorail` wrappers. OSS packages stay behind those wrappers. Documents is the reference register: selection, server-owned data, loading/error/empty states, compact density, and stable URL state are preserved. No Laravel, API, authentication, or M6 behavior is changed.

## Bundle and lazy loading

The initial Vite entry moved from approximately 824.76 kB minified / 238.15 kB gzip before Phase 2 to approximately 586.22 kB / 177.36 kB after Phase 2. M4 and M5 are route-lazy chunks; the PDF viewer and PDF.js are isolated in a separate lazy chunk.

## Known gaps

The existing protected preview keeps its compatibility iframe/image implementation while the new PDF viewer foundation is introduced behind a stable wrapper. A follow-up can switch that surface once browser PDF worker behavior is accepted in the product’s protected-file policy.
