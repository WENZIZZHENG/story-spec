# Agent Instructions

## Project
- Novel project: `{{PROJECT_NAME}}`.
- Work from the project root and run `novel status` before planning or writing.
- Use Chinese for author-facing notes unless the project files say otherwise.

## Workflow
| Stage | Codex prompt |
|-------|--------------|
| Constitution | `/novel-constitution` |
| Specification | `/novel-specify` |
| Clarification | `/novel-clarify` |
| Plan | `/novel-plan` |
| Tasks | `/novel-tasks` |
| Write | `/novel-write` |
| Analyze | `/novel-analyze` |

## Required Context
- Read `.specify/memory/constitution.md` first.
- Then read `stories/*/specification.md`, `stories/*/creative-plan.md`, and `stories/*/tasks.md`.
- Use `spec/knowledge/` for world, character, location, and voice facts.
- Use `spec/tracking/*.json` for continuity; keep JSON valid.

## Boundaries
- If the user asks for planning, only update planning files; do not draft chapter prose.
- Sensitive or adult story elements are kept as plot function, motivation, relationship change, consequence, and boundary notes unless the active writing task says otherwise.
- When a boundary is unclear, add a clarification task instead of expanding the scene.

## Profile
{{AGENTS_PROFILE_SECTION}}

## Files
- Planning: `stories/*/specification.md`, `stories/*/creative-plan.md`, `stories/*/tasks.md`.
- Drafts: `stories/*/content/`.
- Tracking: `spec/tracking/`.
- Knowledge: `spec/knowledge/`.
