## ADDED Requirements

### Requirement: Multiuser database foundation MUST define core metadata tables
StorySpec MUST provide a PostgreSQL metadata model for user, session, project, membership, job, audit, and quota records.

#### Scenario: schema is created
- **WHEN** the database foundation is initialized
- **THEN** it MUST define tables for user, session, project, membership, agent job, audit log, and quota bucket

### Requirement: Multiuser database foundation MUST support repeatable migration initialization
StorySpec MUST provide a repeatable migration entrypoint for the multiuser metadata schema.

#### Scenario: initialization runs twice
- **WHEN** the migration initializer is run twice
- **THEN** it MUST not corrupt the schema or duplicate the metadata tables

### Requirement: Multiuser database foundation MUST expose repository boundaries
StorySpec MUST define repository interfaces that later server features can swap from memory to database implementations.

#### Scenario: repository boundaries are consumed
- **WHEN** session, project, job, audit, or quota features request storage
- **THEN** they MUST be able to target a repository interface without embedding SQL in the business layer
