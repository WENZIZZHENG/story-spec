# 完整 App 故事驾驶舱首批切片设计

## Source Boundaries

- Runtime source: `src/app-server/app-state-contract.ts`, `src/app-server/local-app-server.ts`, `src/app-server/local-app-http-server.ts`, `src/app-server/local-app-html.ts`.
- Tests: `tests/unit/app-state-contract.test.ts`, `tests/unit/local-app-server.test.ts`, `tests/unit/local-app-http-server.test.ts`, `tests/unit/local-app-html.test.ts`.
- Generated output: `dist/**` is produced by `npm run build` and must not be edited by hand.

## Contract First

The App shell must not infer story status by scraping DOM copy. `app-state-contract.ts` maps `ProjectStatus` into a stable UI state with page definitions, cockpit metrics, role capabilities, status language, empty states, and Preview / Confirm / Apply boundaries.

## UI Boundary

The HTML shell remains a zero-dependency local workbench in this slice. It uses the new state endpoint and presents the agreed first-version surfaces, but it does not claim full cloud collaboration.

## Author Control

High-impact story changes continue to route through candidate, preview, dry-run, and apply language. The UI may surface actions that jump to existing APIs, but it must not add silent canonical writes.
