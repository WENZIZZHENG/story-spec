## Why

`task:finish`、`docs:finish` 和 `todo:capture` 都已经具备 preview / apply / commit / blocked 这类流程命令形态，但 JSON 字段不完全一致。后续自动化读取这些命令时需要统一判断 `mode`、写入计划、实际更新、检查结果、阻断原因、下一步和 commit 状态。

## What Changes

- 新增最小共享流程结果契约，保留旧字段兼容，只补齐缺失字段。
- `task:finish`、`docs:finish`、`todo:capture` 的 JSON 输出都包含 `mode`、`wouldWrite`、`updatedFiles`、`checks`、`blocked`、`blockedReasons`、`nextActions` 和 `commit`。
- 不改变命令业务行为、不删除已有字段、不把普通只读查询命令迁移到该契约。

## Impact

影响三个流程命令的应用结果结构、摘要渲染、单元测试、changeset 和待办状态。该变更只增加 JSON 字段，不移除已有字段。

## Capabilities

- `flow-command-results`
