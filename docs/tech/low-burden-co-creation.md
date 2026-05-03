# 低负担共创模式

## 状态

Active。本文记录 F21 已落地的低负担创作体验：今日创作模式、最小快乐闭环和确认项退回候选。

## 今日创作模式

`storyspec next <story>` 会展示五个低负担入口：

- `我想玩角色`：默认进入主角/伙伴入口。
- `我想写一幕`：默认进入场景/舞台/能力入口。
- `我想整理设定`：默认进入世界/舞台/势力/能力入口。
- `我想比较分支`：默认进入分支/冲突/结尾入口。
- `我只想随便聊聊`：默认进入能力/舞台/主角入口。

每个模式都使用同一条低负担契约：

- 最多 2 个问题。
- 默认 2 个候选。
- 命令包含 `--max-questions 2 --no-write`。
- 输出必须说明候选边界，不写入文件，不生成完整大纲。
- 作者可以选择确认、改写、拒绝或稍后决定。

## 最小快乐闭环

F21 固定的首轮闭环是：

1. 选择一个今日创作模式。
2. 看 2 个有后果的候选。
3. 确认、改写、拒绝或稍后。
4. 得到一句创作回声。
5. 核心要素不足时阻止完整 plan。

这个闭环只检查 StorySpec 是否让作者更容易开始和继续创作，不评价作者创意质量。

## 可逆操作

`storyspec clarification:rollback --story <story>` 会把最近一次已确认回答退回候选。

也可以用 `--question <id>` 指定问题，例如：

```bash
storyspec clarification:rollback --story 编程施法 --question magic.rule-hardness
```

执行后：

- 原答案保留。
- `confirmed` 变为 `false`。
- `source` 变为 `ai-suggested`，使它回到“AI 建议，待确认”区域。
- `clarifications.json` 和 `clarifications.md` 会更新。
- 不修改 specification、creative-plan、正文、world 或 canon 文件。

## 参考项目落地

- Inquirer.js：借鉴轻量菜单、跳过和最小问题集，不强制终端交互。
- Twine：借鉴任意节点进入和路径探索，不新增图形节点编辑器。
- Redux：借鉴可追溯 action/event 的思想，当前先落到确认项退回候选。
- Cucumber.js：借鉴行为场景式验收，用 unit/smoke 测试固定低负担体验。
