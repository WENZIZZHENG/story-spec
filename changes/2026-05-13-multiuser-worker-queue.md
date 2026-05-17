---
change_type: minor
scope: server,cli,deploy
---

# 多用户 worker 队列底座

## CLI 行为

- 新增 `storyspec worker` 入口，可读取 `STORYSPEC_DATABASE_URL`、`STORYSPEC_REDIS_URL` 和 `STORYSPEC_WORKER_CONCURRENCY`，以独立进程运行 agent job worker。
- 支持 `storyspec worker --once` 和 `STORYSPEC_WORKER_ONCE=true`，用于本地单次 worker 验证。

## 多用户控制面

- 新增 `AgentJobQueue` 边界、内存队列和 BullMQ/Redis adapter。
- `storyspec server` 在配置队列时会在新建 agent job 后 enqueue；幂等命中已有 active job 时不会重复入列。
- `/ready` 新增 queue configured / connected / worker / driver 状态。
- 新增 worker runner，消费 queued job 后通过现有 runtime adapter 执行，并保持 preview-only 输出。

## 模板契约

- 无 agent prompt、slash command 模板或用户项目初始化模板变化。

## 生成产物

- 无 `dist/**` 手工变更；运行 `npm run build` 后由 TypeScript 和 postbuild 脚本生成运行时代码。

## 部署

- `docker-compose.yml` 新增 `storyspec-worker` 服务。
- `.env.example` 新增 worker 相关配置。
- 自托管说明补充 PostgreSQL + Redis worker 的启动和边界说明。

## 边界

- 不自动 apply 正文、正典、tracking 或正式故事文件。
- 不实现真实 OpenHands headless 执行、生产级死信队列、dashboard、分布式锁、高可用调度或完整 SaaS。

## 验证

- `npx openspec validate add-multiuser-worker-queue --strict --json --no-interactive`
- `npx vitest run tests/unit/multiuser-worker-queue.test.ts tests/unit/multiuser-server.test.ts tests/unit/multiuser-worker-command.test.ts tests/unit/multiuser-agent-runtime.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
