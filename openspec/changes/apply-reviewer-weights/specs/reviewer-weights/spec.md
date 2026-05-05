## ADDED Requirements

### Requirement: reviewer loop MUST expose reviewer weights
Review results MUST include the effective reviewer weight and the source used to choose that weight.

#### Scenario: default reviewer weights preserve existing scores
- **WHEN** no project reviewer config or active preset reviewer weight exists
- **THEN** each reviewer weight MUST be `1`
- **AND** each reviewer weight source MUST be `default`
- **AND** score calculation MUST match the previous unweighted formula.

#### Scenario: project reviewer config overrides preset weights
- **WHEN** `spec/reviewer-config.json` defines `reviewerWeights`
- **THEN** matching reviewers MUST use those weights
- **AND** report `weightSource` as `project`.

#### Scenario: active preset weights apply when project config is absent
- **WHEN** an active preset manifest defines `reviewerWeights`
- **AND** `spec/reviewer-config.json` is absent or does not define a reviewer weight
- **THEN** matching reviewers MUST use the preset weight
- **AND** report `weightSource` as `preset`.

### Requirement: reviewer weights MUST only affect review prioritization
Reviewer weights MUST affect score intensity and display priority only; they MUST NOT rewrite author content or change finding ownership.

#### Scenario: weighted scores keep finding classification stable
- **WHEN** reviewer weights are configured
- **THEN** findings MUST retain their existing `reviewerId`
- **AND** task drafts MUST continue to reference the original finding.
