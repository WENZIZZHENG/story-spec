## 设计

第一版交付“准入护栏”，不新增具体 agent。

## 准入清单

新增 agent integration 必须满足：

- registry：`id` 在 `AGENT_INTEGRATION_IDS` 和 `AGENT_INTEGRATIONS` 中顺序一致且唯一。
- 元数据：`displayName`、`kind`、`commandSurface`、`capabilities`、`renderer` 完整。
- install target：至少一个 target，`dir`、`commandsDir`、`distDir` 非空，路径为相对路径，不能包含 `..` 或绝对路径。
- renderer：`renderer` 必须能在平台 renderer registry 中找到，或明确使用 `generic-markdown`。
- slash prefix：`slash-command` surface 必须声明 `slashPrefix`；非 slash surface 可选。
- legacy：legacy integration 必须同时出现在 `LEGACY_AI_INTEGRATION_IDS`，并保留旧 `--ai` 映射。
- 验证：新增 agent 时必须更新 renderer fixture、build:commands、command manifest、init/upgrade/doctor smoke 和 docs。

## 实现方式

新增 `src/agent/acceptance.ts`：

- `AGENT_INTEGRATION_ACCEPTANCE_CHECKS`：人读检查清单，用于文档和测试引用。
- `validateAgentIntegrationAcceptance(integration, options)`：返回结构化 issue 列表，供单测检查每个 integration。

单测调用该函数，不把断言散落在多个测试中。这样后续新增 agent 时，失败信息能指出缺哪一项。

## 非目标

- 不新增 agent id。
- 不修改 renderer 输出。
- 不运行 `build:commands` 产物更新。
- 不删除 legacy `--ai` 兼容层。
