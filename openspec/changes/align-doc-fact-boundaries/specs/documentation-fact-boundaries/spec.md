## ADDED Requirements

### Requirement: Keep public docs aligned with implemented writing flow
StorySpec SHALL describe the implemented chapter writing flow consistently across public documentation.

#### Scenario: User reads command or workflow documentation
- **WHEN** documentation describes `/write` or `/storyspec-write`
- **THEN** it MUST include the current sequence: chapter preflight constraint card, beat preview, chapter sample, full prose blocks, and post-write self-check
- **AND** it MUST state that the chapter sample is a preview and does not write content, tracking, tasks, or canon by default
- **AND** it MUST preserve the JSON stage compatibility where beat and sample remain in `plan`, full prose is `write`, and self-check is `finish`

### Requirement: Keep roadmap status separate from future app routes
StorySpec SHALL keep completed documentation cleanup distinct from future multi-user or cloud routes.

#### Scenario: User reads todo or roadmap documentation
- **WHEN** a P2 documentation cleanup item is completed
- **THEN** todo documentation MUST move it to completed/archived evidence
- **AND** todo-index MUST not present the completed item as the next active development task
- **AND** multi-user account, cloud deployment, and real-time collaboration MUST remain Planned unless a separate OpenSpec implements them
