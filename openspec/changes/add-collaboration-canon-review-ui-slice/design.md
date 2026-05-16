# 协作正典审阅 UI 首批切片设计

## Source Boundaries

- Runtime source: `src/app-server/app-frontend-architecture.ts`, `src/app-server/local-app-html.ts`.
- Tests: `tests/unit/app-frontend-architecture.test.ts`, `tests/unit/local-app-html.test.ts`.
- Existing server endpoints stay in `src/server/http/multiuser-server.ts`; this change does not add mutation behavior.

## Contract First

The local shell should not hard-code future frontend assumptions in prose only. `app-frontend-architecture.ts` exposes a `collaborationCanonReview` section with stable columns, endpoint ids, user actions, empty state, and write boundary language. The HTML renders that contract so future web clients can share the same page shape.

## UI Boundary

The UI slice is an "审阅台" rather than a complete collaboration product. It can show which endpoints and statuses exist, but local `storyspec app` does not authenticate against `storyspec server` or execute multiuser mutations. Apply and rollback entries must be labeled as requiring `apply-canon-change` permission and author confirmation.

## Author Control

Proposal comments, reviews, patches, apply requests, apply execution and rollback remain auditable server operations. The shell must preserve the distinction between candidate/proposal, review/comment, ready apply request, applied state, and rolled-back state.
