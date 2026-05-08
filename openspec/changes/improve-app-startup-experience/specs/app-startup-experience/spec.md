## ADDED Requirements

### Requirement: Startup Path Guidance

StorySpec MUST document and expose clear startup paths for developers, installed CLI users, and local App users.

#### Scenario: CLI help shows local App entry

- **GIVEN** a user runs `storyspec --help`
- **WHEN** help is rendered
- **THEN** it includes `storyspec app` as the local Web workbench entry
- **AND** it distinguishes terminal commands from agent slash commands

### Requirement: Local App Port Fallback

`storyspec app` MUST keep the local workbench startable when the default port is already in use.

#### Scenario: Default port is occupied

- **GIVEN** port `43127` is unavailable
- **WHEN** the local App starts without a custom port
- **THEN** StorySpec tries a fallback port on loopback
- **AND** the start result reports the requested port, actual port, final URL, and that fallback was used

### Requirement: Startup Doctor

StorySpec MUST provide a read-only startup doctor command for common local startup failures.

#### Scenario: Run doctor as JSON

- **GIVEN** a user runs `storyspec doctor --json`
- **WHEN** checks complete
- **THEN** the output includes stable check items with `id`, `status`, `message`, and optional `suggestedAction`
- **AND** the command does not modify project or system files
