## ADDED Requirements

### Requirement: Worker failures MUST be classified before future retry or dead-letter handling
StorySpec MUST classify worker failures with a stable reliability decision.

#### Scenario: runtime fails below max attempts
- **WHEN** a queued job fails during runtime execution and its attempt is below the configured max attempts
- **THEN** the worker MUST record a retryable failure
- **AND** it MUST NOT auto-apply story, chapter, canon, or tracking files.

#### Scenario: runtime fails at max attempts
- **WHEN** a queued job fails during runtime execution and its attempt reaches the configured max attempts
- **THEN** the worker MUST record a dead-letter failure
- **AND** it MUST keep the job failed for manual retry or inspection.

#### Scenario: payload references missing job or runtime
- **WHEN** the queue payload references a missing job or unregistered runtime
- **THEN** the worker MUST record a dead-letter failure
- **AND** it MUST include a reason suitable for future dashboard display.
