# 脚本盘点

## 背景

本文件记录当前 Bash 与 PowerShell 脚本的功能对应关系，作为后续统一 script runner 与 TypeScript 迁移的基线。当前目标是盘点现状，不改变 prompt 中已有脚本路径。

## 总览

| 范围 | Bash | PowerShell | 备注 |
| --- | ---: | ---: | --- |
| `scripts/` 源目录 | 18 | 16 | npm 构建产物会复制到用户项目的 `.specify/scripts/` |

## `scripts/` 源目录对应关系

| 功能 | Bash | PowerShell | 状态 | 迁移建议 |
| --- | --- | --- | --- | --- |
| 共用函数 | `common.sh` | `common.ps1` | 双实现 | 先保留，runner 层统一调用约定 |
| 创建宪法 | `constitution.sh` | `constitution.ps1` | 双实现 | 可迁移为项目文件写入 use case |
| 故事规格 | `specify-story.sh` | `specify-story.ps1` | 双实现 | 可迁移为模板渲染 use case |
| 澄清故事 | `clarify-story.sh` | `clarify-story.ps1` | 双实现 | 保留兼容，后续抽参数解析 |
| 故事计划 | `plan-story.sh` | `plan-story.ps1` | 双实现 | 可迁移为 artifact 写入 |
| 生成任务 | `generate-tasks.sh` | `generate-tasks.ps1` | 双实现 | 优先接入 task schema 后迁移 |
| 初始化追踪 | `init-tracking.sh` | `init-tracking.ps1` | 双实现 | 适合先迁移到 TypeScript |
| 追踪进度 | `track-progress.sh` | `track-progress.ps1` | 双实现 | 依赖 tracking JSON schema |
| 管理关系 | `manage-relations.sh` | `manage-relations.ps1` | 双实现 | 依赖 relationships schema |
| 一致性检查 | `check-consistency.sh` | `check-consistency.ps1` | 双实现 | 适合 rule checker 化 |
| 剧情检查 | `check-plot.sh` | `check-plot.ps1` | 双实现 | 适合 rule checker 化 |
| 时间线检查 | `check-timeline.sh` | `check-timeline.ps1` | 双实现 | 适合 rule checker 化 |
| 写作状态检查 | `check-writing-state.sh` | `check-writing-state.ps1` | 双实现 | 可作为首批 TypeScript scanner |
| 文本审计 | `text-audit.sh` | `text-audit.ps1` | 双实现 | 适合 rule checker 化 |
| 分析故事 | `analyze-story.sh` | `analyze-story.ps1` | 双实现 | 依赖多个 scanner，后迁移 |
| 世界观检查 | `check-world.sh` | 无 | Bash-only | 需要补齐 PowerShell 兼容或直接迁移 TS |
| 字数测试 | `test-word-count.sh` | 无 | Bash-only | 适合首批迁移到 TypeScript |
| 分析阶段检查 | 无 | `check-analyze-stage.ps1` | PowerShell-only | 被 `analyze` 命令使用，后续应补齐 Bash 或迁移 TS |

## 生成路径说明

- 仓库根目录不再跟踪 `.specify/scripts/` 副本。
- `.specify/scripts/` 是用户项目内的运行路径，由 `storyspec init` 或 `npm run build:commands` 从 `scripts/` 和 TypeScript runtime 生成。
- 后续新增或迁移脚本时，只维护 `scripts/` 源目录、命令模板和对应测试，不再手改根目录 `.specify/` 产物。

## 首批迁移候选

- `test-word-count.sh`：纯文本扫描，依赖少。
- `check-writing-state.*`：与项目状态直接相关，迁移收益高。
- `init-tracking.*`：结构化 JSON 初始化，适合 schema 保护。
- `check-timeline.*`：可与后续 artifact graph 共用解析模型。

## 后续约束

- 迁移前保留用户项目中的旧 shell 路径，避免已生成 prompt 失效。
- 每迁移一个脚本能力，新增对应 TypeScript 单元测试和 CLI smoke。
- Bash/PowerShell 双实现不一致时，先以现有 smoke 行为为准，再补决策记录。
