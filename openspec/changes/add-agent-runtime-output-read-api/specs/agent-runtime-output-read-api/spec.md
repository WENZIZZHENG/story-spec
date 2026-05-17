## ADDED Requirements

### Requirement: Runtime output records MUST be readable through project-scoped API
StorySpec MUST expose a project-scoped read-only API for job runtime output records.

#### Scenario: project member reads job output
- **GIVEN** an authenticated project member
- **WHEN** they request `GET /api/projects/:projectId/jobs/:jobId/output`
- **THEN** StorySpec MUST return the job id, project id, and preview-only runtime output records.

#### Scenario: job belongs to another project
- **WHEN** the requested job does not belong to the guarded project
- **THEN** StorySpec MUST reject the request with the existing job/project guard behavior.

#### Scenario: output read is non-mutating
- **WHEN** output records are read
- **THEN** StorySpec MUST NOT create, retry, cancel, execute, apply, or enqueue any job.
