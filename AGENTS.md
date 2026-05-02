# Agent Instructions

## Package Manager
- `bun.lock` is the lockfile; use `bun install` when available.
- npm scripts are canonical for contributors: `npm run build`, `npm run build:commands`, `npm run dev -- --help`.
- Do not add `package-lock.json` unless intentionally migrating package managers.

## Commit Attribution
AI commits MUST include:
```text
Co-Authored-By: (the agent model's name and attribution byline)
```

## Commands
| Task | Command |
|------|---------|
| Typecheck CLI | `npm run build` |
| Generate platform prompts | `npm run build:commands` |
| CLI smoke | `node dist/cli.js --help` |
| Codex status smoke | `node dist/cli.js codex-status --json` |

## Key Conventions
- `src/utils/ai-platforms.ts` is the single source for AI platform IDs, dirs, dist paths, display names, and slash prefixes.
- `templates/commands/*.md` is the source for generated slash prompts.
- `scripts/build-commands.cjs` locates bash and calls `scripts/build/generate-commands.sh`.
- `scripts/postbuild.cjs` keeps CLI executable bits cross-platform after TypeScript build.
- Codex prompts are pure Markdown in `.codex/prompts/novel-*.md`.
- User project data lives in `stories/`, `spec/tracking/`, and `spec/knowledge/`; avoid overwriting it during upgrades.
- For CLI behavior or template contract changes, update README/docs and add a short decision record under `docs/tech/`.
