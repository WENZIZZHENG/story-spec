## ADDED Requirements

### Requirement: ecosystem package text MUST show human-readable kind labels
CLI text output for ecosystem packages MUST show both the raw kind and a Chinese kind label when the package kind is known.

#### Scenario: plugin dry-run shows kind label
- **WHEN** the user runs `storyspec plugins:add translate --dry-run`
- **THEN** the output MUST include `包类型: 扩展包 (extension)`
- **AND** still include write paths, install impact, and conflict diagnostics.

#### Scenario: extension dry-run reuses kind label
- **WHEN** the user runs `storyspec extension:add translate --dry-run`
- **THEN** the output MUST include the same kind label and install impact sections as plugin dry-run.

### Requirement: genre preset text MUST identify presets as type packages
Human-readable preset outputs MUST identify genre presets as type packages and show their genre.

#### Scenario: preset list shows type package label
- **WHEN** the user runs `storyspec preset:list`
- **THEN** each preset line MUST show it is a `类型包`
- **AND** include the genre id.

#### Scenario: preset doctor shows active type package
- **WHEN** the user runs `storyspec preset:doctor`
- **THEN** the current preset line MUST identify the active preset as a type package when present.
