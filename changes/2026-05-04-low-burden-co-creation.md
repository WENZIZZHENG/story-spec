---
change_type: minor
scope: cli,application,domain,docs,tests
---

# 低负担共创模式

## CLI 行为

- `storyspec next <story>` 新增“今日创作模式”，展示我想玩角色、我想写一幕、我想整理设定、我想比较分支、我只想随便聊聊。
- 今日创作模式默认渲染为 `storyspec interview <story> --focus <entry> --max-questions 2 --no-write`，强调低负担候选和不写入文件。
- 新增 `storyspec clarification:rollback --story <story> [--question <id>]`，可将最近一次确认或指定问题退回候选。

## 模板契约

- 今日创作模式保留候选/确认边界，不绕过作者确认。
- 退回候选会保留原答案和证据路径，并把答案重新放回“AI 建议，待确认”区域。

## 生成产物

- `clarification:rollback` 会更新 `stories/<story>/clarifications.json` 和 `clarifications.md`。
- 不修改 specification、creative-plan、正文、world 或 canon 文件。

## 验证

- 新增/更新 unit tests 覆盖今日创作模式、最小快乐闭环和确认项退回候选。
- 新增 CLI smoke 覆盖 `clarification:rollback`。
