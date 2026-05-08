## ADDED Requirements

### Requirement: Multiuser server core MUST expose stable health metadata
StorySpec MUST provide a framework-independent health model for the future multiuser server.

#### Scenario: health metadata is created
- **WHEN** the multiuser server core creates a health response
- **THEN** it MUST include service, status, version, and checkedAt
- **AND** status MUST be `ok`

### Requirement: Multiuser server core MUST create request contexts
StorySpec MUST provide a request context model with a stable request id for future HTTP adapters and job tracing.

#### Scenario: incoming request id is preserved
- **GIVEN** an incoming request id
- **WHEN** the request context is created
- **THEN** the context MUST use the incoming id

#### Scenario: missing request id is generated
- **GIVEN** no incoming request id
- **WHEN** the request context is created
- **THEN** the context MUST include a generated id

### Requirement: Multiuser server core MUST expose a standard error response
StorySpec MUST provide a standard error response shape that future HTTP adapters can return consistently.

#### Scenario: error response is created
- **GIVEN** a request context and domain error
- **WHEN** the server core creates an error response
- **THEN** the response MUST include statusCode, requestId, error.code, and error.message
