## ADDED Requirements

### Requirement: Explicit location reference validation

The world consistency script SHALL compare explicitly marked location references in manuscript files against locations defined in `spec/knowledge/locations.md` headings.

#### Scenario: undefined explicit location reference
- **GIVEN** `locations.md` defines `## 云桥城`
- **AND** a chapter contains `@地点:雾港`
- **WHEN** `check-world.sh --checklist` runs
- **THEN** the checklist SHALL mark location reference validation as failed
- **AND** the output SHALL name `雾港` as an undefined location

#### Scenario: defined explicit location reference
- **GIVEN** `locations.md` defines `## 云桥城`
- **AND** a chapter contains `@地点:云桥城`
- **WHEN** `check-world.sh --checklist` runs
- **THEN** the location reference validation SHALL pass
