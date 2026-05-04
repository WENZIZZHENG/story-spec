# Chapter Production Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the P0 chapter production workflow improvements from `docs/tech/chapter-production-workflow-roadmap.md`.

**Architecture:** Implement small application services behind existing CLI command groups. Keep high-impact writes behind preview/apply style flags, and preserve author control by making validation failures non-mutating.

**Tech Stack:** TypeScript, Commander, Vitest, existing `ProjectFileSystem` abstraction, existing StorySpec CLI command registration.

---

### Task 1: Scene Card Path Diagnostics And Fix

**Files:**
- Modify: `src/domain/story-structure.ts`
- Modify: `src/application/inspect-story-structure.ts`
- Modify: `src/cli/commands/story-structure.command.ts`
- Test: `tests/unit/story-structure.test.ts`
- Test: `tests/unit/inspect-story-structure.test.ts`

- [ ] **Step 1: Write failing domain test**

Add a test that parses a Scene Card with `requiredReads`, `allowedWrites`, and `draftPath` using `stories/demo/...` while the source file is under `stories/demo/scenes/scene-001.yaml`. Expect `INVALID_SCENE_STORY_PATH` warnings with suggested `content/chapter-001.md` style replacements.

- [ ] **Step 2: Run domain test and verify failure**

Run: `npm test -- tests/unit/story-structure.test.ts`
Expected: FAIL because the new issue code does not exist.

- [ ] **Step 3: Implement path diagnostics**

Add `INVALID_SCENE_STORY_PATH` issue support and a validator that detects `stories/<story>/...` values inside Scene Card path fields.

- [ ] **Step 4: Add application fix test**

Add a test for a new fix function that rewrites `stories/demo/content/chapter-001.md` to `content/chapter-001.md` in `requiredReads`, `allowedWrites`, and `draftPath`.

- [ ] **Step 5: Implement fix function and CLI flag**

Add `fixSceneCardPaths` and expose it as `storyspec scene:check <story> --fix-paths`. Default `scene:check` remains read-only.

- [ ] **Step 6: Verify task**

Run:
`npm test -- tests/unit/story-structure.test.ts tests/unit/inspect-story-structure.test.ts`
`npm run build`

### Task 2: `task:finish` Draft/Apply Baseline

**Files:**
- Create: `src/application/finish-writing-task.ts`
- Modify: `src/cli/commands/tasks-board.command.ts`
- Test: `tests/unit/finish-writing-task.test.ts`

- [ ] **Step 1: Write failing dry-run test**

Create a fixture story with `tasks.md`, `task-board.json`, one Scene Card, and a draft file. Expect `finishWritingTask({ taskId: 'T001' })` to report task, draft path, verification commands, and `wouldWrite: false`.

- [ ] **Step 2: Implement dry-run service**

Parse the task block from `tasks.md`, locate related Scene Card and draft path, and return a structured preview without writing.

- [ ] **Step 3: Write failing apply test**

Expect `apply: true` to mark `T001` as `[x]` in `tasks.md` and regenerate `task-board.json`.

- [ ] **Step 4: Implement apply path**

Reuse existing task board export logic where possible; keep failed preconditions non-mutating.

- [ ] **Step 5: Add CLI command**

Expose `storyspec task:finish <taskId> [story] --apply --json`. Leave `--commit` for a later slice if it would require larger Git adapter work.

- [ ] **Step 6: Verify task**

Run:
`npm test -- tests/unit/finish-writing-task.test.ts tests/unit/export-task-board.test.ts`
`npm run build`

### Task 3: Agent Flow Compression Baseline

**Files:**
- Create: `src/application/maintenance-context.ts`
- Create: `src/application/finish-docs-change.ts`
- Modify: `src/cli/program.ts`
- Test: `tests/unit/maintenance-context.test.ts`
- Test: `tests/unit/finish-docs-change.test.ts`

- [ ] **Step 1: Write failing `maint:context` test**

Expect `todo --brief` to return a one-screen summary of active todo entry, governing files, and validation commands.

- [ ] **Step 2: Implement `maint:context` service and CLI**

Read `docs/tech/todo-index.md` and emit concise human/JSON output. Keep it read-only.

- [ ] **Step 3: Write failing `docs:finish` preview test**

Expect preview output to include `git diff --check`, placeholder scan patterns, and no write operations by default.

- [ ] **Step 4: Implement `docs:finish` preview**

Provide command suggestions and structured output. Leave real commit execution to later if direct Git integration would grow the slice.

- [ ] **Step 5: Verify task**

Run:
`npm test -- tests/unit/maintenance-context.test.ts tests/unit/finish-docs-change.test.ts`
`npm run build`

### Task 4: Documentation And Route Status

**Files:**
- Modify: `docs/tech/chapter-production-workflow-roadmap.md`
- Add: `changes/2026-05-04-chapter-production-workflow.md`

- [ ] **Step 1: Update roadmap checkmarks**

Mark implemented P0 slices with completion notes and leave deferred pieces explicit.

- [ ] **Step 2: Add changeset**

Record new CLI behavior and boundaries.

- [ ] **Step 3: Verify full affected surface**

Run:
`npm run build`
`npm test`
`npm run test:smoke`
`npm run check:changes`

### Self-Review

- Spec coverage: P0-2 is fully covered; P0-1 covers dry-run/apply baseline and leaves Git commit as an explicit later slice if needed; P0-3 covers `maint:context` and `docs:finish` baseline.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: service names and CLI names are stable across tasks.
