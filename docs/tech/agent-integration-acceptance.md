# Agent Integration 准入清单

## 状态

Active checklist。新增或增强 agent integration 前，先把对应 OpenSpec change 的范围对齐到本文；完成后必须能通过 registry、renderer、命令产物和 smoke 验证。

## 最小准入

新增 agent integration 必须满足：

- Registry：`AGENT_INTEGRATION_IDS` 与 `AGENT_INTEGRATIONS` 顺序一致，id 唯一。
- 元数据：`displayName`、`kind`、`commandSurface`、`capabilities`、`renderer` 完整。
- 安装目标：每个 target 的 `dir`、`commandsDir`、`distDir` 是安全相对路径，不能是绝对路径或包含 `..`。
- Renderer：`renderer` 必须能在 platform renderer registry 找到，或显式复用 `generic-markdown`。
- Slash 命令：`commandSurface: slash-command` 必须声明 `slashPrefix`。
- Legacy：属于旧 `--ai` 兼容层的 agent 必须保留同名 `legacyAiId`。

这些结构要求由 `src/agent/acceptance.ts` 和 `tests/unit/agent-registry.test.ts` 固定。

## 新增 Agent 时必须同步

- `src/agent/registry.ts`：新增 id、metadata、capabilities、install target 和 legacy 映射。
- `src/prompt/platform-renderers/`：新增或复用 renderer，并补 renderer fixture。
- `scripts/build-commands.cjs`：确认构建 agents 参数覆盖新 agent。
- `tests/unit/agent-registry.test.ts`：准入检查必须通过。
- `tests/unit/platform-renderers.test.ts`：renderer 必须覆盖新 agent。
- `tests/smoke/cli-init.test.ts` 或相关 smoke：覆盖 init、upgrade、doctor 中至少一个真实安装路径。
- `npm run build:commands` 与 `npm run check:command-manifest`：生成产物和 manifest 必须同步。
- `docs/agent-commands.md`、`docs/commands.md` 或相关用户文档：只写已实现入口，不提前承诺未实现 agent。
- `changes/*.md`：记录 CLI 行为、模板契约、生成产物和验证命令。

## 验收命令

```bash
npm run build
npx vitest run tests/unit/agent-registry.test.ts tests/unit/platform-renderers.test.ts
npm run build:commands
npm run check:command-manifest
npm run check:changes
git diff --check
```

如新增 agent 触发 CLI 安装路径变化，还必须补相关 smoke，并在 OpenSpec `tasks.md` 中列出目标测试。
