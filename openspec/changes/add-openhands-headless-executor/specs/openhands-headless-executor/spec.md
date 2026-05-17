## ADDED Requirements

### Requirement: OpenHands runner MUST support explicit headless execution
StorySpec MUST support a real OpenHands headless executor only when explicitly configured.

#### Scenario: headless executor runs a queued OpenHands job
- **GIVEN** an OpenHands runner has an injected headless executor
- **WHEN** it starts an `openhands` job
- **THEN** it MUST call the executor with an `openhands --headless --workspace <root> -t <task>` plan
- **AND** it MUST return a preview-only candidate output that references the job
- **AND** it MUST NOT mark the output as canonical apply.

#### Scenario: headless command fails
- **GIVEN** the injected executor returns a non-zero exit code
- **WHEN** the runner starts the job
- **THEN** the runner MUST throw an error containing the exit code and stderr/stdout summary
- **AND** the existing worker failure path MUST be able to record the failure.

### Requirement: Worker command MUST keep OpenHands headless opt-in
StorySpec worker command MUST keep OpenHands headless disabled unless explicitly enabled.

#### Scenario: headless disabled by default
- **WHEN** `storyspec worker` builds its runtime adapters without `STORYSPEC_OPENHANDS_HEADLESS=true`
- **THEN** the OpenHands runner MUST remain a preview-only PoC adapter
- **AND** it MUST NOT launch an external process.

#### Scenario: headless enabled by environment
- **WHEN** `STORYSPEC_OPENHANDS_HEADLESS=true` is set
- **THEN** worker runtime wiring MUST create an OpenHands runner with a headless executor
- **AND** it MUST respect `STORYSPEC_OPENHANDS_COMMAND` and `STORYSPEC_OPENHANDS_PROMPT_PREFIX`.
