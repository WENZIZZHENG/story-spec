## ADDED Requirements

### Requirement: Install project-level continuation entry
StorySpec SHALL install a project-level continuation entry for new projects so authors can restart from a clear next-step guide without first locating story internals.

#### Scenario: New project receives CONTINUE.md
- **WHEN** a project is initialized from package templates
- **THEN** the project root MUST contain `CONTINUE.md` with copyable guidance for status, handoff, validation, chapter planning, tracking updates, and story-specific template usage

### Requirement: Provide reusable story continuation templates
StorySpec SHALL provide reusable authoring templates for story-level continuation artifacts without automatically turning those templates into story canon.

#### Scenario: Authoring templates are installed
- **WHEN** a project is initialized or upgraded with templates enabled
- **THEN** `.specify/templates/authoring/` MUST contain `story-dashboard.md`, `open-promises.md`, `tracking-update-checklist.md`, and `chapter-card.md`

#### Scenario: Templates preserve canon boundaries
- **WHEN** an authoring template mentions story facts, tracking, promises, or future chapters
- **THEN** it MUST distinguish author-confirmed facts, text-evidenced facts, agent suggestions, and pending decisions instead of presenting all content as canon

### Requirement: Provide local validation fallback
StorySpec SHALL provide a local validation script for generated projects that routes to official validation when available and performs only lightweight fallback checks otherwise.

#### Scenario: Local validation scripts are installed
- **WHEN** a project is initialized or upgraded with scripts enabled
- **THEN** `.specify/scripts/powershell/validate-local.ps1` and `.specify/scripts/bash/validate-local.sh` MUST be available

#### Scenario: Local validation prefers official validation
- **WHEN** local validation runs in an environment where `storyspec validate` or the packaged script runtime is available
- **THEN** it MUST use that validation path before falling back to lightweight checks

### Requirement: Validate continuation kit presence
StorySpec SHALL report missing continuation kit files during project validation without blocking writing for existing projects.

#### Scenario: Missing continuation kit reports warnings
- **WHEN** `storyspec validate` checks a project that lacks `CONTINUE.md`, authoring templates, or local validation scripts
- **THEN** it MUST emit warning-level issues that identify the missing file and suggest upgrade, while keeping the project valid if there are no error-level issues

### Requirement: Protect user story data during upgrade
StorySpec SHALL update continuation kit source templates and scripts without overwriting user-authored stories or tracking data.

#### Scenario: Upgrade refreshes continuation kit safely
- **WHEN** `storyspec upgrade` runs with templates or scripts enabled
- **THEN** it MUST refresh `.specify/templates/authoring/` and `.specify/scripts/*/validate-local.*` while preserving `stories/*`, `spec/tracking/*`, and `spec/knowledge/*`
