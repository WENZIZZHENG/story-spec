## ADDED Requirements

### Requirement: Stale worker leases MUST produce a read-only recovery plan
StorySpec MUST be able to build a read-only recovery plan from stale worker leases and current agent jobs.

#### Scenario: stale lease has a running job
- **WHEN** a stale worker lease references an active job that is still `running`
- **THEN** StorySpec MUST include that job in the recovery plan affected jobs
- **AND** the plan MUST include the worker id, lease expiration, trace id when present, and a recommended manual recovery action.

#### Scenario: stale lease references missing or non-running jobs
- **WHEN** a stale worker lease references a missing job
- **THEN** StorySpec MUST include that reference in `missingJobRefs`.
- **WHEN** a stale worker lease references a job that is not `running`
- **THEN** StorySpec MUST include that reference in `ignoredJobRefs`.

#### Scenario: recovery plan is non-mutating
- **WHEN** StorySpec builds a stale worker recovery plan
- **THEN** it MUST NOT requeue, retry, cancel, timeout, execute, or apply any job.
