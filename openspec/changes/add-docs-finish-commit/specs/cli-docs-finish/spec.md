## ADDED Requirements

### Requirement: docs:finish MUST preview documentation-only finishing checks
`docs:finish` MUST keep a preview mode that does not write files, run commits, or mutate Git state.

#### Scenario: preview with commit message
- **WHEN** the user runs `docs:finish --message "记录文档变更"`
- **THEN** the system MUST output the documentation finish checks
- **AND** the output MUST include the planned commit command
- **AND** the system MUST NOT create a commit

### Requirement: docs:finish MUST block commit when documentation checks fail
`docs:finish --commit` MUST run documentation-only finish checks before creating a local commit.

#### Scenario: diff check fails
- **GIVEN** `git diff --check` returns a non-zero exit code
- **WHEN** the user runs `docs:finish --commit --message "记录文档变更"`
- **THEN** the system MUST NOT create a commit
- **AND** the result MUST contain a blocked reason for `git diff --check`

#### Scenario: placeholder scan finds unresolved markers
- **GIVEN** documentation files contain `TBD`, `TODO`, or `待定`
- **WHEN** the user runs `docs:finish --commit --message "记录文档变更"`
- **THEN** the system MUST NOT create a commit
- **AND** the result MUST list the placeholder finding.

### Requirement: docs:finish MUST commit only documentation-only changes
`docs:finish --commit` MUST create a local commit only when checks pass and the Git worktree contains only documentation or specification-record changes.

#### Scenario: documentation-only changes are committed
- **GIVEN** documentation checks pass
- **AND** Git status contains only `docs/**`, `changes/*.md`, or OpenSpec record files
- **WHEN** the user runs `docs:finish --commit --message "记录文档变更"`
- **THEN** the system MUST stage the safe files
- **AND** create a local commit using the requested message.

#### Scenario: non-documentation changes skip commit
- **GIVEN** documentation checks pass
- **AND** Git status contains `src/application/example.ts`
- **WHEN** the user runs `docs:finish --commit --message "记录文档变更"`
- **THEN** the system MUST NOT create a commit
- **AND** the result MUST explain that non-documentation changes exist.
