## ADDED Requirements

### Requirement: Login permission UI MUST expose read-only auth status
StorySpec MUST expose a read-only login and permission UI contract in the independent web shell.

#### Scenario: session and role are visible
- **WHEN** the independent web shell contract is built
- **THEN** it MUST include a login/permission panel with session state, current user label, project label, project role, and role description.

#### Scenario: permission decisions are visible
- **WHEN** the login/permission panel is rendered
- **THEN** it MUST list allowed and disabled permission actions
- **AND** disabled actions MUST include a readable reason and next action.

#### Scenario: account mutations are out of scope
- **WHEN** the login/permission UI slice is added
- **THEN** StorySpec MUST NOT create accounts, log users in or out, invite members, change roles, or bypass server-side permission checks.
