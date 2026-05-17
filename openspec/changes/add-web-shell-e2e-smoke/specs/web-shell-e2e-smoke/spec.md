## ADDED Requirements

### Requirement: Web shell E2E smoke MUST cover the real local preview server
StorySpec MUST provide an E2E smoke test for the independent web shell using the real local preview server.

#### Scenario: e2e smoke reads the first screen
- **WHEN** the E2E smoke test runs
- **THEN** it MUST start the web dev server and read the root HTML response
- **AND** it MUST verify the first-screen shell, auth panel, error boundary, routes, and write boundary text.

#### Scenario: e2e smoke reads the JavaScript entry
- **WHEN** the E2E smoke test runs
- **THEN** it MUST request the compiled JavaScript entry from the dev server.

#### Scenario: no browser dependency is introduced
- **WHEN** the E2E smoke slice is added
- **THEN** StorySpec MUST NOT require Playwright, browser downloads, real login, or a running multiuser server.
