# agent-job-log-read-api

## ADDED Requirements

### Requirement: Agent job log read API

The multiuser server SHALL expose a read-only job log timeline for the complete App task center.

#### Scenario: project member reads job logs

- GIVEN a project contains an agent job
- WHEN a project member requests `/api/projects/:projectId/jobs/:jobId/logs`
- THEN the response includes projectId, jobId, and ordered log entries
- AND the entries describe creation, current status, trace id, and failure reason when present
- AND the request does not mutate the job, queue, runtime, or story files

#### Scenario: job belongs to another project

- GIVEN a user requests logs for a job whose projectId differs from the route projectId
- WHEN the server validates the request
- THEN the server returns a forbidden project mismatch error
