# collaboration-canon-review-read-api

## ADDED Requirements

### Requirement: Collaboration canon review read panel

The multiuser server SHALL expose a read-only canon review panel for project members so the complete App can render proposal, review, patch, and apply request state without performing writes.

#### Scenario: project member reads canon review panel

- GIVEN a project contains collaboration proposals with review decisions, canon patches, and apply requests
- WHEN a project member requests the canon review panel
- THEN the response includes the project id, optional story id, proposal count, and proposal entries
- AND each proposal entry includes the proposal, related review decisions, related patches, and related apply requests
- AND the request does not modify official story files or mark any apply request as applied

#### Scenario: story filter narrows the panel

- GIVEN a project contains collaboration proposals for multiple stories
- WHEN the caller requests the canon review panel for one story id
- THEN only proposals for that story id are included

#### Scenario: missing collaboration repository is reported

- GIVEN the multiuser server is started without a collaboration repository
- WHEN a project member requests the canon review panel
- THEN the response is a repository-not-configured error
