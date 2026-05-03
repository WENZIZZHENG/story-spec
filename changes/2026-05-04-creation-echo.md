---
change_type: minor
scope: cli,application,docs,tests
---

# 创作回声摘要

## CLI 行为

- `storyspec creative:report` 新增“创作回声”区块，展示当前风味、最有生命力的核心部件、还差的关键部件和下一轮创作回声。
- `storyspec status` 在故事状态中新增“当前故事长成了什么”，让状态页不只报告文件和任务，也能回顾作者已经创造出的小说内容。
- 创作回声只引用已确认或部分确认的核心要素，同时继续保留缺口，不把未确认 AI 候选当成正典。

## 模板契约

- 本批次不修改 slash command 模板。
- 回声摘要属于报告和状态输出，不改变 specification、creative-plan、World Bible、Scene Card 或 tracking 的写入边界。

## 生成产物

- `creative:report --json` 输出新增 `creationEcho` 字段。
- `status` 的结构化结果中，故事摘要新增 `creationEcho` 字段，包含 `flavor`、`strongestParts`、`missingPieces` 和 `nextEcho`。

## 验证

- `npm run build`
- `npm test`
- `npm run test:smoke`
- `npm run check:changes`
- `npm run check:command-manifest`
