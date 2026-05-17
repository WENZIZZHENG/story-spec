# agent-job-dashboard-read-api

## ADDED Requirements

### Requirement: Agent job dashboard read API

The multiuser server SHALL expose a read-only project job dashboard for the complete App task center.

#### Scenario: project member reads job dashboard

- GIVEN a project contains queued, running, succeeded, failed, canceled, or timeout jobs
- WHEN a project member requests the job dashboard
- THEN the response includes project id, total jobs, status counts, active count, retryable count, latest jobs, and queue readiness
- AND the request does not create, cancel, retry, or run any job

#### Scenario: memory queue snapshot is available

- GIVEN the server is wired with the memory queue
- WHEN a project member requests the job dashboard
- THEN the response includes pending, acknowledged, and failed queue item counts
