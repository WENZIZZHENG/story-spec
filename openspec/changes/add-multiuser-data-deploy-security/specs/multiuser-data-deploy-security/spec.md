## ADDED Requirements

### Requirement: Multiuser projects MUST have auditable lifecycle plans
StorySpec MUST provide project snapshot, export, and deletion plans without directly deleting project files.

#### Scenario: snapshot and export plans are created
- **WHEN** a project lifecycle plan is requested
- **THEN** StorySpec MUST return projectId, dataRoot, createdAt, and planned artifact paths

#### Scenario: deletion plan requires confirmation
- **WHEN** a deletion plan is created
- **THEN** it MUST include actorUserId, projectId, dataRoot, requiresConfirmation=true, and audit action metadata

### Requirement: Self-hosted deployment files MUST describe current boundaries
StorySpec MUST provide minimal self-hosted configuration while clearly separating implemented server capabilities from planned PostgreSQL/Redis worker integration.

#### Scenario: deployment files are present
- **WHEN** a maintainer inspects deployment configuration
- **THEN** docker compose, env example, and self-hosted docs MUST exist
- **AND** docs MUST state that real PostgreSQL/Redis driver/worker integration is not yet complete

### Requirement: Multiuser security regressions MUST be automated
StorySpec MUST include security regression coverage for core multiuser isolation risks.

#### Scenario: unauthorized and cross-project access are rejected
- **WHEN** unauthenticated or non-member requests reach protected APIs
- **THEN** the server MUST reject them

#### Scenario: runtime and path safety are retained
- **WHEN** unsafe paths or runtime outputs are produced
- **THEN** path traversal MUST be rejected and runtime outputs MUST remain preview-only
