## ADDED Requirements

### Requirement: Multiuser job API MUST enforce configured job quota
StorySpec MUST check configured user and project job quota before creating a multiuser AgentJob.

#### Scenario: configured quota blocks job creation
- **GIVEN** a project or user job quota bucket is exhausted
- **WHEN** a project member posts a job request
- **THEN** the server MUST return a quota error
- **AND** no new job MUST be created

#### Scenario: configured quota is consumed for created job
- **GIVEN** configured project and user job quota buckets have remaining capacity
- **WHEN** a project member posts a job request
- **THEN** the server MUST create the queued job
- **AND** the project and user job quota usage MUST increase by one

### Requirement: Multiuser job API MUST audit control-plane mutations
StorySpec MUST record audit events for successful job control-plane mutations.

#### Scenario: job creation is audited
- **WHEN** a project member creates a job
- **THEN** the audit log MUST include actorUserId, projectId, action, source, jobId, and createdAt

#### Scenario: job cancel and retry are audited
- **WHEN** a project member cancels or retries a job
- **THEN** the audit log MUST include an event bound to the affected job and project
