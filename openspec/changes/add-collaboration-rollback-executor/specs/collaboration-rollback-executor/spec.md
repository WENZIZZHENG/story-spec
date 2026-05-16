# collaboration-rollback-executor

## ADDED Requirements

### Requirement: Collaboration rollback executor

The multiuser collaboration control plane SHALL roll back applied apply requests by writing explicit rollback content through project-scoped storage.

#### Scenario: author rolls back an applied request

- GIVEN a proposal has an applied apply request and every referenced patch has targetPath, rollbackContent, and rollbackHint
- WHEN a user with `apply-canon-change` permission executes the rollback request
- THEN the server writes each patch rollbackContent to the resolved project path
- AND the apply request status becomes `rolled-back`
- AND the proposal status becomes `rolled-back`
- AND an audit event records the rollback execution

#### Scenario: rollback is blocked

- GIVEN an apply request is not `applied`, references a missing patch, or a patch has no rollbackContent
- WHEN the rollback executor runs
- THEN no project file is written
- AND the apply request and proposal are not marked as rolled back

#### Scenario: target path is unsafe

- GIVEN a patch target path is absolute or contains `..`
- WHEN the HTTP rollback route resolves the target path
- THEN the request fails with the standard collaboration mutation error
- AND no file outside project dataRoot is written
