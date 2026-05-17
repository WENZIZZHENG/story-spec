## ADDED Requirements

### Requirement: Runtime output records MUST persist in PostgreSQL
StorySpec MUST support PostgreSQL persistence for preview-only runtime output records.

#### Scenario: migration creates runtime output table
- **WHEN** multiuser migrations run
- **THEN** they MUST create `agent_runtime_outputs`
- **AND** the table MUST include job id, candidate ref, previewOnly flag, summary, artifacts, logs, trace id, and created timestamp.

#### Scenario: output record is saved and listed by job
- **GIVEN** a runtime output database repository
- **WHEN** it saves a preview-only output record
- **THEN** it MUST serialize artifacts and logs as structured JSON
- **AND** listing by job MUST return the same preview-only record shape.

#### Scenario: runtime output remains non-apply
- **WHEN** runtime output records are persisted
- **THEN** StorySpec MUST NOT write them to story, chapter, canon, tracking, or official files.
