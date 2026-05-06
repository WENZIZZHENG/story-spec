## ADDED Requirements

### Requirement: Local app MUST expose chapter draft APIs scoped to the current project
The local app service SHALL expose chapter draft operations for the current opened or created project.

#### Scenario: User creates a chapter draft
- **GIVEN** a valid project has been opened in the app session
- **WHEN** the page submits a story, chapter, and optional context pack
- **THEN** the service MUST create the draft through the shared draft service
- **AND** the draft MUST NOT overwrite formal `content/<chapter>.md`
- **AND** the operation MUST NOT accept or use an arbitrary project root from the browser request

#### Scenario: User lists chapter drafts
- **GIVEN** a valid project has been opened in the app session
- **WHEN** the page requests drafts for a chapter
- **THEN** the service MUST return shared draft records for that story and chapter

### Requirement: Local app MUST preserve explicit draft promote confirmation
The local app service SHALL not publish a chapter draft unless an explicit promote confirmation is provided.

#### Scenario: Draft promote preview is requested
- **GIVEN** a valid project has been opened in the app session
- **WHEN** the page requests draft promote without `yes: true`
- **THEN** the service MUST return a dry-run promote result
- **AND** it MUST NOT overwrite `stories/<story>/content/<chapter>.md`

#### Scenario: Draft promote confirmation is requested
- **GIVEN** a valid project has been opened in the app session
- **WHEN** an API request provides `yes: true`
- **THEN** the service MAY call the shared draft promote service with `yes: true`
- **AND** the response MUST identify the target content path and updated draft record

### Requirement: Local app MUST expose chapter preparation and review helpers
The local app shell SHALL expose Scene Card initialization and chapter-level review without modifying canon or task files.

#### Scenario: User initializes a Scene Card
- **GIVEN** a valid project has been opened in the app session
- **WHEN** the page submits a story and scene id
- **THEN** the service MUST create the Scene Card through the shared Scene Card initializer
- **AND** confirmed context embedded in the card MUST remain bounded by the shared initializer behavior

#### Scenario: User runs chapter review
- **GIVEN** a valid project has been opened in the app session
- **WHEN** the page requests review for a chapter
- **THEN** the service MUST run the shared reviewer loop scoped to that chapter
- **AND** the response MUST include reviewers, findings, and task drafts
- **AND** it MUST NOT write findings into `tasks.md`,正文, tracking, or canon

### Requirement: Chapter UI MUST preserve the approved workbench direction
The workbench shell SHALL add chapter controls without turning the page into a full editor or unrestricted publishing surface.

#### Scenario: HTML shell is rendered with chapter controls
- **WHEN** StorySpec renders the local app shell
- **THEN** the page MUST include draft creation, draft list, draft promote preview, Scene Card initialization, and chapter review regions
- **AND** it MUST explain that draft promote defaults to dry-run
- **AND** it MUST NOT render a full rich text editor for chapter content
- **AND** it MUST NOT render a landing-page hero as the primary experience
- **AND** it MUST NOT rely on purple/blue gradients, glassmorphism, or decorative animation as primary styling
