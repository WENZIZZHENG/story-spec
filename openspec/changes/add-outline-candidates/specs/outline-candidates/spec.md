## ADDED Requirements

### Requirement: Preserve the formal creative plan while creating outline candidates
StorySpec SHALL create outline candidates without modifying the formal `creative-plan.md` unless the author explicitly promotes a candidate.

#### Scenario: Author forks the current creative plan
- **WHEN** the author runs `storyspec outline:fork <story> --from current --title "<title>"`
- **THEN** StorySpec MUST create a candidate under `stories/<story>/outlines/<outline-id>/`
- **AND** the candidate MUST include `creative-plan.md`, `summary.md`, `risks.md`, and `outline.json`
- **AND** the formal `stories/<story>/creative-plan.md` MUST remain unchanged

#### Scenario: Author creates a new outline candidate from input
- **WHEN** the author runs `storyspec outline:new <story> --title "<title>"` with `--text` or `--file`
- **THEN** StorySpec MUST save the provided content as a candidate `creative-plan.md`
- **AND** StorySpec MUST NOT treat the candidate as confirmed canon or the formal creative plan

### Requirement: List and compare outline candidates
StorySpec SHALL let authors inspect multiple candidate outlines before choosing one.

#### Scenario: Author lists outline candidates
- **WHEN** the author runs `storyspec outline:list <story>`
- **THEN** StorySpec MUST show each candidate id, title, status, source, and update time
- **AND** StorySpec MUST NOT modify any outline or story file

#### Scenario: Author compares two outline candidates
- **WHEN** the author runs `storyspec outline:compare <story> <outline-a> <outline-b>`
- **THEN** StorySpec MUST output differences for main goal, character arc, pacing, risks, and reader promise
- **AND** StorySpec MUST NOT modify any outline or story file

### Requirement: Promote outline candidates through an explicit confirmation gate
StorySpec SHALL make outline promotion preview-first and require explicit confirmation before overwriting the formal creative plan.

#### Scenario: Author previews promotion
- **WHEN** the author runs `storyspec outline:promote <story> <outline-id>` without `--yes`
- **THEN** StorySpec MUST report dry-run mode
- **AND** StorySpec MUST NOT modify the formal `creative-plan.md`
- **AND** StorySpec MUST remind the author to re-check tasks, Scene Card, and Context Pack after promotion

#### Scenario: Author confirms promotion
- **WHEN** the author runs `storyspec outline:promote <story> <outline-id> --yes`
- **THEN** StorySpec MUST overwrite only the formal `stories/<story>/creative-plan.md` with the candidate plan
- **AND** StorySpec MUST mark the candidate as promoted
- **AND** StorySpec MUST NOT modify drafts, `tasks.md`, Scene Card, Context Pack, tracking, or canon files
