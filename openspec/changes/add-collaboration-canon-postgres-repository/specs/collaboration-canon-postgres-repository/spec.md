## ADDED Requirements

### Requirement: Multiuser database MUST persist collaboration canon objects
StorySpec MUST define PostgreSQL tables for collaboration proposals, review decisions, canon patches, and apply requests.

#### Scenario: migration plan is created
- **WHEN** the multiuser migration plan is built
- **THEN** it MUST include tables for collaboration proposals, review decisions, canon patches, and apply requests
- **AND** the migration version MUST be incremented from the previous core database version.

### Requirement: Database repositories MUST expose collaboration canon repository
StorySpec MUST expose a PostgreSQL-backed `CollaborationCanonRepository` through the multiuser database repository factory.

#### Scenario: proposal lifecycle is saved through repository
- **WHEN** a caller saves a proposal, review decision, canon patch, and apply request through database repositories
- **THEN** the repository MUST write each object to its matching collaboration table
- **AND** read APIs MUST map database rows back to the existing domain object shape.

### Requirement: PostgreSQL-backed server MUST wire collaboration repository
StorySpec MUST pass the database collaboration repository into the multiuser server when `STORYSPEC_DATABASE_URL` is configured.

#### Scenario: server command starts with database
- **WHEN** `storyspec server` starts with a PostgreSQL database connection
- **THEN** the server input MUST include `collaborationRepository`
- **AND** `/ready.repositories.collaboration` can report configured for database-backed deployments.
