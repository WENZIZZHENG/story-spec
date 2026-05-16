## ADDED Requirements

### Requirement: Worker reliability MUST expose a read-only alert summary
StorySpec MUST provide a worker alert summary read model derived from jobs, queue readiness, and worker failure records.

#### Scenario: retryable and dead-letter failures are summarized
- **GIVEN** a project has worker failure records
- **WHEN** the worker alert summary is built
- **THEN** it MUST include retryable and dead-letter counts
- **AND** it MUST include alert items with severity, category, job id, failure id, reason, and recommended action.

#### Scenario: queue readiness creates infrastructure alerts
- **GIVEN** a queue is not configured, disconnected, or lacks a worker
- **WHEN** the worker alert summary is built
- **THEN** it MUST include an infrastructure alert
- **AND** it MUST NOT enqueue, retry, cancel, or execute any job.

### Requirement: Multiuser server MUST expose project worker alerts read API
StorySpec multiuser server MUST expose a project-scoped worker alerts endpoint.

#### Scenario: project member reads worker alerts
- **GIVEN** a project member has access to a project
- **WHEN** they request `GET /api/projects/:projectId/jobs/alerts`
- **THEN** the server MUST return the worker alert summary for that project
- **AND** the request MUST be read-only and leave jobs, queue, and failure records unchanged.

#### Scenario: unauthenticated request is rejected
- **WHEN** a request lacks a valid session
- **THEN** the endpoint MUST return the existing auth error envelope.
