---
change_type: minor
scope: cli,application,tests
---

# 创作成果骨架报告

## CLI 行为

- `storyspec creative:report` 新增“你已经创建的小说骨架”，用于回答当前故事已经成形到哪里。
- `storyspec creative:report` 新增“仍可探索的乐趣点”，把伙伴、舞台、能力、威胁、成功路线和作品声音缺口转成可继续共创的问题。
- 建议下一步会包含创作问题和命令，而不只是命令名。

## 模板契约

- 本批次不修改 slash command 模板。
- 成果骨架只引用用户确认或部分确认的核心要素，不把未确认 AI 候选算作已创建成果。

## 生成产物

- `creative:report --json` 输出新增 `storySkeleton` 和 `funPrompts` 字段。
- `storySkeleton` 区分已创建内容和小说灵魂仍待共创的部分。

## 验证

- 已运行 `npx vitest run tests/unit/creative-report.test.ts`。
