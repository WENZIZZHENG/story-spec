## MODIFIED Requirements

### Requirement: Require confirmation before chapter prose
StorySpec SHALL require agents to present chapter preflight constraints for author confirmation before drafting chapter prose, while treating the confirmed card as a drafting boundary rather than a sentence-by-sentence drafting checklist.

#### Scenario: Write command prepares a chapter
- **WHEN** an agent follows the `/write` command for a chapter task
- **THEN** it MUST output a chapter preflight constraint card before scene beat preview or prose
- **AND** it MUST wait for author confirmation or revision before drafting prose
- **AND** it MUST state that the card is used for pre-write confirmation and post-write self-check, not as a sentence-by-sentence prose drafting filter

### Requirement: Check prose against preflight constraints
StorySpec SHALL require post-write summaries to compare drafted prose with the preflight constraints after prose drafting has happened.

#### Scenario: Chapter drafting finishes
- **WHEN** the agent reports the chapter finish stage
- **THEN** it MUST state whether hard constraints were preserved and list any unresolved or manually-confirmed constraint risks
- **AND** this self-check MUST happen after prose drafting, so that prose drafting can prioritize embodied experience, sensory detail, actions, immediate reactions, and sentence texture
