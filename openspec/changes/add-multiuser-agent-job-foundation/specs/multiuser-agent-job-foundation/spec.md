## ADDED Requirements

### Requirement: Multiuser AgentJob foundation MUST create idempotent jobs
StorySpec MUST provide a reusable AgentJob model and creation service with idempotency support.

#### Scenario: new job is queued
- **WHEN** a user creates an agent job for a project
- **THEN** the job MUST start in `queued`
- **AND** it MUST include userId, projectId, kind, runtime, attempt, createdAt, and updatedAt

#### Scenario: matching idempotency key reuses active job
- **GIVEN** an active job with the same user, project, and idempotency key
- **WHEN** the same job is created again
- **THEN** the existing job MUST be returned

### Requirement: Multiuser AgentJob foundation MUST enforce lifecycle transitions
StorySpec MUST reject invalid AgentJob status transitions.

#### Scenario: job succeeds after running
- **GIVEN** a queued job
- **WHEN** it transitions to running and then succeeded
- **THEN** the final status MUST be `succeeded`

#### Scenario: invalid transition is rejected
- **GIVEN** a queued job
- **WHEN** it transitions directly to succeeded
- **THEN** the transition MUST be rejected

### Requirement: Multiuser AgentJob foundation MUST support cancel and retry
StorySpec MUST support canceling active jobs and retrying failed or timed out jobs.

#### Scenario: active job is canceled
- **GIVEN** a queued job
- **WHEN** it is canceled
- **THEN** the status MUST be `canceled`

#### Scenario: failed job is retried
- **GIVEN** a failed job
- **WHEN** it is retried
- **THEN** the retry MUST create a queued job with a higher attempt number
