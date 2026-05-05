## ADDED Requirements

### Requirement: StorySpec MUST define agent integration acceptance checks
StorySpec MUST provide a documented and testable acceptance checklist for adding or enhancing agent integrations.

#### Scenario: registry integrations pass the acceptance scaffold
- **WHEN** the unit test iterates over registered agent integrations
- **THEN** each integration MUST pass required metadata, install target, renderer, slash prefix, and legacy mapping checks.

#### Scenario: acceptance checks produce actionable issues
- **WHEN** an integration is missing a required field or has an unsafe install path
- **THEN** the acceptance checker MUST return an issue with a check id and message
- **AND** the test failure MUST identify the affected agent id.

### Requirement: agent acceptance docs MUST guide future integration work
StorySpec MUST document the minimum files, tests, and verification commands required before a new agent integration can be marked implemented.

#### Scenario: future agent work starts from docs
- **WHEN** a developer starts a new agent integration change
- **THEN** the documentation MUST list registry, renderer, command manifest, init/upgrade/doctor smoke, docs, and legacy compatibility checks.
