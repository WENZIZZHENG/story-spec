## ADDED Requirements

### Requirement: extension:add MUST be a thin alias for plugin installation
`extension:add` MUST reuse the existing plugin install planning and apply path instead of implementing a separate installer.

#### Scenario: extension dry-run previews the same install plan shape
- **WHEN** the user runs `extension:add translate --dry-run`
- **THEN** the system MUST render an install preview
- **AND** include manifest kind
- **AND** include agent integration impact
- **AND** MUST NOT write files.

#### Scenario: extension add installs through the shared plan
- **WHEN** the user runs `extension:add translate --force`
- **THEN** the system MUST resolve the same source as `plugins:add translate`
- **AND** apply the same install plan.

### Requirement: extension:add MUST be visible in CLI help
`extension:add` MUST appear as an available command and provide its own help output.

#### Scenario: help lists extension add
- **WHEN** the user runs `storyspec --help`
- **THEN** the output MUST include `extension:add [options] <name>`.

#### Scenario: command help is available
- **WHEN** the user runs `storyspec extension:add --help`
- **THEN** the output MUST explain dry-run and force options.
