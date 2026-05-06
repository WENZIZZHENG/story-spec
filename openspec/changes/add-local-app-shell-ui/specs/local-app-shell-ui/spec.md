## ADDED Requirements

### Requirement: Local app service MUST serve a usable workbench shell
`storyspec app` SHALL serve a browser page for the local workbench in addition to JSON APIs.

#### Scenario: User opens the local app root
- **WHEN** the local app service receives `GET /`
- **THEN** it MUST return HTML
- **AND** the HTML MUST include project open, project create, recent projects, current status, and next action regions
- **AND** the HTML MUST include the current session token for same-page API calls

### Requirement: Workbench shell MUST preserve local app security boundaries
The local workbench shell SHALL reuse the existing token and project allowlist boundaries.

#### Scenario: Shell calls APIs
- **WHEN** the browser script calls project APIs
- **THEN** it MUST send the session token
- **AND** APIs without the token MUST still be rejected
- **AND** current status MUST still require a project opened or created in the current session

### Requirement: App startup MAY pre-open a project
`storyspec app --project <path>` SHALL open the selected project in the current app session after the server starts.

#### Scenario: Startup project is valid
- **GIVEN** the command starts with `--project <path>`
- **AND** the path is a valid StorySpec project root
- **WHEN** the app service starts
- **THEN** the project MUST be allowed for current status reads
- **AND** the started output MUST indicate the startup project was opened

#### Scenario: Startup project is invalid
- **GIVEN** the command starts with `--project <path>`
- **AND** the path is not a valid StorySpec project root
- **WHEN** the app service starts
- **THEN** the service MUST keep running
- **AND** the started output MUST indicate the startup project was not opened

### Requirement: Workbench shell MUST use the approved app visual direction
The local workbench shell SHALL use a restrained editor desk / archive console layout rather than a marketing or generic AI UI.

#### Scenario: HTML shell is rendered
- **WHEN** StorySpec renders the local app shell
- **THEN** the page MUST expose a dense project drawer, story dossier, and confirmation lane
- **AND** it MUST NOT render a landing-page hero as the primary experience
- **AND** it MUST NOT rely on purple/blue gradients, glassmorphism, or decorative animation as primary styling
