## ADDED Requirements

### Requirement: Reverse reference notes into original candidates
StorySpec SHALL provide a preview-only workflow that turns author-provided reference work notes into original story candidates without copying protected expression or canon.

#### Scenario: Author previews reference reverse extraction
- **WHEN** the author runs `storyspec reference:reverse` with `--text` or `--file`
- **THEN** StorySpec MUST output a structured preview
- **AND** the preview MUST include original dependencies, high-risk similarities, translatable structures, new story candidates, and do-not-copy boundaries
- **AND** the preview MUST state that no story canon, world, specification, or content file was written

### Requirement: Preserve copyright and canon boundaries
StorySpec SHALL keep protected reference-specific details out of original canon by default.

#### Scenario: Notes include proper nouns or sequel intent
- **WHEN** the input contains named characters, factions, places, proprietary terms, or direct sequel/fanfic intent
- **THEN** those items MUST be classified as original dependencies or high-risk similarities
- **AND** they MUST NOT be emitted as confirmed original world facts
- **AND** the workflow MUST remind the author not to copy characters, locations, proprietary terms, plot lines, original wording, or unauthorized sequel prose

### Requirement: Support agent command guidance
StorySpec SHALL provide an agent command prompt for reference reverse extraction.

#### Scenario: Agent follows the reference reverse command
- **WHEN** the agent uses the generated reference reverse command
- **THEN** it MUST use only author-provided summaries, notes, or local research material
- **AND** it MUST not fetch, quote, or summarize protected full text
- **AND** it MUST output candidates that require preview, confirmation, and apply before entering canon
