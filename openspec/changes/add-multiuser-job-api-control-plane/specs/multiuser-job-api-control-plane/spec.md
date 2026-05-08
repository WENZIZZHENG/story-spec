## ADDED Requirements

### Requirement: Multiuser job API MUST create queued jobs
StorySpec MUST allow an authenticated project member to create a queued AgentJob through the server API.

#### Scenario: job is created
- **WHEN** a project member posts a job request
- **THEN** the server MUST return a queued job bound to that user and project

### Requirement: Multiuser job API MUST protect job ownership
StorySpec MUST ensure job reads and mutations stay inside the authorized project.

#### Scenario: job is queried
- **WHEN** a project member requests a job in their project
- **THEN** the server MUST return the job state

#### Scenario: job is canceled
- **WHEN** a project member cancels a queued or running job
- **THEN** the server MUST return the canceled state

#### Scenario: failed job is retried
- **WHEN** a project member retries a failed or timed out job
- **THEN** the server MUST return a new queued retry job
