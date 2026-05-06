## ADDED Requirements

### Requirement: Local app MUST expose current-project story intake APIs
The local app service SHALL provide story intake APIs scoped to the current opened or created project.

#### Scenario: App creates a story idea in the current project
- **GIVEN** a valid project has been opened in the app session
- **WHEN** the page submits a story name and original idea with the session token
- **THEN** the service MUST create the story through the shared story idea application service
- **AND** the response MUST include next commands and created artifact paths
- **AND** the operation MUST NOT accept or use an arbitrary project root from the browser request

#### Scenario: Story intake is blocked without current project
- **GIVEN** no project has been opened or created in the app session
- **WHEN** the page submits a story intake request with a valid token
- **THEN** the service MUST reject the request
- **AND** the response MUST explain that the project has not been opened in this app session

### Requirement: Local app MUST preview source material before canon writes
The local app service SHALL let authors paste source material and receive a preview without writing by default.

#### Scenario: Source material preview is requested
- **GIVEN** a valid project has been opened in the app session
- **AND** a story exists in that project
- **WHEN** the page submits source text without `applyConfirmed`
- **THEN** the service MUST call the shared ingest application service with `applyConfirmed: false`
- **AND** the response MUST include confirmed items, candidate items, pending questions, input profile, and written status
- **AND** `written` MUST be false unless the user explicitly requested confirmed-field writes

#### Scenario: User explicitly applies confirmed fields
- **GIVEN** a valid project has been opened in the app session
- **WHEN** the page submits source text with `applyConfirmed: true`
- **THEN** the service MAY write only fields recognized as explicit author statements by the shared ingest service
- **AND** AI-suggested or keyword-only candidates MUST remain candidates

### Requirement: Local app MUST show core gaps from the shared core summary
The local app shell SHALL expose a current story core-gap view backed by the shared core summary service.

#### Scenario: User refreshes core gaps
- **GIVEN** a valid project has been opened in the app session
- **AND** at least one story exists
- **WHEN** the page requests core gaps
- **THEN** the service MUST return `createStoryCoreSummary({ missingOnly: true })`
- **AND** the page MUST display missing or incomplete item labels, statuses, source labels, summaries, and next prompts

### Requirement: Intake UI MUST preserve the approved local workbench direction
The workbench shell SHALL add intake controls without turning the page into a marketing landing page or unrestricted editor.

#### Scenario: HTML shell is rendered with intake controls
- **WHEN** StorySpec renders the local app shell
- **THEN** the page MUST include story idea, source material, explicit confirmed-field write control, and core gaps regions
- **AND** it MUST explain that source material defaults to preview-only
- **AND** it MUST NOT render a landing-page hero as the primary experience
- **AND** it MUST NOT rely on purple/blue gradients, glassmorphism, or decorative animation as primary styling
