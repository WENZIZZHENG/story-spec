## ADDED Requirements

### Requirement: Independent web app shell MUST exist without replacing local fallback
StorySpec MUST provide an independent web app shell boundary while keeping the existing local app shell as fallback.

#### Scenario: web shell contract is built
- **WHEN** the independent web app shell contract is imported
- **THEN** it MUST expose the first-slice routes for project workspace, story cockpit, chapter writing, canon review, and task center
- **AND** it MUST expose API client config with a token header and server API base.

#### Scenario: web shell preserves author control boundaries
- **WHEN** the independent web app shell is rendered
- **THEN** it MUST state that candidate, preview, dry-run, and apply-confirmed boundaries are distinct
- **AND** it MUST state that the local app shell remains available as fallback.

#### Scenario: no full frontend framework is introduced
- **WHEN** the independent web app shell is added
- **THEN** StorySpec MUST NOT require React, Vite, Next, Tailwind, realtime collaboration, or rich text editing for this first shell slice.
