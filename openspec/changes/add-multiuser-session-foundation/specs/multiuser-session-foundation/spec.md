## ADDED Requirements

### Requirement: Multiuser sessions MUST resolve an authenticated user context
StorySpec MUST provide a reusable session guard that resolves a session token to an authenticated user context.

#### Scenario: valid session is accepted
- **GIVEN** an active session token for an existing user
- **WHEN** the session guard evaluates the token
- **THEN** it MUST return the user context

#### Scenario: missing token is rejected
- **GIVEN** no session token
- **WHEN** the session guard evaluates the request
- **THEN** it MUST reject the request
- **AND** it MUST explain that a session token is required

### Requirement: Multiuser sessions MUST expire and revoke
StorySpec MUST reject expired or revoked sessions.

#### Scenario: expired session is rejected
- **GIVEN** a session token whose expiry is in the past
- **WHEN** the session guard evaluates the token
- **THEN** it MUST reject the request

#### Scenario: revoked session is rejected
- **GIVEN** a session token has been revoked
- **WHEN** the session guard evaluates the token
- **THEN** it MUST reject the request
