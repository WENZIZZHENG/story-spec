---
change_type: minor
scope: server
---

# Worker 可靠性策略底座

## CLI 行为

- `storyspec worker` 命令不变。

## 多用户控制面

- 新增 worker failure policy 和内存 failure repository。
- Worker runner 在 job missing、runtime missing、runtime failed 等失败路径记录 retryable/dead-letter 决策。

## 模板契约

- 无模板生成产物变化。

## 生成产物

- 不手工修改 `dist/**`。

## Worker 可靠性

- Runtime failure 在 attempt 小于 maxAttempts 时记录为 retryable。
- Runtime failure 达到 maxAttempts、job missing 或 runtime missing 时记录为 dead-letter。
- 本切片只记录可靠性决策，不自动重入队，也不改变现有 retry API。

## 边界

- 不实现 dashboard、告警、分布式锁、高可用调度或 BullMQ attempts 策略调整。
- 不修改 PostgreSQL schema。
- 不自动写正文、正典、tracking 或正式故事文件。

## 验证

- `npx openspec validate add-worker-reliability-policy --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-worker-reliability.test.ts tests/unit/multiuser-worker-queue.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
