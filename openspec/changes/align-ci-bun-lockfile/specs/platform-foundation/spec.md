## ADDED Requirements

### Requirement: CI dependency install MUST use the committed Bun lockfile
StorySpec CI MUST install dependencies from the committed `bun.lock` using a frozen lockfile mode before running repository verification.

#### Scenario: CI verifies dependency installation
- **WHEN** the CI workflow installs dependencies
- **THEN** it MUST set up Bun
- **AND** it MUST run `bun install --frozen-lockfile`
- **AND** it MUST NOT use `npm install --package-lock=false` as the dependency installation step

### Requirement: Local development docs MUST describe the lockfile strategy
StorySpec local development documentation MUST tell contributors which package manager locks dependency installation and which command family runs project scripts.

#### Scenario: contributor installs dependencies locally
- **WHEN** a contributor reads the local development guide
- **THEN** it MUST state that `bun.lock` is the lockfile
- **AND** it MUST recommend `bun install --frozen-lockfile` for dependency installation
- **AND** it MUST keep npm scripts as the project command entrypoints
