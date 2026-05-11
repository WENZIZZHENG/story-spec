## ADDED Requirements

### Requirement: Command artifact builds MUST preserve compiled runtime in default dist output
StorySpec MUST allow contributors to run `npm run build` followed by `npm run build:commands` without deleting the compiled CLI runtime from `dist/`.

#### Scenario: contributor rebuilds command artifacts after compiling
- **WHEN** command artifacts are built into the default repository `dist` output
- **THEN** the build MUST remove stale generated agent artifact directories before writing fresh artifacts
- **AND** it MUST preserve compiled runtime files such as `dist/cli.js`, `dist/script-runtime.js`, `dist/application/**`, and `dist/domain/**`
- **AND** `node dist/cli.js --help` MUST remain runnable after the command artifact build

### Requirement: Custom command artifact output directories MUST remain fully clean
StorySpec tests and manifest checks MUST be able to build command artifacts into custom output directories without stale files influencing results.

#### Scenario: manifest generation uses a temporary output directory
- **WHEN** command artifacts are built into a caller-provided output directory
- **THEN** the build MUST remove that output directory before generating artifacts
- **AND** it MUST not preserve arbitrary files from a prior run in that custom directory
