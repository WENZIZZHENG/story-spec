## ADDED Requirements

### Requirement: Status Resume Lane

StorySpec MUST expose a concise resume lane that translates project status into one author-facing current state, one recommended next action, and explicit write boundaries.

#### Scenario: Summarize an opened project with a story

- **GIVEN** a StorySpec project has a current story
- **WHEN** the resume lane is requested
- **THEN** the response includes the project name, story name, story stage, state label, primary action, copyable command, status glossary, and boundaries
- **AND** the primary action explains whether it writes files, previews only, applies confirmed changes, or is read-only
- **AND** the boundaries state that StorySpec will not bypass preview / confirm / apply

#### Scenario: Summarize an empty project

- **GIVEN** a StorySpec project has no stories
- **WHEN** the resume lane is requested
- **THEN** the response tells the author to save an idea first
- **AND** the copyable command uses `storyspec story:new <故事名> --idea "<一句话创意>"`

### Requirement: Local App Resume Endpoint

The local App MUST expose the resume lane through a token-protected current-project endpoint.

#### Scenario: Read resume lane for current project

- **GIVEN** a project is opened in the current App session
- **WHEN** the user requests `/api/projects/current/resume`
- **THEN** the App returns the resume lane for the current project

#### Scenario: Reject resume lane without current session project

- **GIVEN** no project is opened in the current App session
- **WHEN** the user requests `/api/projects/current/resume`
- **THEN** the App returns a blocked response

### Requirement: Status Glossary

StorySpec MUST provide one shared glossary for common flow states used in CLI, App, and docs.

#### Scenario: Explain write-sensitive states

- **GIVEN** the author sees `candidate`, `preview`, `apply`, `dry-run`, `blocked`, `read-only`, `active`, or `planned`
- **WHEN** the resume lane or README describes the term
- **THEN** the explanation distinguishes candidate content from confirmed canon
- **AND** it distinguishes preview/dry-run from confirmed writes
