---
change_type: minor
scope: cli,application,docs,tests
---

# 新增故事核心信息面板

## CLI 行为

- 新增 `storyspec core [story]` 命令，用于集中查看核心创意、主角、核心伙伴、第一舞台、能力体系和创作边界。
- 支持 `--missing` 只显示缺失或未完成项，帮助作者下一轮共创时优先补关键空白。
- 支持 `--json` 输出结构化结果，便于后续工作台、面板或自动化流程复用。

## 模板契约

- 不修改故事模板结构，不新增正典字段。
- 核心面板只读取已有澄清记录和核心要素评估结果。

## 生成产物

- 新增核心信息面板应用服务和 CLI 命令注册。
- README 增加 `core` 命令说明。

## 验证

- `npm test -- tests/unit/story-core-summary.test.ts`
- `npm run build`
- `npx vitest run tests/smoke/core-cli.test.ts`
