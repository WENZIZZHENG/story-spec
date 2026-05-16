---
change_type: minor
scope: agent-runtime,worker,observability
---

# Agent Runtime 输出记录底座

## 背景

OpenHands headless executor 已能显式启用并生成 preview-only candidate，但运行结果还没有统一的 output record 模型。任务中心、日志面板、产物回传和前端审阅需要先共享一个不会自动 apply 的输出记录契约。

## 变化

- 扩展 `AgentRuntimeOutput`，支持 preview-only artifacts 和 runtime log entries。
- 新增 `AgentRuntimeOutputRecord`、`AgentRuntimeOutputRepository` 和内存 repository。
- `runAgentJobWithRuntime()` 可在 runtime 成功后保存 output record，包含 jobId、candidateRef、summary、artifacts、logs、traceId 和 createdAt。
- OpenHands headless 成功时将 bounded stdout/stderr 回传为 preview artifacts/logs。

## CLI 行为

无 CLI 行为变化。`storyspec worker` 的输出仍是 preview-only，不自动写入正文、正典、tracking 或正式故事文件。

## 模板契约

无模板契约变化。

## 生成产物

无生成产物变化，未修改 `dist/**`。

## 验证

- `npx openspec validate add-agent-runtime-output-records --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-agent-runtime.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
