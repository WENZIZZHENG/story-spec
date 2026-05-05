## ADDED Requirements

### Requirement: todo:capture MUST preview a governed roadmap draft
`todo:capture` MUST generate a governed roadmap draft from user-provided notes without writing files by default.

#### Scenario: preview from inline notes
- **WHEN** the user runs `todo:capture --topic "协作体验" --notes "补齐首屏入口"`
- **THEN** the system MUST output a roadmap path
- **AND** output a draft roadmap with governance sections
- **AND** output an index patch preview
- **AND** MUST NOT write files.

### Requirement: todo:capture MUST apply only when input is valid
`todo:capture --apply` MUST write a new roadmap and update `todo-index.md` only when the topic and notes are valid.

#### Scenario: apply writes roadmap and index entry
- **GIVEN** `docs/tech/todo-index.md` exists
- **AND** `docs/tech/collaboration-experience-roadmap.md` does not exist
- **WHEN** the user runs `todo:capture --topic "collaboration experience" --notes "补齐首屏入口" --apply`
- **THEN** the system MUST write the roadmap file
- **AND** update `todo-index.md`
- **AND** output the updated file paths.

#### Scenario: duplicate roadmap is blocked
- **GIVEN** the target roadmap path already exists
- **WHEN** the user runs `todo:capture --topic "collaboration experience" --notes "补齐首屏入口" --apply`
- **THEN** the system MUST NOT write files
- **AND** output a blocked reason.

### Requirement: todo:capture MUST reject ambiguous notes input
`todo:capture` MUST require exactly one notes source.

#### Scenario: notes source is missing
- **WHEN** the user runs `todo:capture --topic "协作体验"`
- **THEN** the system MUST return blocked
- **AND** output a next action explaining how to provide notes.

#### Scenario: two notes sources are provided
- **WHEN** the user runs `todo:capture --topic "协作体验" --from notes.md --notes "补齐首屏入口"`
- **THEN** the system MUST return blocked
- **AND** MUST NOT write files.
