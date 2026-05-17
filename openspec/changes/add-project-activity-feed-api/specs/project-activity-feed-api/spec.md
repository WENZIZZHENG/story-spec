# project-activity-feed-api

## ADDED Requirements

### Requirement: Project activity feed read API

The multiuser server SHALL expose a read-only project activity feed derived from audit events.

#### Scenario: project member reads activity feed

- GIVEN a project contains audit events for collaboration, agent job, membership, or project mutations
- WHEN a project member requests the activity feed
- THEN the response includes project id and activity items sorted by createdAt descending
- AND each item includes id, actorUserId, action, kind, source, summary, jobId, and createdAt
- AND the request does not create, update, or delete any audit event, job, collaboration object, or story file

#### Scenario: repository is not configured

- GIVEN the multiuser server has no audit repository configured
- WHEN a project member requests the activity feed
- THEN the server returns the standard repository-not-configured error
