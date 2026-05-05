## ADDED Requirements

### Requirement: Core version dependency gate

StorySpec SHALL reject plugin install plans when `dependencies.core` declares a supported version range that the current StorySpec package version does not satisfy.

#### Scenario: compatible core dependency
- **GIVEN** a plugin manifest with `dependencies.core: ">=0.20.0"`
- **AND** the current StorySpec version is `0.20.0` or newer
- **WHEN** an install plan is created
- **THEN** the install plan SHALL be created successfully

#### Scenario: incompatible core dependency
- **GIVEN** a plugin manifest with `dependencies.core: ">=99.0.0"`
- **WHEN** an install plan is created
- **THEN** StorySpec SHALL reject the plugin before writing files
- **AND** the error SHALL explain the required and current core versions

### Requirement: Auditable local plugin source resolution

StorySpec SHALL resolve plugin install sources from bundled plugin names, local directory paths, and `file://` URLs before installation.

#### Scenario: install from local path
- **GIVEN** a valid plugin directory outside bundled plugins
- **WHEN** the user runs plugin installation with that directory path as the source name
- **THEN** StorySpec SHALL plan and install from that directory

#### Scenario: reject network source explicitly
- **GIVEN** an `https://` plugin source
- **WHEN** the user requests installation
- **THEN** StorySpec SHALL reject it with a message that network plugin installation is not yet supported
