## ADDED Requirements

### Requirement: Agent jobs MUST be enqueued after control-plane creation
StorySpec MUST enqueue newly created multiuser AgentJobs through a queue boundary when a queue is configured.

#### Scenario: server creates a new queued job
- **WHEN** an authenticated project member creates an AgentJob through the server API
- **THEN** the server MUST persist the job as `queued`
- **AND** it MUST enqueue a payload containing the job identity and runtime metadata
- **AND** `/ready` MUST expose the queue configured and connected state.

#### Scenario: idempotency reuses an active job
- **WHEN** a job creation request reuses an active idempotency key
- **THEN** the server MUST return the existing job
- **AND** it MUST NOT enqueue a duplicate payload.

### Requirement: Worker MUST execute queued jobs through registered runtimes
StorySpec MUST provide a worker runner that consumes queue payloads and executes only queued jobs through registered `AgentRuntimeAdapter` instances.

#### Scenario: worker consumes a queued job
- **GIVEN** a queued AgentJob and a registered runtime
- **WHEN** the worker consumes the queue payload
- **THEN** the job MUST transition through `running` to `succeeded`
- **AND** the worker result MUST include preview-only runtime output
- **AND** no formal story, chapter, canon, or tracking file MUST be applied automatically.

#### Scenario: job was canceled before execution
- **GIVEN** an AgentJob that was canceled after enqueue
- **WHEN** the worker consumes the payload
- **THEN** the worker MUST acknowledge the queue item
- **AND** it MUST NOT start the runtime.

#### Scenario: runtime fails while executing a job
- **GIVEN** a queued AgentJob and a registered runtime that throws
- **WHEN** the worker consumes the payload
- **THEN** the job MUST be marked `failed`
- **AND** the queue item MUST be recorded as failed
- **AND** no formal story, chapter, canon, or tracking file MUST be applied automatically.

### Requirement: StorySpec MUST provide a standalone worker command
StorySpec MUST provide a CLI command for running the multiuser worker separately from the HTTP server.

#### Scenario: worker command is configured
- **WHEN** `storyspec worker` starts with database and Redis configuration
- **THEN** it MUST create PostgreSQL-backed repositories
- **AND** it MUST create a Redis-backed queue adapter
- **AND** it MUST run the worker loop without starting the HTTP server.
