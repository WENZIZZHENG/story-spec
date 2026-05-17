## ADDED Requirements

### Requirement: Local App MUST expose a complete app state contract
The local App server MUST expose a typed complete App state derived from the current project status.

#### Scenario: current story state is available
- **GIVEN** a project has been opened in the current App session
- **WHEN** the UI requests the complete App state
- **THEN** the response MUST include workspace entry, story cockpit, chapter writing, canon review, and task center page definitions
- **AND** it MUST include current story summary, blocker count, pending confirmation count, next recommended action, status language, and role capabilities.

#### Scenario: missing token is rejected
- **WHEN** the UI requests complete App state without a valid token
- **THEN** the server MUST reject using existing token guard.

#### Scenario: no project is opened
- **GIVEN** the UI requests complete App state with a valid token
- **WHEN** no project has been opened in the current App session
- **THEN** the server MUST reject using the opened-project guard.

#### Scenario: empty state guidance is available
- **GIVEN** the current project has no story, candidates, chapters, or tasks
- **WHEN** the UI requests the complete App state
- **THEN** the response MUST include empty state guidance for noStory, noCandidates, noChapters, and noTasks
- **AND** each empty state MUST include title, body, and primaryAction.

### Requirement: Local App shell MUST present the first-version story cockpit structure
The local App HTML MUST present the agreed studio workbench structure without claiming cloud multi-user completion.

#### Scenario: shell renders primary surfaces
- **WHEN** the root HTML is rendered
- **THEN** it MUST include project/workspace entry, story cockpit, chapter writing, candidate and canon review, task center, and collaboration sidebar language.

#### Scenario: shell keeps author-control boundaries visible
- **WHEN** the root HTML is rendered
- **THEN** it MUST include candidate, preview, dry-run, apply, blocked, deferred, canon, draft, and comment status language
- **AND** it MUST avoid hero-page, paper-dossier, and operations-console visual language.
