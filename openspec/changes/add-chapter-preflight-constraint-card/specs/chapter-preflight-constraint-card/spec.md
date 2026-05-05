## ADDED Requirements

### Requirement: Provide chapter preflight constraint card template
StorySpec SHALL provide a reusable chapter card template section for chapter-level preflight constraints before prose drafting.

#### Scenario: Chapter card template contains preflight constraints
- **WHEN** a project receives `.specify/templates/authoring/chapter-card.md`
- **THEN** the template MUST include sections for time point, current ability and language level, emotional checkpoints, hard constraints, soft constraints, and post-write self-check

### Requirement: Require confirmation before chapter prose
StorySpec SHALL require agents to present chapter preflight constraints for author confirmation before drafting chapter prose.

#### Scenario: Write command prepares a chapter
- **WHEN** an agent follows the `/write` command for a chapter task
- **THEN** it MUST output a chapter preflight constraint card before scene beat preview or prose
- **AND** it MUST wait for author confirmation or revision before drafting prose

### Requirement: Preserve canon boundaries for constraints
StorySpec SHALL keep uncertain chapter constraints out of canon and tracking until confirmed.

#### Scenario: Constraint information is missing
- **WHEN** the agent cannot verify a character emotion, ability boundary, language level, relationship dynamic, or world rule for the chapter
- **THEN** it MUST mark the item as pending confirmation instead of inventing a canon fact

### Requirement: Check prose against preflight constraints
StorySpec SHALL require post-write summaries to compare drafted prose with the preflight constraints.

#### Scenario: Chapter drafting finishes
- **WHEN** the agent reports the chapter finish stage
- **THEN** it MUST state whether hard constraints were preserved and list any unresolved or manually-confirmed constraint risks
