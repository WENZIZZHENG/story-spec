## ADDED Requirements

### Requirement: Complete App UX MUST center the story cockpit for the first version
The complete App UX design MUST use a story cockpit as the first-version center of gravity so authors and collaborators can understand story status before entering deeper tools.

#### Scenario: first screen explains current story state
- **WHEN** a user opens a story in the App
- **THEN** the first screen MUST show the current story, current blocker, next recommended action, chapter progress, pending confirmations, and relevant team or Agent activity.

#### Scenario: app does not become a pure editor or pure queue
- **WHEN** the UX design defines first-version navigation
- **THEN** it MUST keep writing, canon review, and task status reachable from the cockpit
- **AND** it MUST NOT make the rich editor or review queue the only primary entrypoint.

### Requirement: First-version page scope MUST include workspace entry and four primary story surfaces
The first-version complete App design MUST include a workspace/project entry in the App shell and focus story-level work on story cockpit, chapter writing, canon review, and task center.

#### Scenario: first batch pages are defined
- **WHEN** the design describes first-version scope
- **THEN** it MUST include workspace/project entry, story cockpit, chapter writing, candidate and canon review, and task center
- **AND** it MUST mark team permissions, knowledge library, activity stream, and project settings as follow-up surfaces.

#### Scenario: deferred product areas are explicit
- **WHEN** the design describes non-goals
- **THEN** it MUST defer billing, public community, plugin marketplace, full mobile experience, full real-time collaborative editor, and cloud SaaS deployment.

### Requirement: High-impact story changes MUST default to Preview Confirm Apply
The complete App UX design MUST protect author control by routing high-impact story changes through Preview / Confirm / Apply.

#### Scenario: Agent submits high-impact output
- **GIVEN** an Agent run produces a canon fact, worldbuilding rule, character relationship, theme movement, emotional progression, or chapter key event
- **WHEN** the App surfaces that output
- **THEN** it MUST show it as a candidate or preview
- **AND** it MUST require author or authorized member confirmation before apply.

#### Scenario: user previews a change
- **WHEN** a user opens a preview
- **THEN** the interface MUST explain that the preview does not write into the formal story
- **AND** it MUST show impact, diff or equivalent explanation, source, and available actions.

### Requirement: Primary pages MUST have distinct responsibilities
The design MUST keep the four first-version pages separated by responsibility.

#### Scenario: story cockpit is used
- **WHEN** the story cockpit is shown
- **THEN** it MUST provide orientation and next actions
- **AND** it MUST NOT become the heavy editing or full review surface.

#### Scenario: chapter writing is used
- **WHEN** the chapter writing surface is shown
- **THEN** it MUST support the outline, scene, sample, draft, and review lane
- **AND** it MUST route high-impact facts to candidate or preview states.

#### Scenario: canon review is used
- **WHEN** the canon review surface is shown
- **THEN** it MUST focus on candidates, conflicts, impact preview, confirmation, rejection, source tracking, and canon status.

#### Scenario: task center is used
- **WHEN** the task center is shown
- **THEN** it MUST explain Agent runs, human tasks, failures, blockers, retries, cancellations, and related navigation targets.

### Requirement: Visual direction MUST be a studio workbench
The design MUST use a clear studio workbench visual direction for the complete App.

#### Scenario: visual language is specified
- **WHEN** the design describes visual style
- **THEN** it MUST prefer a light, scannable workbench layout with stable navigation, clear content regions, blue informational states, orange pending-confirmation emphasis, and green confirmed states.

#### Scenario: visual anti-goals are specified
- **WHEN** the design describes visual boundaries
- **THEN** it MUST avoid marketing-style hero pages, decorative gradients, nested card-heavy sections, heavy dark operations-console styling, and purely technical status language.
