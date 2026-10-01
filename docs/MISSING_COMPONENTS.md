# Missing UI components

These capabilities are documented instead of being replaced by large speculative custom systems.

| Component | Required capability | Screens | Current fallback | Suggested next source |
|---|---|---|---|---|
| Niko Table / TanStack Table | Pinning, visibility, selection, server register state, virtualization | Documents, Reviews, Approvals, Audit, Members | `EvoDataTable` now uses TanStack feature state; Niko remains source-only | Add only narrowly-scoped source patterns when needed |
| OpenStatus filter builder | Field/operator/value builder and faceted URL serialization | Documents, workflow queues, transmissions | `EvoFilterBuilder`, chips, and deterministic URL serializer | Extend schema fields as contracts mature |
| Elsecase | Canonical async/empty/offline/permission visual language | All API-backed screens | `EvoAsyncState` covers the Phase 2 state vocabulary | Preserve wrapper API |
| ReUI timeline/stepper | Workflow timeline and composer stepper | Details, transmission composer | `EvoTimeline`; composer remains ordered sections | Add stepper only with a real multi-step contract |
| Extend UI PDF Viewer | PDF pages, zoom, fit, fullscreen | Revision/document viewer | Lazy `EvoPdfViewer` foundation; protected preview compatibility path remains | Switch protected preview after worker/browser policy QA |
| Sonner | Application notification queue | Mutation feedback | `EvoToaster` + `evoToast` for recoverable results | Keep critical errors inline |
| dashboardcn / EvilCharts | Operational analytics charts | Overview, Analytics | Existing counts and tables | Add only after analytics API contract is stable |
| Lucide | Single icon system | Shell and all screens | Adopted for new wrappers; Heroicons remain for existing domain screens | Migrate icons opportunistically behind wrapper boundaries |
