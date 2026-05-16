## ADDED Requirements

### Requirement: Worker leases MUST track heartbeat and stale state
StorySpec MUST keep a worker lease model that future HA scheduling can use without changing job outputs.

#### Scenario: worker registers and refreshes heartbeat
- **WHEN** a worker registers a lease with a worker id, concurrency, active jobs, heartbeat time, and lease ttl
- **THEN** StorySpec MUST store a lease with `status: active`, `lastHeartbeatAt`, and `leaseExpiresAt`
- **AND** a later heartbeat MUST update `lastHeartbeatAt`, extend `leaseExpiresAt`, and replace the active job list.

#### Scenario: stale worker lease is detected
- **WHEN** a worker lease `leaseExpiresAt` is earlier than the current time
- **THEN** StorySpec MUST report that lease as stale
- **AND** it MUST NOT automatically requeue jobs or apply story, chapter, canon, or tracking files.

#### Scenario: worker stops intentionally
- **WHEN** a worker stops with a known timestamp
- **THEN** StorySpec MUST mark the lease as stopped
- **AND** the stopped lease MUST NOT appear in active worker lease listings.
