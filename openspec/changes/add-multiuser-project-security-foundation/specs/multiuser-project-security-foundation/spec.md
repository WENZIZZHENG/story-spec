## ADDED Requirements

### Requirement: Multiuser project access MUST require user and project identity
StorySpec MUST provide a reusable guard that authorizes project access through `userId + projectId` instead of filesystem paths.

#### Scenario: project owner can access owned project
- **GIVEN** a project owned by a user
- **WHEN** that user requests project access
- **THEN** the guard MUST allow the request
- **AND** it MUST return the authorized project and access context

#### Scenario: non-member cannot access project
- **GIVEN** a project exists
- **AND** the requesting user is not a project member
- **WHEN** the user requests project access
- **THEN** the guard MUST reject the request
- **AND** it MUST not return the project data root as an authorized path

#### Scenario: path-only request is rejected
- **GIVEN** a request has no `projectId`
- **WHEN** the guard evaluates it
- **THEN** the guard MUST reject the request
- **AND** it MUST explain that project identity is required

### Requirement: Multiuser project storage MUST prevent path escape
StorySpec MUST provide project-scoped path resolution that prevents reads and writes outside the authorized project data root.

#### Scenario: valid relative path resolves inside project root
- **GIVEN** an authorized project data root
- **WHEN** storage resolves `stories/main/specification.md`
- **THEN** it MUST return a path inside the project data root

#### Scenario: parent traversal is rejected
- **GIVEN** an authorized project data root
- **WHEN** storage resolves `../other-project/secret.md`
- **THEN** it MUST reject the path
- **AND** it MUST not return a filesystem path outside the project data root

#### Scenario: absolute path is rejected
- **GIVEN** an authorized project data root
- **WHEN** storage resolves an absolute filesystem path
- **THEN** it MUST reject the path
