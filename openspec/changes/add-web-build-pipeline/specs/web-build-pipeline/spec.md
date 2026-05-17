## ADDED Requirements

### Requirement: Web build pipeline MUST generate static artifacts
StorySpec MUST provide a minimal build pipeline for the independent web app shell.

#### Scenario: web build emits static files
- **WHEN** the web build command runs
- **THEN** StorySpec MUST emit `apps/web/dist/index.html`
- **AND** it MUST emit a compiled JavaScript entry under `apps/web/dist/src/`.

#### Scenario: root build includes web build
- **WHEN** the root build script runs
- **THEN** it MUST run the main TypeScript build and the web build pipeline.

#### Scenario: no frontend framework is introduced
- **WHEN** the web build pipeline is added
- **THEN** StorySpec MUST NOT require Vite, React, Next, Tailwind, or a bundler for this first build-chain slice.
