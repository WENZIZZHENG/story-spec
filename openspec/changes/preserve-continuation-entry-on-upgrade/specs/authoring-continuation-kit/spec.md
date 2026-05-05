## MODIFIED Requirements

### Requirement: Install project-level continuation entry
StorySpec SHALL install a project-level continuation entry for new projects so authors can restart from a clear next-step guide without first locating story internals.

#### Scenario: New project receives CONTINUE.md
- **WHEN** a project is initialized from package templates
- **THEN** the project root MUST contain `CONTINUE.md` with copyable guidance for status, handoff, validation, chapter planning, tracking updates, and story-specific template usage

#### Scenario: Upgrade preserves existing CONTINUE.md
- **WHEN** `storyspec upgrade --templates` runs for a project that already has root `CONTINUE.md`
- **THEN** StorySpec MUST preserve the existing root `CONTINUE.md`
- **AND** it MUST still refresh `.specify/templates/CONTINUE.md` from package templates
- **AND** it SHOULD report that the story-level continuation entry was preserved

#### Scenario: Upgrade installs missing CONTINUE.md
- **WHEN** `storyspec upgrade --templates` runs for a project that does not have root `CONTINUE.md`
- **THEN** StorySpec MUST install root `CONTINUE.md` from package templates
