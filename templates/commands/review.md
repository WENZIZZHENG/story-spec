---
description: 运行 reviewer loop，输出多审稿人 findings 与任务草稿
argument-hint: [--panel worldbuilding,voice,continuity,editor,reader] [--chapter 章节号]
allowed-tools: Read(.specify/agent-contract.md), Read(.specify/memory/constitution.md), Read(stories/**), Read(spec/world/*.yaml), Read(spec/canon/*.json), Read(spec/graph/*.json), Read(spec/voice/**), Write(spec/reports/**), Bash(novel:*), Bash(node:*), Bash(*)
model: claude-sonnet-4-5-20250929
scripts:
  sh: storyspec review --json
  ps: storyspec review --json
---

运行小说项目审稿面板，只输出结构化发现和任务草稿，不直接改正文。

用户输入：$ARGUMENTS

## 必须读取

- `.specify/agent-contract.md`
- `.specify/memory/constitution.md`
- `stories/*/specification.md`
- `stories/*/creative-plan.md`
- `stories/*/tasks.md`
- `stories/*/clarifications.json`
- `stories/*/clarifications.md`
- `stories/*/scenes/*.yaml`
- `stories/*/content/**`
- `spec/world/*.yaml`
- `spec/canon/*.json`
- `spec/graph/*.json`
- `spec/voice/**`

## 执行步骤

1. 运行 `storyspec review --json`，如用户指定 panel 或 chapter，同步传入参数。
2. 按 reviewer 分组阅读 findings：worldbuilding、voice、continuity、editor、reader。
3. 每条 finding 必须保留 `path`、`severity`、`evidence`、`suggestedAction`。
4. 对 `CREATIVE_INTENT_DRIFT_*` finding，必须把它视为创作控制权问题：先让用户确认，不得自动改正文或把 AI 建议写成正典。
5. 将 findings 转换为任务草稿时，只写建议和验收标准，不覆盖正文。
6. 如需要持久化报告，只写入 `spec/reports/**`。

## 输出要求

- 按 reviewer 分组列出 findings。
- 每条 finding 包含路径、依据和建议动作。
- 给出可复制到 `tasks.md` 的任务草稿。
- 单独列出“创作意图漂移”：未确认 AI 建议、待确认感情线/主角/威胁/建设边界是否进入了规格、计划、任务或正文。
- 明确无法验证的范围。
