# OpenHands Headless Executor 首批切片设计

## Source Boundaries

- Runtime source: `src/server/agent-runtime/openhands-runner.ts`, `src/cli/commands/multiuser-worker.command.ts`.
- Tests: `tests/unit/multiuser-agent-runtime.test.ts`, `tests/unit/multiuser-worker-command.test.ts`.
- Docs: `.env.example`, `README.md`, `docs/deploy/self-hosted.md`, route roadmaps and changeset.

## Explicit Enablement

The worker command must only use the real executor when `STORYSPEC_OPENHANDS_HEADLESS=true`. Otherwise the OpenHands runner remains a PoC adapter that returns preview-only candidate metadata. This keeps existing local worker setups from unexpectedly launching an external headless agent.

## Executor Boundary

`OpenHandsHeadlessExecutor` receives an `OpenHandsExecutionPlan` and returns `{ exitCode, stdout, stderr }`. The runner interprets exit code and returns a preview-only `AgentRuntimeOutput` on success. Non-zero exit code throws an error so existing worker failure policy records it.

## Command Shape

The plan uses `openhands --headless --workspace <workspaceRoot> -t <task>`. The task text is generated from the job id, kind, runtime and StorySpec boundary instructions. The plan keeps `autoApply: false` to document that StorySpec does not treat headless execution as canonical apply.

## Author Control

OpenHands may produce candidate output, but StorySpec must not write it into official story files in this slice. Formal story/canon changes still require existing preview / confirm / apply flows.
