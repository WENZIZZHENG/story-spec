## MODIFIED Requirements

### Requirement: Reverse reference notes into original candidates
StorySpec SHALL provide a preview-only workflow that turns author-provided reference work notes into original story candidates without copying protected expression or canon.

#### Scenario: Author previews reference reverse extraction
- **WHEN** the author runs `storyspec reference:reverse` with `--text` or `--file`
- **THEN** StorySpec MUST output a structured preview
- **AND** the preview MUST include original dependencies, high-risk similarities, translatable structures, new story candidates, and do-not-copy boundaries
- **AND** the preview MUST additionally distinguish appeal signals, reader promises, repair directions, and originalization guidance
- **AND** the preview MUST state that no story canon, world, specification, tracking, or content file was written

### Requirement: Support original development from reference notes
StorySpec SHALL help authors convert liked structures and disliked reference-work outcomes into original development inputs.

#### Scenario: Notes include likes, dislikes, and repair wishes
- **WHEN** the author-provided notes describe liked elements, uncomfortable later plot choices, unfinished promises, or desired fixes
- **THEN** StorySpec MUST separate what the author liked from what cannot be copied
- **AND** StorySpec MUST describe how the liked structure can be originalised without preserving protected names, plot lines, proprietary terms, or direct sequel continuity
- **AND** StorySpec MUST surface reader promises and repair directions as preview candidates requiring later confirmation

### Requirement: Preserve copyright and canon boundaries
StorySpec SHALL keep protected reference-specific details out of original canon by default.

#### Scenario: Notes include proper nouns or sequel intent
- **WHEN** the input contains named characters, factions, places, proprietary terms, or direct sequel/fanfic intent
- **THEN** those items MUST be classified as original dependencies or high-risk similarities
- **AND** they MUST NOT be emitted as confirmed original world facts
- **AND** the workflow MUST remind the author not to copy characters, locations, proprietary terms, plot lines, original wording, unauthorized sequel prose, or unresolved original canon
