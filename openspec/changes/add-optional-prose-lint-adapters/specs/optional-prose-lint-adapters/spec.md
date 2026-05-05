## ADDED Requirements

### Requirement: style lint MUST support optional prose lint adapters
`style:lint` MUST expose optional prose lint adapter status without requiring external tools to be installed.

#### Scenario: configured adapter is skipped when no runner is available
- **WHEN** `spec/style/adapters.json` enables `vale`
- **AND** no external runner is provided
- **THEN** `style:lint --json` MUST include an adapter status of `skipped`
- **AND** built-in style lint findings MUST still be reported.

#### Scenario: adapter runner findings are merged
- **WHEN** an adapter runner returns findings for `textlint`
- **THEN** those findings MUST be included in `style:lint` output
- **AND** each finding MUST include a source that identifies the adapter.

### Requirement: prose lint adapters MUST remain non-destructive
Optional prose lint adapters MUST NOT automatically modify author prose.

#### Scenario: adapter output remains findings only
- **WHEN** an adapter returns a finding
- **THEN** StorySpec MUST add it to the lint report
- **AND** MUST NOT rewrite the source file.
