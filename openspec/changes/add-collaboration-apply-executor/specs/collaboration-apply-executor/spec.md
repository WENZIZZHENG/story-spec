# collaboration-apply-executor

## ADDED Requirements

### Requirement: Collaboration apply executor

The multiuser collaboration control plane SHALL execute ready apply requests by writing explicit patch content through project-scoped storage.

#### Scenario: author applies a ready request

- GIVEN a proposal has approval, a ready apply request, and every referenced patch has targetPath, content, and rollbackHint
- WHEN a user with `apply-canon-change` permission executes the apply request
- THEN the server writes each patch content to the resolved project path
- AND the apply request status becomes `applied`
- AND the proposal status becomes `applied`
- AND an audit event records the apply execution

#### Scenario: apply is blocked

- GIVEN an apply request is not `ready`, references a missing patch, or a patch has no content
- WHEN the apply executor runs
- THEN no project file is written
- AND the apply request and proposal are not marked as applied

#### Scenario: target path is unsafe

- GIVEN a patch target path is absolute or contains `..`
- WHEN the HTTP apply route resolves the target path
- THEN the request fails with the standard collaboration mutation error
- AND no file outside project dataRoot is written
