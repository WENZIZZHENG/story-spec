## ADDED Requirements

### Requirement: Multiuser audit foundation MUST record actor and project events
StorySpec MUST provide a reusable audit event model for multiuser actions.

#### Scenario: audit event is recorded
- **WHEN** a write or high-risk action is recorded
- **THEN** the event MUST include actorUserId, projectId, action, source, diffSummary, jobId, and createdAt

### Requirement: Multiuser quota foundation MUST check and consume quotas
StorySpec MUST provide user and project scoped quota checks for request, job, and token metrics.

#### Scenario: quota allows available capacity
- **GIVEN** a bucket has remaining capacity
- **WHEN** quota is checked
- **THEN** the result MUST allow the action

#### Scenario: quota blocks over-limit action
- **GIVEN** a bucket would exceed its limit
- **WHEN** quota is checked or consumed
- **THEN** the result MUST block the action with a readable reason

#### Scenario: quota consumption updates usage
- **GIVEN** a bucket has remaining capacity
- **WHEN** quota is consumed
- **THEN** the used value MUST increase by the requested amount
