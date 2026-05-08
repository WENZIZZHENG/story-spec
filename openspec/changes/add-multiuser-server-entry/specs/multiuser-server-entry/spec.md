## ADDED Requirements

### Requirement: Multiuser server entry MUST start a loopback listener
StorySpec MUST provide a CLI-driven multiuser server entry that can bind a local loopback host for future multiuser APIs.

#### Scenario: server starts on loopback
- **WHEN** the CLI starts the multiuser server
- **THEN** the server MUST listen on `127.0.0.1` by default

### Requirement: Multiuser server entry MUST expose health and request context
StorySpec MUST provide health metadata and request id handling at the server entry layer.

#### Scenario: health endpoint is available
- **WHEN** the server receives `GET /health`
- **THEN** it MUST return stable health metadata from the server core

#### Scenario: request id is propagated
- **WHEN** the server handles a request with an incoming request id
- **THEN** the response MUST preserve or generate a stable request id

### Requirement: Multiuser server entry MUST return standard errors
StorySpec MUST use the shared server core error shape for unknown paths and unexpected errors.

#### Scenario: unknown path is requested
- **WHEN** the server receives an unknown path
- **THEN** it MUST return a standard error response with request id and machine-readable code
