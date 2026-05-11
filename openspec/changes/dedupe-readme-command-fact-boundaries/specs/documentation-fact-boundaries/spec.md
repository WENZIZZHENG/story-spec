## ADDED Requirements

### Requirement: README high-frequency command table MUST avoid duplicate commands
StorySpec README documentation MUST keep the high-frequency command tables unique by command string.

#### Scenario: user reads high-frequency commands
- **WHEN** README renders the `## 高频命令` section
- **THEN** each command string in the first column MUST appear at most once
- **AND** duplicate rows such as repeated `storyspec server [--host <host>] [--port <port>]` or `storyspec reference:reverse [story]` MUST be removed

### Requirement: README App and Server rows MUST preserve experimental boundaries
StorySpec README documentation MUST describe local App and multi-user Server entries without implying future platform capabilities are complete.

#### Scenario: user reads app and server command rows
- **WHEN** README describes `storyspec app`
- **THEN** it MUST say the App is experimental/local and does not include account, cloud, or rich text editor capabilities
- **WHEN** README describes `storyspec server`
- **THEN** it MUST say the Server is an experimental control plane and does not include complete SaaS, real worker, or full database integration capabilities
