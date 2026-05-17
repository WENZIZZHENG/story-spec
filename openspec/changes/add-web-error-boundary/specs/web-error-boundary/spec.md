## ADDED Requirements

### Requirement: Web shell MUST expose readable error boundaries
StorySpec MUST expose a read-only error boundary contract in the independent web shell.

#### Scenario: common error states are visible
- **WHEN** the web shell contract is built
- **THEN** it MUST expose unauthorized, forbidden, offline, blocked, and conflict error states.

#### Scenario: errors include next actions
- **WHEN** an error state is rendered
- **THEN** it MUST include a readable label, message, next action, severity, and retryable flag.

#### Scenario: error boundary is non-mutating
- **WHEN** the error boundary UI is rendered
- **THEN** StorySpec MUST NOT automatically retry, log out, apply changes, or modify permissions.
