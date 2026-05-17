# Worker 告警摘要读接口设计

## Source Boundaries

- Runtime source: `src/server/workers/worker-reliability.ts`, `src/server/http/multiuser-server.ts`.
- Tests: `tests/unit/multiuser-worker-reliability.test.ts`, `tests/unit/multiuser-server.test.ts`.
- Generated output: `dist/**` is produced by `npm run build` and must not be edited by hand.

## Read Model

`buildWorkerAlertSummary()` receives a project id, jobs, worker failure records, and queue readiness/snapshot. It returns counts plus alert items. Failed/timeout jobs without failure records still produce job-status alerts. Failure records produce retryable or dead-letter alerts. Queue not configured/connected/worker unavailable produces infrastructure alerts.

## HTTP Boundary

`GET /api/projects/:projectId/jobs/alerts` reuses session and project guard. It returns an empty alert list when no failure repository is configured, but still reports queue readiness and failed job status alerts from the job repository.

## Author Control

The endpoint is strictly read-only. Recommended actions may point to existing retry/log inspection paths, but the endpoint must not retry, enqueue, cancel, mutate files, or apply story content.
