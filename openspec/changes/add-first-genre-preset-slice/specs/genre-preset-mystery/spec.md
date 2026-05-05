## ADDED Requirements

### Requirement: StorySpec MUST ship a built-in mystery genre preset
StorySpec MUST provide a built-in `mystery` genre preset as a first vertical slice for additional genre packages.

#### Scenario: listing built-in presets includes mystery
- **WHEN** the user runs `storyspec preset:list --json`
- **THEN** the returned presets MUST include `mystery`
- **AND** the manifest MUST identify the genre as `mystery`.

#### Scenario: mystery manifest includes genre-specific constraints
- **WHEN** StorySpec parses `presets/mystery/preset.yaml`
- **THEN** the manifest MUST include required world facts for clue logic, fair play boundaries, and suspect relationships
- **AND** include reviewer weights for clue continuity and reader-facing fairness.

### Requirement: mystery preset MUST install without overwriting author content
Installing the `mystery` preset MUST use the existing preset installation path and preserve existing user project files.

#### Scenario: adding mystery installs through existing preset flow
- **WHEN** the user runs `storyspec preset:add mystery --json` inside a StorySpec project
- **THEN** the system MUST install `.specify/presets/mystery/`
- **AND** write `spec/presets/current-preset.json`
- **AND** copy only missing `spec/**` templates.

#### Scenario: doctor accepts installed mystery template facts
- **WHEN** the user runs `storyspec preset:doctor --json` after installing `mystery`
- **THEN** the active preset MUST be `mystery`
- **AND** missing required world fact warnings MUST NOT appear for the bundled template facts.
