## ADDED Requirements

### Requirement: Local App Chapter Writing Lane

本机 App MUST expose a read-only chapter writing lane that guides the author through outline, tasks, Scene Card, sample preview, draft, and review without writing正文或正典文件。

#### Scenario: Read current lane for an opened project

- **GIVEN** a StorySpec project is opened in the current App session
- **WHEN** the user requests the chapter writing lane for a story and chapter
- **THEN** the response includes ordered stages for `outline`, `tasks`, `scene`, `sample`, `draft`, and `review`
- **AND** each stage includes status, summary, next action, blocked reasons, and commands where applicable
- **AND** the response includes boundaries saying the lane does not automatically write正文、tracking、canon or tasks

#### Scenario: Reject lane access outside the current session

- **GIVEN** no StorySpec project is opened in the current App session
- **WHEN** the user requests the chapter writing lane
- **THEN** the API returns a blocked response

### Requirement: Chapter Sample Preview Stage

The chapter writing prompt MUST include a sample preview stage between beat preview and full draft generation.

#### Scenario: Generate sample before full chapter

- **GIVEN** the author confirmed the chapter constraint card and beat preview
- **WHEN** the agent proceeds with chapter writing
- **THEN** it outputs `阶段 1.5 - 章节小样` before full正文 blocks
- **AND** the sample is a short prose preview, not a pure outline
- **AND** the sample is used to confirm reading feel, emotional order, character reactions, conflict movement, boundaries, and voice direction
- **AND** the sample defaults to not writing formal正文、tracking、canon or tasks

#### Scenario: Continue only after sample confirmation

- **GIVEN** the agent produced a chapter sample
- **WHEN** the author asks for changes or adds constraints
- **THEN** the agent revises the sample or returns to beat preview instead of generating the full chapter
- **AND** the full chapter is generated only after the sample is confirmed or rewritten by the author
