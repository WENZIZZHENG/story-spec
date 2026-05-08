## ADDED Requirements

### Requirement: Multiuser runtime adapter MUST execute jobs through a preview-only interface
StorySpec MUST provide a runtime adapter boundary for multiuser AgentJob execution without allowing automatic apply.

#### Scenario: local runtime completes a queued job
- **GIVEN** a queued AgentJob
- **WHEN** the local runtime adapter starts it successfully
- **THEN** the job MUST transition through running to succeeded
- **AND** the runtime result MUST be preview-only

#### Scenario: runtime failure is reflected on the job
- **GIVEN** a queued AgentJob
- **WHEN** the runtime adapter fails
- **THEN** the job MUST be marked failed with a runtime error summary

### Requirement: OpenHands runner MUST remain a bounded PoC adapter
StorySpec MUST expose an OpenHands runner adapter that describes a headless execution plan without directly applying outputs.

#### Scenario: OpenHands runner creates a safe plan
- **WHEN** the platform prepares an OpenHands job
- **THEN** the plan MUST include workspace, prompt, command, and autoApply=false
- **AND** runtime result MUST remain preview-only

### Requirement: Multiuser App APIs MUST expose project, member, and job lists behind guards
StorySpec MUST provide control-plane APIs for the App to show accessible projects, project members, and project jobs.

#### Scenario: user lists accessible projects
- **WHEN** an authenticated user requests `/api/projects`
- **THEN** the server MUST return only projects visible to that user

#### Scenario: member and job lists require project membership
- **WHEN** a project member requests members or jobs for a project
- **THEN** the server MUST return the project-scoped list
- **AND** non-members MUST be denied

### Requirement: Multiuser server MUST expose readiness and traceable errors
StorySpec MUST expose readiness metadata and retain request/job trace identifiers for troubleshooting.

#### Scenario: readiness is queried
- **WHEN** the server readiness endpoint is queried
- **THEN** it MUST report service, version, repositories, and runtime status

#### Scenario: trace id is attached to errors when available
- **WHEN** a server error is created with a trace id
- **THEN** the response MUST include the trace id without removing request id
