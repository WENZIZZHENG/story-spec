## ADDED Requirements

### Requirement: Multiuser server MUST expose collaboration canon mutations
StorySpec MUST expose project-scoped HTTP endpoints for creating collaboration proposals, review decisions, canon patches, and apply requests.

#### Scenario: repository is not configured
- **WHEN** a client calls a collaboration canon endpoint without a collaboration repository
- **THEN** the server MUST return `503`
- **AND** the error code MUST be `MULTIUSER_REPOSITORY_NOT_CONFIGURED`.

#### Scenario: proposal is created through HTTP
- **WHEN** an authenticated collaborator with `create-candidate` permission posts a proposal
- **THEN** the server MUST create a proposal for the current project actor
- **AND** the response MUST include the created proposal
- **AND** the server MUST record an audit event for the mutation.

### Requirement: Collaboration HTTP mutations MUST use project permissions
StorySpec MUST guard collaboration canon mutations with existing project role permissions.

#### Scenario: reviewer submits a decision
- **WHEN** an authenticated reviewer with `review-canon` permission submits a review decision
- **THEN** the server MUST save the decision
- **AND** the proposal status MUST follow the domain review state transition.

#### Scenario: non-owner requests apply
- **WHEN** a collaborator without `apply-canon-change` permission posts an apply request
- **THEN** the server MUST reject the mutation with project access denial.

### Requirement: Apply request API MUST remain preview-only
StorySpec MUST expose apply gate results without applying formal story, chapter, canon, or tracking files in this slice.

#### Scenario: apply request is ready
- **WHEN** an owner creates an apply request for an approved proposal with matching version and valid patch
- **THEN** the server MUST return an apply request with `ready` status
- **AND** the response MUST reference patch ids and reviewer ids
- **AND** no formal project files MUST be modified automatically.
