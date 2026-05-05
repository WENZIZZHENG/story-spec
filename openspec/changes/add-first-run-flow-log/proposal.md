# add-first-run-flow-log 提案

## Why

真实首程使用中，作者已经能通过 `story:new` 和 `next` 获得下一步命令，但仍会追问“我现在在全流程的哪一步”“这一步做完会生成什么”“下一步为什么是这个”。这说明已有导航仍偏结果输出，缺少像控制台日志一样稳定出现的流程反馈。

本 change 聚焦第一刀：让新故事创建和下一步导航输出可读、可机器消费的首程流程日志。它不实现完整故事结构图，也不新增 GUI。

## What

- 为 `story:new` 和 `next` 的应用层结果增加 `firstRunFlow`，包含步骤列表、当前步骤、推荐下一步和 `progressLog`。
- CLI 默认人类输出增加低噪声 `[流程]`、`[产物]`、`[下一步]` 区块。
- `--json` 输出保留稳定结构，agent/UI 不需要解析中文文本即可知道当前阶段、产物和下一步。
- 继续保留 preview / confirm / apply 边界，不把流程提示变成自动确认或自动写正文。

## Impact

- 受影响范围：`story:new`、`next` 应用层 DTO、CLI 渲染、首程单元测试、必要 changeset。
- 非目标：不新增 `storyspec guide`，不实现 `story:map`，不输出 Mermaid，不卡住高级用户直接运行命令。
