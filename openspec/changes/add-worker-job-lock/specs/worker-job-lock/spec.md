## ADDED Requirements

### Requirement: Worker job locks MUST prevent concurrent ownership
StorySpec MUST provide a worker job lock model that allows only one active worker owner for a job at a time.

#### Scenario: worker acquires an unlocked job
- **WHEN** a worker acquires a lock for an unlocked job
- **THEN** StorySpec MUST store an active lock with worker id, acquired time, heartbeat time, expiration time, and optional trace id.

#### Scenario: competing worker is blocked
- **WHEN** another worker attempts to acquire the same active unexpired job lock
- **THEN** StorySpec MUST reject the acquisition with a readable blocked reason.

#### Scenario: expired lock can be taken over
- **WHEN** the existing job lock has expired
- **THEN** StorySpec MUST allow a new worker to acquire the lock
- **AND** old owner heartbeat or release MUST be rejected.

#### Scenario: job lock is non-mutating outside lock state
- **WHEN** worker job lock operations run
- **THEN** StorySpec MUST NOT execute runtime, change job state, enqueue, retry, cancel, or apply story/canon/tracking files.
