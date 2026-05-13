## ADDED Requirements

### Requirement: Multiuser API MUST expose a stable contract envelope
The multiuser API contract MUST define a shared response envelope for future server responses and web client fixtures.

#### Scenario: successful page state response
- **WHEN** a page contract response is created
- **THEN** it MUST include `requestId`, `data`, `permissions`, `resourceVersion`, and `warnings`
- **AND** it MUST NOT include an `error` object.

#### Scenario: error response
- **WHEN** an error contract response is created
- **THEN** it MUST include `requestId`, `error.code`, `error.message`, and `statusCode`
- **AND** it MUST use a stable error code from the contract error vocabulary.

### Requirement: API contract MUST describe first-batch App page endpoints
The contract MUST map the first complete App pages to endpoint metadata that future frontend work can consume.

#### Scenario: first-batch page map is requested
- **WHEN** the contract page map is read
- **THEN** it MUST include workspace projects, story cockpit, chapter writing, canon review, task center, and members permissions
- **AND** each page MUST include an endpoint, method, description, success status, permission actions, and expected states.

### Requirement: API contract MUST model frontend permission states
The contract MUST model permission states as actionable UI decisions, not only booleans.

#### Scenario: permission decision disables a high-risk action
- **WHEN** a permission decision is denied, disabled, or requires confirmation
- **THEN** it MUST include an action, state, reason, and `requiresConfirmation`
- **AND** it MAY include a request-access URL.

### Requirement: API contract fixtures MUST cover critical frontend states
The repository MUST include fixtures for frontend and contract tests.

#### Scenario: fixture set is validated
- **WHEN** contract fixtures are loaded
- **THEN** they MUST cover success, empty, unauthorized, forbidden, conflict, blocked, and offline
- **AND** each fixture MUST use the shared envelope or error shape.
