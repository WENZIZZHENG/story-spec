## ADDED Requirements

### Requirement: Flow commands MUST expose shared JSON fields
Flow-style commands MUST expose shared top-level JSON fields while preserving existing command-specific fields.

#### Scenario: task finish exposes the shared shape
- **WHEN** `task:finish` returns JSON
- **THEN** the result MUST include `mode`, `wouldWrite`, `updatedFiles`, `checks`, `blocked`, `blockedReasons`, `nextActions`, and `commit`.

#### Scenario: docs finish exposes the shared shape
- **WHEN** `docs:finish` returns JSON
- **THEN** the result MUST include `mode`, `wouldWrite`, `updatedFiles`, `checks`, `blocked`, `blockedReasons`, `nextActions`, and `commit`.

#### Scenario: todo capture exposes the shared shape
- **WHEN** `todo:capture` returns JSON
- **THEN** the result MUST include `mode`, `wouldWrite`, `updatedFiles`, `checks`, `blocked`, `blockedReasons`, `nextActions`, and `commit`.

### Requirement: Flow command standardization MUST preserve compatibility
Flow command standardization MUST only add fields and MUST NOT remove existing command-specific JSON fields.

#### Scenario: existing fields remain available
- **WHEN** callers read command-specific fields such as `applied`, `writesFiles`, `draftRoadmap`, or `changedFiles`
- **THEN** those fields MUST remain present for the commands that already exposed them.
