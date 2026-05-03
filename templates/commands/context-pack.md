---
description: 生成或刷新当前写作上下文包
argument-hint: [story/task/chapter]
allowed-tools: Read(//**), Write(//.specify/context-packs/**), Bash(*)
model: claude-sonnet-4-5-20250929
scripts:
  sh: .specify/scripts/bash/check-writing-state.sh
  ps: .specify/scripts/powershell/check-writing-state.ps1
---

用户输入：$ARGUMENTS

## 目标

生成 `.specify/context-packs/*.json` 和 `.md`，把下一次写作真正需要读的文件、允许修改范围、结构化事实和验证清单固定下来。

## 执行步骤

1. 解析用户输入中的 story、task、chapter 或 scene。
2. 可先运行 `{SCRIPT}` 了解当前故事状态；如目标已明确，可直接运行 `storyspec context:pack`，优先带上明确的 `--task`、`--chapter` 或 `--scene`。
3. 检查生成结果：
   - 每个 `mustRead` 必须有 `reason`。
   - 写作用途的 pack 必须把目标 Scene Card 作为 required mustRead；没有目标 Scene Card 时，constraints 必须提示先补卡预览。
   - 目标 Scene Card 必须说明 `plotThread`、`readerPromise`、`relationshipChange`、`worldReveal`、`emotionalBeat`、`endingHook`、`successCriteria`。
   - 如果存在 `.specify/memory/author-profile.json`，应进入 `mustRead`，reason 必须说明“只用于推荐和风味上下文，不作为故事正典”。
   - `allowedWrites` 必须来自任务边界或用户明确授权。
   - pack 不修改正文，只写 `.specify/context-packs/`。
4. 如已有 pack，运行 `storyspec context:validate <pack.json>` 检查是否过期、路径是否缺失。
5. 输出 pack 路径和下一步写作建议。

## 输出要求

- 不直接写正文。
- 不把无关文件塞进 mustRead。
- 不把缺少 Scene Card 的章节标成可直接写作；先让作者确认场景意图。
- 如果任务未 `[WRITE-READY]`，在 constraints 中保留阻塞说明。
