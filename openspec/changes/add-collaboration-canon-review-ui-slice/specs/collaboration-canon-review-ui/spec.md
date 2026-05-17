## ADDED Requirements

### Requirement: Complete App frontend architecture MUST expose collaboration canon review UI contract
StorySpec MUST expose a typed UI contract for the first collaboration canon review surface.

#### Scenario: collaboration canon review contract is built
- **WHEN** the frontend architecture contract is built
- **THEN** it MUST include a collaboration canon review section with proposal, review, patch, apply request, comment, activity, and rollback columns
- **AND** it MUST identify which user actions are read-only, comment/review, apply-confirmed, and rollback-confirmed.

#### Scenario: collaboration endpoints are mapped
- **WHEN** the frontend architecture API client contract is built
- **THEN** it MUST include endpoint definitions for canon review panel, proposal creation, proposal comments, proposal reviews, canon patches, apply requests, apply execution, rollback execution, and project activity feed
- **AND** apply and rollback execution endpoints MUST use an apply-confirmed boundary.

### Requirement: Local App shell MUST present a collaboration canon review desk
The local App HTML MUST render the collaboration canon review contract without claiming full realtime collaboration.

#### Scenario: local shell renders collaboration review desk
- **WHEN** `renderLocalAppHtml` renders the shell
- **THEN** it MUST include the collaboration canon review desk label, the status columns, endpoint ids, project/story input placeholders, and author confirmation boundary language
- **AND** it MUST state that the local shell is a contract and navigation surface, not the final realtime collaboration UI.
