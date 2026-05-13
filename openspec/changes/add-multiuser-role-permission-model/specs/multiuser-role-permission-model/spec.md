## ADDED Requirements

### Requirement: Multiuser platform MUST define product roles before expanding collaboration
StorySpec MUST define a project-level role model for the first complete App collaboration surface.

#### Scenario: role definitions are read
- **WHEN** the multiuser role definitions are loaded
- **THEN** they MUST include owner, editor, reviewer, viewer, and agent
- **AND** each role MUST include a readable label, description, and permission decisions.

### Requirement: Permission matrix MUST cover core writing platform objects
StorySpec MUST define permission actions for project, story, chapter, candidate, comment, canon, agent job, export, delete, and membership management.

#### Scenario: role permission matrix is evaluated
- **WHEN** a permission decision is requested for a role and action
- **THEN** the decision MUST include action, state, reason, and `requiresConfirmation`
- **AND** denied decisions SHOULD include a request-access URL when a user can reasonably ask an owner.

### Requirement: High-impact actions MUST stay behind confirmation
StorySpec MUST not treat high-impact writes or lifecycle operations as ordinary allowed actions.

#### Scenario: owner performs a high-impact action
- **WHEN** an owner evaluates apply canon, publish chapter, manage members, export project, or delete project
- **THEN** the decision MUST require confirmation
- **AND** the action MUST remain auditable by later server endpoints.

### Requirement: Project access guard MUST support action-level authorization
StorySpec MUST keep the existing `userId + projectId` guard and add optional action-level authorization.

#### Scenario: insufficient role attempts an action
- **GIVEN** a viewer is a member of a project
- **WHEN** the viewer attempts to comment or run an agent job
- **THEN** project access MUST be blocked with a readable permission reason.
