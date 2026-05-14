## ADDED Requirements

### Requirement: Local App MUST show a guided first-run path
StorySpec local App MUST show a first-screen guided path for users who do not know where to start.

#### Scenario: user opens the local App shell
- **WHEN** the local App HTML is rendered
- **THEN** it MUST show three ordered steps: open/create project, create/select story, continue writing or review candidates
- **AND** each step MUST point to an existing panel or action in the page.

### Requirement: Guided path MUST preserve write boundaries
StorySpec local App MUST explain that candidates, previews, and dry-runs do not automatically write formal story files.

#### Scenario: user reads the guided path
- **WHEN** the guided path is visible
- **THEN** it MUST state that candidate and preview work stays outside formal canon until confirmation
- **AND** it MUST not present unconfirmed AI output as formal canon.
