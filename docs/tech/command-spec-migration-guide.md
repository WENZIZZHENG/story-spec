# Command Spec 迁移指南

## 目标

将旧的 `templates/commands/*.md` 拆分为两类来源：

- `*.command.yaml`：命令语义、读写边界、脚本能力和风险策略。
- `*.prompt.md`：agent-neutral 的执行正文。

迁移后的命令仍输出到 Codex、Claude、Gemini、generic 等现有 agent 目录。未迁移命令继续使用旧 `.md` 模板。

## 文件命名

以 `write` 为例：

```text
templates/commands/write.md             # 旧模板，迁移期可保留
templates/commands/write.command.yaml   # 新命令规格
templates/commands/write.prompt.md      # 新 prompt body
```

当同名 `.command.yaml` 存在时，构建器优先使用新规格；旧 `write.md` 不再作为该命令的渲染来源。

## 迁移步骤

1. 从旧模板 frontmatter 提取元数据。

旧字段映射：

| 旧 frontmatter | 新位置 |
| --- | --- |
| `description` | `description` |
| `argument-hint` | `arguments.hint` |
| `scripts.sh` | `scripts.check.sh` 或 `scripts.run.sh` |
| `scripts.ps` | `scripts.check.ps` 或 `scripts.run.ps` |

2. 补齐新规格字段。

必须包含：

- `id`
- `title`
- `stage`
- `description`
- `requiredReads`
- `allowedWrites`

3. 将旧模板正文复制到 `.prompt.md`。

删除旧 frontmatter，只保留执行正文。正文中仍可使用：

- `$ARGUMENTS` 或 `{ARGS}`
- `__AGENT__`
- `{SCRIPT}`

4. 按命令边界精简读写范围。

`requiredReads` 只写命令执行必须读取的协议、故事、tracking 或知识库路径。

`allowedWrites` 只写该命令允许修改的路径。分析类命令默认不写正文；写作类命令必须包含正文输出和 tracking 更新边界。

5. 运行验证。

```bash
npm run build
npm test -- tests/unit/command-spec.test.ts tests/unit/build-commands.test.ts
npm run update:command-manifest
npm run check:command-manifest
git diff --check
```

## 示例

```yaml
id: write
title: 章节写作
stage: drafting
description: 基于任务清单执行章节写作
arguments:
  hint: "[章节编号或任务ID]"
requiredReads:
  - .specify/agent-contract.md
  - .specify/memory/constitution.md
  - stories/*/specification.md
  - stories/*/creative-plan.md
  - stories/*/tasks.md
  - spec/tracking/*.json
allowedWrites:
  - stories/*/tasks.md
  - stories/*/content/**
  - spec/tracking/**
scripts:
  check:
    capability: check-writing-state
    sh: .specify/scripts/bash/check-writing-state.sh
    ps: .specify/scripts/powershell/check-writing-state.ps1
risk:
  requiresTaskBoundary: true
  highRiskContentPolicy: use-task-boundary
```

对应 `write.prompt.md` 只写执行说明，不写平台 frontmatter。

## Manifest 审查

`tests/fixtures/command-artifacts.manifest.json` 会标记每个命令输出的来源：

- `kind: "command-spec"` 表示来自 `.command.yaml + .prompt.md`。
- `kind: "legacy-template"` 表示仍来自旧 `.md`。

迁移命令后必须更新 manifest，并确认对应命令的 `sourcePath` 和 `promptPath` 正确。

## 当前迁移状态

已迁移：

- `write`
- `analyze`

未迁移命令继续使用旧 Markdown 模板，后续可按同一流程逐个迁移。
