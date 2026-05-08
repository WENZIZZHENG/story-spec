## ADDED Requirements

### Requirement: Keep the multiuser control plane separate from the local workbench
StorySpec MUST define a separate multiuser control plane and MUST keep `storyspec app` as the local single-user workbench entrypoint.

#### Scenario: local app stays single-user
- **GIVEN** the local `storyspec app` workbench is started
- **WHEN** a user opens the local workbench
- **THEN** it MUST remain a single-user local session
- **AND** it MUST NOT require multi-user authentication, database tenancy, or cloud deployment to keep working

#### Scenario: multiuser work starts from a separate baseline
- **GIVEN** a developer starts the multiuser roadmap
- **WHEN** they follow this change
- **THEN** they MUST start from a distinct control plane baseline
- **AND** they MUST treat the local workbench as a separate single-user surface

### Requirement: Enforce user and project authorization on all multiuser project access
StorySpec MUST require `userId + projectId` authorization for every multiuser project read or write and MUST normalize project storage paths.

#### Scenario: path-only access is rejected
- **GIVEN** a request includes only a filesystem path
- **WHEN** the multiuser server evaluates the request
- **THEN** it MUST reject the request
- **AND** it MUST require an authorized `userId + projectId` context

#### Scenario: unauthorized project access is rejected
- **GIVEN** a user is not a member of the requested project
- **WHEN** the user attempts to read or write the project
- **THEN** the request MUST fail
- **AND** the server MUST not expose project data

### Requirement: Route long-running work through an explicit runtime adapter and job state machine
StorySpec MUST execute multiuser agent work through `AgentRuntimeAdapter` and MUST expose a tracked `AgentJob` lifecycle.

#### Scenario: same job can run through different runtimes
- **GIVEN** a multiuser job is created
- **WHEN** the platform routes it to a runtime
- **THEN** the job MUST be able to run through `LocalStorySpecRunner`
- **AND** the same job interface MUST later support `OpenHandsRunner`

#### Scenario: job lifecycle is observable
- **GIVEN** a job is queued
- **WHEN** it progresses through execution
- **THEN** the platform MUST represent it with `queued`, `running`, `succeeded`, `failed`, `canceled`, or `timeout`

### Requirement: Preserve preview, confirm, and apply boundaries in the multiuser platform
StorySpec MUST keep candidate, preview, confirm, and apply boundaries in the multiuser platform and MUST not auto-apply generated content.

#### Scenario: generated content remains gated
- **GIVEN** a runtime produces candidate content
- **WHEN** the job completes
- **THEN** the result MUST remain candidate or preview by default
- **AND** it MUST NOT write formal正文、tracking、canon or tasks without an explicit confirmation step

#### Scenario: high-risk write actions remain auditable
- **GIVEN** a write action is confirmed
- **WHEN** the platform records the change
- **THEN** it MUST preserve the source, actor, project, and diff summary
- **AND** it MUST link the write to the originating job

### Requirement: Record audit and quota boundaries for multiuser work
StorySpec MUST record audit events and MUST enforce user or project quota boundaries for multiuser actions.

#### Scenario: every confirmed write produces an audit record
- **GIVEN** a multiuser write is confirmed
- **WHEN** the write is applied
- **THEN** the platform MUST record an audit event with actor, project, source, and timestamp

#### Scenario: over-limit work is blocked consistently
- **GIVEN** a user or project exceeds quota
- **WHEN** the platform evaluates a new request or job
- **THEN** it MUST block the action with a consistent refusal state
- **AND** it MUST expose a readable reason for the block
