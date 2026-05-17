## ADDED Requirements

### Requirement: Task center UI contract MUST expose runtime output as read-only preview
StorySpec MUST expose runtime output artifacts and logs in the complete App task center contract as read-only preview content.

#### Scenario: frontend contract includes runtime output endpoint
- **WHEN** the complete App frontend architecture is built
- **THEN** it MUST include `GET /api/projects/:projectId/jobs/:jobId/output` as a task center read-only endpoint
- **AND** the task center route MUST list that endpoint as a primary endpoint.

#### Scenario: runtime output UI contract describes preview-only panes
- **WHEN** the task center UI renders runtime output
- **THEN** it MUST distinguish artifacts and logs
- **AND** it MUST describe the output as preview-only content that does not apply to canon or story files.

#### Scenario: runtime output UI is non-mutating
- **WHEN** a user views runtime output in the task center
- **THEN** StorySpec MUST NOT create, retry, cancel, execute, enqueue, or apply any job.
