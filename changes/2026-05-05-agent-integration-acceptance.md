---
change_type: minor
scope: agent,docs,tests,openspec,todo
---

# Agent integration 准入清单

## CLI 行为

- 不新增 CLI 命令。
- 不新增具体 agent integration。
- 不改变 legacy `--ai` 兼容行为。

## 模板契约

- 新增 `src/agent/acceptance.ts`，提供 agent integration 准入清单和结构化检查函数。
- 当前 registry 会检查 id、metadata、install target 安全相对路径、renderer、slashPrefix 和 legacy 映射。
- 新增 `docs/tech/agent-integration-acceptance.md`，记录新增 agent 时必须同步的 renderer、manifest、init/upgrade/doctor smoke 和文档要求。

## 生成产物

- 不修改命令模板或生成产物。
- 不运行 `build:commands` 更新产物；本次只新增准入护栏。
- `dist/` 仍由 `npm run build` 生成，不手工维护。

## 验证

- `openspec validate define-agent-integration-acceptance --strict --json --no-interactive`
- `npx vitest run tests/unit/agent-registry.test.ts -t "acceptance scaffold"`
