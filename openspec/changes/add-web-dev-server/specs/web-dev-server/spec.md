## ADDED Requirements

### Requirement: Web dev server MUST preview the built shell
StorySpec MUST provide a minimal dev server for the independent web app shell.

#### Scenario: dev server serves built html
- **WHEN** the web dev server starts
- **THEN** it MUST serve `apps/web/dist/index.html`
- **AND** the page MUST reference the compiled JavaScript entry.

#### Scenario: missing build artifacts are prepared
- **WHEN** the web dev server starts and required dist artifacts are missing
- **THEN** StorySpec MUST build the web app before serving.

#### Scenario: dev server remains minimal
- **WHEN** the dev server slice is added
- **THEN** StorySpec MUST NOT require Vite, Express, React, Next, Tailwind, hot reload, or an API proxy.
