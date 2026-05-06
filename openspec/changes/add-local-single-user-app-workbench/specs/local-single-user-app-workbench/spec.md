## ADDED Requirements

### Requirement: Local app command MUST launch a local-only workbench service
`storyspec app` MUST provide a local workbench entrypoint that defaults to loopback-only access.

#### Scenario: command is visible in CLI help
- **WHEN** the user runs `storyspec --help`
- **THEN** the help output MUST include `app`.

#### Scenario: app service exposes health
- **WHEN** the local app service is started
- **THEN** it MUST expose a health response
- **AND** the service MUST indicate that API requests require a session token.

### Requirement: Local app MUST validate StorySpec project roots
The local app MUST only open directories that are valid StorySpec project roots.

#### Scenario: valid project root opens
- **GIVEN** a directory contains `.specify/config.json`
- **AND** the config is readable JSON
- **WHEN** the app opens that directory
- **THEN** the result MUST include the absolute project path
- **AND** the project name from config when present.

#### Scenario: non project root is rejected
- **GIVEN** a directory does not contain `.specify/config.json`
- **WHEN** the app attempts to open that directory
- **THEN** the result MUST be blocked
- **AND** the directory MUST NOT be added to recent projects.

### Requirement: Local app MUST remember recent projects outside the project repo
The local app MUST persist recently opened projects in a user-level app store rather than the StorySpec project directory.

#### Scenario: opening a valid project records it
- **WHEN** the app opens a valid project
- **THEN** the project MUST be recorded with absolute path, project name, and last opened time
- **AND** the recent list MUST return it before older projects.

#### Scenario: invalid projects are not recorded
- **WHEN** the app rejects a directory as invalid
- **THEN** the recent projects store MUST remain unchanged for that directory.

### Requirement: Local app MUST create projects through the existing initializer
The local app MUST create new StorySpec projects through the existing project initializer and default to the Codex agent.

#### Scenario: create project uses codex by default
- **WHEN** the user creates a project from the local app without choosing an agent
- **THEN** the initializer input MUST use `agent: codex`
- **AND** the created project MUST be added to recent projects.

### Requirement: Local app APIs MUST enforce token and project allowlist
The local app API MUST reject requests without the session token and MUST limit project access to roots opened or created in the current app session.

#### Scenario: missing token is rejected
- **WHEN** a request omits the session token
- **THEN** the API MUST return an unauthorized result.

#### Scenario: unopened project status is rejected
- **GIVEN** a valid StorySpec project exists on disk
- **AND** it has not been opened or created in the current app session
- **WHEN** the app requests project status for that path
- **THEN** the API MUST reject the request.

#### Scenario: opened project status is returned
- **GIVEN** a valid StorySpec project has been opened in the current app session
- **WHEN** the app requests the current project status with a valid token
- **THEN** the API MUST return the shared project status model.
