## ADDED Requirements

### Requirement: Multiuser HTTP entry MUST require user sessions for protected endpoints
StorySpec MUST require a valid multiuser session before returning protected API context.

#### Scenario: token is missing
- **WHEN** a protected endpoint is requested without a session token
- **THEN** the server MUST return 401 with a standard error response

### Requirement: Multiuser HTTP entry MUST enforce project membership
StorySpec MUST authorize protected project API access through `userId + projectId`.

#### Scenario: project access is denied
- **WHEN** an authenticated user requests a project they do not belong to
- **THEN** the server MUST return 403 with a standard error response

#### Scenario: project access succeeds
- **WHEN** an authenticated member requests project context
- **THEN** the server MUST return userId, projectId, role, and requestId
