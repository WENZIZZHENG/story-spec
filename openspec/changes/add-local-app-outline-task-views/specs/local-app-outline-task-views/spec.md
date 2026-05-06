## ADDED Requirements

### Requirement: Local app MUST expose outline candidate APIs scoped to the current project
The local app service SHALL expose outline candidate operations for the current opened or created project.

#### Scenario: User lists outline candidates
- **GIVEN** a valid project has been opened in the app session
- **WHEN** the page requests outline candidates with the session token
- **THEN** the service MUST return the shared outline candidate list result
- **AND** the operation MUST NOT accept or use an arbitrary project root from the browser request

#### Scenario: User creates an outline candidate from text
- **GIVEN** a valid project has been opened in the app session
- **WHEN** the page submits a title and outline text
- **THEN** the service MUST create the candidate through the shared outline candidate service
- **AND** the candidate MUST remain a candidate rather than the formal `creative-plan.md`

#### Scenario: User compares two outline candidates
- **GIVEN** a valid project has been opened in the app session
- **WHEN** the page requests comparison for two candidate ids
- **THEN** the service MUST return the shared comparison dimensions

### Requirement: Local app MUST preserve explicit promote confirmation
The local app service SHALL not overwrite the formal creative plan unless an explicit promote confirmation is provided.

#### Scenario: Promote preview is requested
- **GIVEN** a valid project has been opened in the app session
- **WHEN** the page requests promotion without `yes: true`
- **THEN** the service MUST return a dry-run promote result
- **AND** it MUST NOT overwrite `stories/<story>/creative-plan.md`

#### Scenario: Promote confirmation is requested
- **GIVEN** a valid project has been opened in the app session
- **WHEN** the page requests promotion with `yes: true`
- **THEN** the service MAY call the shared promote service with `yes: true`
- **AND** the response MUST include reminders to re-check tasks, Scene Cards, and Context Packs

### Requirement: Local app MUST expose a read-only task board
The local app shell SHALL show task board status without modifying task files.

#### Scenario: User loads task board
- **GIVEN** a valid project has been opened in the app session
- **AND** the selected story has `tasks.md`
- **WHEN** the page requests the task board
- **THEN** the service MUST call `exportTaskBoard({ write: false })`
- **AND** the response MUST include task totals, columns, writeReady count, planOnly count, and task summaries

### Requirement: Planning UI MUST preserve the approved workbench direction
The workbench shell SHALL add planning controls without turning the page into a generic kanban SaaS or unrestricted plan editor.

#### Scenario: HTML shell is rendered with planning controls
- **WHEN** StorySpec renders the local app shell
- **THEN** the page MUST include outline list, outline creation, outline compare, promote preview, and task board regions
- **AND** it MUST explain that promote defaults to preview/dry-run
- **AND** it MUST NOT render a landing-page hero as the primary experience
- **AND** it MUST NOT rely on purple/blue gradients, glassmorphism, or decorative animation as primary styling
