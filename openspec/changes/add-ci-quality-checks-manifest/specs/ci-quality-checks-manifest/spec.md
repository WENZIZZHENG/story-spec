## ADDED Requirements

### Requirement: StorySpec MUST expose a local CI quality check manifest
StorySpec MUST provide a local `ci:check` command that reports the project quality checks needed for CI automation.

#### Scenario: JSON output contains stable check fields
- **WHEN** the user runs `storyspec ci:check --json`
- **THEN** each check MUST include `checkId`, `status`, `command`, `files`, `message`, and `suggestedAction`
- **AND** the top-level result MUST include `valid` and `projectRoot`.

#### Scenario: text output is readable by humans
- **WHEN** the user runs `storyspec ci:check`
- **THEN** the output MUST list each check with status, command, files, and suggested action.

### Requirement: CI quality checks MUST be read-only
The first CI quality check command MUST NOT run LLMs, browse the network, or modify files.

#### Scenario: check reports commands without executing them
- **WHEN** `ci:check` evaluates the local manifest
- **THEN** it MUST report the commands a CI job should run
- **AND** MUST NOT execute those commands as subprocesses.
