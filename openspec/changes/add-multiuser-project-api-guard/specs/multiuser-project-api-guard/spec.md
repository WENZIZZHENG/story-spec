## ADDED Requirements

### Requirement: Multiuser project API MUST return only authorized project metadata
StorySpec MUST require session and project membership before returning project metadata.

#### Scenario: authorized project metadata is requested
- **WHEN** an authenticated project member requests project metadata
- **THEN** the server MUST return the project id, owner user id, and data root

### Requirement: Multiuser project API MUST resolve only safe project-relative paths
StorySpec MUST normalize project paths through ProjectStorage and reject filesystem escapes.

#### Scenario: safe relative path is resolved
- **WHEN** an authenticated project member resolves a relative path
- **THEN** the server MUST return the resolved project-local path

#### Scenario: path escape is rejected
- **WHEN** a request attempts to resolve `..` or an absolute path
- **THEN** the server MUST return a standard error response
