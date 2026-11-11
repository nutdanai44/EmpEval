# EmpEval architecture

## Current modules

- `src/app-v1.2.tsx` — application composition and legacy feature screens (being decomposed incrementally).
- `src/components/AppErrorBoundary.tsx` — reusable React error boundary.
- `src/domain/booking.ts` — pure booking allocation, billability, overlap and status calculations. No React or Google API dependencies.
- `src/domain/schema-v1.2.ts` — workbook sheet names and column contracts.
- `src/domain/workbook-v1.2.ts` — workbook validation and serialization.
- `src/domain/sheets-v1.2.ts` — load/save workbook through a supplied transport.
- `src/integrations/google-auth.ts` — Google OAuth session and authenticated HTTP transport.
- `src/style.css` — legacy global styles.

## Dependency direction

```text
UI / feature components
    -> domain (pure data and rules)
    -> integration adapter (Google OAuth / Sheets API)
```

Domain modules should not import React, browser globals, or integration modules. Feature components should not implement OAuth or workbook transport logic. Keep sheet data contracts compatible with existing Google Sheets.

## Next extraction milestones

1. Split Employees into directory, profile, metrics, bookings, and career-growth components.
2. Split Q-Pref Settings into MetricCatalog, MetricAxesEditor, and EvaluationPeriods.
3. Extract shared editable tables and field controls with typed props and callbacks.
4. Extract workbook state and sync status into a dedicated hook/context; avoid introducing a second source of truth.
5. Migrate global styles to feature-scoped CSS modules and add focused unit/component tests.

## Quality gates

Run `npm run build` and relevant tests after each extraction. Prefer small changes that preserve existing user flows and Google Sheets schemas. Refactoring is not complete until feature screens have been extracted from the legacy app file.
