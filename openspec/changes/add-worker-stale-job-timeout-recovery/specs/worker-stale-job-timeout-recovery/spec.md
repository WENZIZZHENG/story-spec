## ADDED Requirements

### Requirement: Stale worker recovery MUST timeout affected running jobs without requeueing
StorySpec MUST provide a recovery executor that clears running jobs abandoned by stale worker leases without automatically retrying them.

#### Scenario: stale running job is timed out
- **WHEN** a stale worker lease recovery plan includes a job that is still `running`
- **THEN** StorySpec MUST transition that job to `timeout`
- **AND** it MUST record a worker failure with a reason suitable for dashboard display.

#### Scenario: recovery avoids duplicate runtime execution
- **WHEN** stale worker recovery runs
- **THEN** StorySpec MUST NOT execute runtime, enqueue, retry, cancel, create proposal, or apply story/canon/tracking files.

#### Scenario: job no longer running
- **WHEN** a job from the recovery plan has already left `running`
- **THEN** StorySpec MUST skip that job and report the skip reason.
