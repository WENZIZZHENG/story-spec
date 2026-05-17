## ADDED Requirements

### Requirement: Runtime outputs MUST be recordable as preview-only artifacts
StorySpec MUST support recording runtime outputs without applying them to official story files.

#### Scenario: successful runtime output is recorded
- **GIVEN** `runAgentJobWithRuntime()` is called with an output repository
- **WHEN** the runtime succeeds with a preview-only output
- **THEN** StorySpec MUST save an output record containing jobId, candidateRef, summary, artifacts, logs, traceId, and createdAt
- **AND** the record MUST keep `previewOnly: true`.

#### Scenario: OpenHands headless returns stdout and stderr
- **WHEN** OpenHands headless execution succeeds with stdout or stderr text
- **THEN** the runtime output MUST include bounded preview artifacts/logs for those streams
- **AND** StorySpec MUST NOT write them to story, chapter, canon, tracking, or official files.

#### Scenario: runtime fails
- **WHEN** runtime execution fails
- **THEN** StorySpec MUST NOT save a successful output record
- **AND** the existing job failure path MUST still record the runtime error on the job.
