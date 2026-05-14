## ADDED Requirements

### Requirement: Complete App frontend architecture MUST define first-slice routes
StorySpec MUST expose a typed frontend architecture contract for the first complete App page scope.

#### Scenario: route contract is built
- **WHEN** the frontend architecture contract is built
- **THEN** it MUST include project workspace, story cockpit, chapter writing, candidate/canon review, and task center routes
- **AND** each route MUST include a stable id, user-facing label, route, purpose, primary endpoints, and empty state.

### Requirement: Frontend API client contract MUST centralize local App endpoint usage
StorySpec MUST define the local App frontend API client contract outside the raw HTML string.

#### Scenario: API client contract is built
- **WHEN** the frontend architecture contract is built
- **THEN** it MUST include the `x-storyspec-app-token` header name
- **AND** it MUST include endpoint definitions for app state, resume lane, current status, recent projects, story intake, source ingest, core gaps, outlines, tasks, chapter drafts, scene card initialization, and chapter review
- **AND** endpoint definitions MUST identify method, path, owning route, and preview/apply boundary.

### Requirement: Local App shell MUST render navigation from the frontend architecture contract
StorySpec local App shell MUST consume the frontend architecture contract for visible navigation and endpoint map language.

#### Scenario: local app shell is rendered
- **WHEN** `renderLocalAppHtml` renders the shell
- **THEN** it MUST include the first-slice route labels from the frontend architecture contract
- **AND** it MUST include an endpoint map driven by the API client contract
- **AND** it MUST preserve preview/confirm/apply boundary language.

### Requirement: First frontend architecture slice MUST preserve product boundaries
StorySpec MUST keep the complete App frontend architecture slice honest about incomplete SaaS capabilities.

#### Scenario: docs describe the frontend architecture slice
- **WHEN** README or deployment docs mention the complete App frontend architecture
- **THEN** they MUST state it is a first frontend architecture slice
- **AND** they MUST NOT claim complete SaaS, rich text editing, realtime collaboration, billing, or public community features.
