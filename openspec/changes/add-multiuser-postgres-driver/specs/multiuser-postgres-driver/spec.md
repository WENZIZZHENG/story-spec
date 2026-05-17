## ADDED Requirements

### Requirement: Multiuser server MUST support a PostgreSQL-backed repository boundary
StorySpec MUST provide a PostgreSQL driver adapter that implements the existing multiuser database executor boundary.

#### Scenario: executor runs queries through a connection pool
- **WHEN** repository code calls `queryOne`, `queryMany`, or `execute`
- **THEN** the PostgreSQL executor MUST route the call through the configured pool
- **AND** repository modules MUST NOT depend directly on `pg`.

### Requirement: PostgreSQL migrations MUST be repeatable
StorySpec MUST provide a migration runner for the multiuser schema.

#### Scenario: migrations run on a fresh database
- **WHEN** the migration runner executes against a fresh database
- **THEN** it MUST create the migration tracking table
- **AND** it MUST execute all current schema statements
- **AND** it MUST record the current migration version.

#### Scenario: migrations run again
- **WHEN** the current migration version is already recorded
- **THEN** the runner MUST skip schema statements
- **AND** it MUST still report the current version as applied.

### Requirement: Readiness MUST expose database state separately from process health
StorySpec MUST report database configured, connected, and migrated state from `/ready`.

#### Scenario: database is configured and migrated
- **WHEN** `/ready` is requested on a PostgreSQL-backed server
- **THEN** the response MUST show database configured, connected, and migrated as true.

#### Scenario: database is not configured
- **WHEN** `/ready` is requested without `STORYSPEC_DATABASE_URL`
- **THEN** the response MUST show database configured as false
- **AND** `/health` MUST still be allowed to report process liveness.
