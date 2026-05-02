# Novel Writer Agent Contract

## Project Identity

- This is a Novel Writer fiction project named `{{PROJECT_NAME}}`.
- The project protocol is agent-neutral. Codex, Claude, Gemini, Cursor, generic Markdown agents, and other tools are integrations.
- The CLI manages project files and validation. It is not the writing agent.
- Use Chinese for author-facing notes unless project files state otherwise.

## Read Order

1. `AGENTS.md`
2. `.specify/agent-contract.md`
3. `.specify/memory/constitution.md`
4. `stories/*/specification.md`
5. `stories/*/creative-plan.md`
6. `stories/*/tasks.md`
7. `spec/tracking/*.json`
8. `spec/knowledge/*`
9. `stories/*/content/*`

## Write Boundaries

- Only edit files that the active task explicitly allows.
- Planning tasks may update planning files, but must not draft chapter prose.
- Writing tasks may update chapter content and tracking files declared by the task.
- Keep tracking JSON valid and preserve user-authored story data.
- If the boundary is unclear, add or request a clarification task instead of guessing.

## Task State Rules

- Mark one task `in_progress` when starting focused work.
- Mark a task `done` only after its required outputs exist and validation has run or a clear validation limitation is recorded.
- Do not mark unrelated tasks done while completing another task.

## Tracking Rules

- After writing or revising content, update affected plot, timeline, relationship, character, and knowledge tracking files.
- Record newly introduced facts as evidence-backed entries; do not treat agent guesses as canon.
- If a fact needs author confirmation, mark it as pending instead of silently canonizing it.

## Handoff Rules

- Before ending a long session, create or update `handoff.md` when the project already uses handoff files.
- Include current story, active task, changed files, validation result, blockers, and next suggested action.

## Validation Rules

- Before finishing a stage, run `novel validate` when shell access is available.
- If shell access is unavailable, manually check the required read/write files and record what could not be verified.
- Prefer JSON output for automated agents: `novel validate --json`.

## Generic Agent Fallback

- If slash commands are unavailable, read `.specify/commands/*.md` and follow the corresponding command document manually.
- If shell commands are unavailable, execute the documented file-reading and writing steps directly.
- If file writes are unavailable, return a patch-style plan with exact target paths and content changes.

## Content Boundaries

- High-risk or sensitive story elements should be handled as plot function, motivation, consent boundary, relationship change, consequence, and task metadata.
- Do not expand sensitive material beyond the active task boundary.
- Preserve empathy, agency, aftermath, and authorial intent.

## Active Profiles

{{AGENTS_PROFILE_SECTION}}
