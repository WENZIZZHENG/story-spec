# 继续创作入口

这个文件是项目级断点入口。你可以先打开它，再决定是查看状态、生成 handoff、继续规划章节，还是验证项目。

## 常用指令

查看当前状态：

```powershell
storyspec status
```

生成断点上下文包：

```powershell
storyspec handoff
```

运行正式验证：

```powershell
storyspec validate
```

如果当前环境没有全局 `storyspec` 命令，使用本地脚本兜底：

```powershell
powershell -ExecutionPolicy Bypass -File .specify/scripts/powershell/validate-local.ps1
```

```bash
bash .specify/scripts/bash/validate-local.sh
```

## 继续写作前

1. 运行 `storyspec status`，确认当前故事和下一任务。
2. 若已有 `stories/<故事名>/handoff.md`，先读取 handoff；没有则运行 `storyspec handoff <故事名>`。
3. 写正文前确认章节目标、冲突、信息释放、情绪变化和结尾钩子。
4. 如果章节卡还没有准备好，从 `.specify/templates/authoring/chapter-card.md` 复制一份到 `stories/<故事名>/chapter-cards/` 后填写。
5. 正文完成后，按 `.specify/templates/authoring/tracking-update-checklist.md` 回填 tracking、canon、graph、knowledge 和任务状态。
6. 运行验证，并把无法自动验证的部分写进 handoff 或任务记录。

## 可复制给 Agent 的请求

继续下一章前先做章节卡：

```text
继续当前故事的下一章，先不要写正文。请读取 AGENTS.md、.specify/agent-contract.md、当前故事 specification.md、creative-plan.md、tasks.md 和 handoff.md，然后基于 .specify/templates/authoring/chapter-card.md 创建下一章章节卡。
```

检查开放承诺：

```text
请根据当前故事正文、spec/tracking/promises.json 和 .specify/templates/authoring/open-promises.md，整理故事级 open-promises.md。只记录正文已建立或作者已确认的承诺，候选规划必须标为待确认。
```

更新追踪：

```text
请根据最新正文，按 .specify/templates/authoring/tracking-update-checklist.md 更新受影响的 plot、timeline、character、relationships、promises、canon、graph 和 knowledge 文件；不要把未发生情节写入 canon。
```

## 边界

- `CONTINUE.md` 是导航，不是正典来源。
- `.specify/templates/authoring/*` 是模板，不代表任何故事事实已经成立。
- 未在正文发生、未被作者确认、或只是 agent 建议的内容，不得静默写入 canon、tracking 已完成状态或人物事实。
- 长期优化想法应进入待办或 OpenSpec change，不写成 README 中已经可用的能力。
