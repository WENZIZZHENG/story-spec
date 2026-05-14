## ADDED Requirements

### Requirement: Collaboration proposals MUST preserve source and target version
StorySpec MUST model collaborative proposals as candidate objects with source refs, target resource, and version snapshot.

#### Scenario: proposal is created
- **WHEN** a collaborator or agent creates a proposal
- **THEN** the proposal MUST start as `draft`
- **AND** it MUST record actor, project, story, target resource, source refs, target version, risks, and created time
- **AND** it MUST NOT write formal story, chapter, canon, or tracking files.

### Requirement: Review decisions MUST gate apply requests
StorySpec MUST require review decisions or explicit author confirmation before a proposal can become an apply request.

#### Scenario: proposal lacks approval
- **WHEN** an editor creates an apply request for a proposal without an approval
- **THEN** the apply request MUST be `blocked`
- **AND** it MUST include a blocked reason explaining that approval is missing.

#### Scenario: author explicitly confirms
- **WHEN** the author creates an apply request with explicit confirmation
- **THEN** missing reviewer approval MUST NOT block the request
- **AND** the request MUST still run version, risk, patch, and source checks.

### Requirement: Canon patches MUST remain preview-only until a later apply executor
StorySpec MUST model canon patches without applying them to formal files in this slice.

#### Scenario: apply request is ready
- **WHEN** a proposal has approval, matching target version, source refs, non-blocking risks, and at least one patch with rollback hint
- **THEN** the apply request MUST be `ready`
- **AND** it MUST reference canon patches and reviewer ids
- **AND** no formal story, chapter, canon, or tracking file MUST be modified automatically.

### Requirement: Version or blocking risk conflicts MUST block apply requests
StorySpec MUST detect target version and blocking risk conflicts before an apply request can be ready.

#### Scenario: target version changed
- **WHEN** a proposal target version does not match the current target version
- **THEN** the apply request MUST be `blocked`
- **AND** it MUST include a version conflict blocked reason.

#### Scenario: proposal has blocking risks
- **WHEN** a proposal contains a blocking risk
- **THEN** the apply request MUST be `blocked`
- **AND** it MUST include the blocking risk messages.
