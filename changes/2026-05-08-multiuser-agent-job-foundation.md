---
change_type: minor
scope: server,jobs,docs
---

# 多用户 AgentJob 状态机底座

## CLI 行为

无变化。未新增或修改 CLI 命令。

## 模板契约

无变化。未修改 agent prompt、slash command 模板或用户项目初始化模板。

## 生成产物

无变化。未手工修改 `dist/` 或命令生成产物。

## Server / Jobs

- 新增多用户 `AgentJob` foundation，包含 queued/running/succeeded/failed/canceled/timeout 状态。
- 新增 job 创建幂等语义、合法状态转移、取消和失败/超时重试。
- 当前不引入 Redis、BullMQ、worker、runtime adapter 或真实任务执行。

## 验证

- `npx openspec validate add-multiuser-agent-job-foundation --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-agent-job.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
