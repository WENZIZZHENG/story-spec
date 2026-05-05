## Why

StorySpec 已经支持多个 agent integration 和平台 renderer，但后续新增 agent 时缺少统一准入清单。现在只靠已有 registry / renderer 测试很难提醒开发者同步 install target、renderer、命令产物、doctor、init/upgrade smoke、manifest 和文档，容易出现“registry 写了，但命令产物或验证没跟上”的半成品。

## What Changes

- 新增 agent integration 准入清单文档，明确新增或增强 agent 时必须覆盖的字段、renderer、生成产物、doctor、init/upgrade、manifest 和文档同步。
- 新增可复用的 agent integration acceptance 检查定义，供单测验证 registry 中每个 integration 的最低结构要求。
- 扩展 agent registry 单测，确保每个 integration 的 install target、renderer、slashPrefix / commandSurface、legacy 映射和路径格式满足准入要求。
- 同步 changeset 和路线状态。

## Impact

影响 `src/agent/`、agent registry 单测、技术文档、changeset 和路线状态。不新增具体 agent，不改变既有 renderer 输出，不修改生成产物。

## Capabilities

- `agent-integration-acceptance`
