# 重构迁移指南

本文档面向已经用旧版 Novel Writer 创建过项目的作者和维护者，说明如何迁移到当前重构后的 CLI、命令产物、脚本 runtime、插件 manifest 和校验体系。

如果你只是新建项目，直接阅读 [快速入门](quickstart.md)。如果你要升级旧项目，建议先按本文执行一次 dry-run，再正式升级。

## 迁移前确认

在旧项目根目录执行：

```bash
novel status
novel validate --severity error
git status --short
```

如果项目没有启用 Git，也建议先手动备份整个目录。迁移会尽量保留 `stories/`、`spec/tracking/`、`spec/knowledge/` 和 `.specify/memory/` 中的用户内容，但命令文件、脚本文件、模板文件在显式选择更新时可能被覆盖。

## 推荐路径：保守升级

适合大多数旧项目。

```bash
npm install -g novel-writer-cn@latest
cd my-novel
novel upgrade --dry-run
novel upgrade --commands --scripts
novel validate --severity error
novel status
```

这条路径只更新 agent integration 命令和兼容脚本：

- 会更新 `.specify/commands/`、`.continue/prompts/`、`.claude/`、`.gemini/`、`.codex/` 等已安装 integration 的命令目录。
- 会更新 `.specify/scripts/`，并带上 TypeScript runtime 兼容层。
- 默认会创建 `backup/<timestamp>/`。
- 不会主动更新 `.specify/templates/` 和 `.specify/memory/`。

## `--ai` 到 `--agent`

新版本主路径使用 `--agent` / `--all-agents`：

```bash
novel init my-novel --agent generic
novel init my-novel --agent codex
novel upgrade --agent codex
novel upgrade --all-agents
```

旧入口仍处于兼容期：

| 旧入口 | 新入口 | 说明 |
| --- | --- | --- |
| `--ai codex` | `--agent codex` | 继续支持，建议迁移到新写法 |
| `--ai claude` | `--agent claude` | 继续支持，建议迁移到新写法 |
| `--all` | `--all-agents` | 旧入口只覆盖 legacy AI 平台；新入口覆盖所有 agent integration |

新增通用和只读入口：

```bash
novel init my-novel --agent generic
novel init my-novel --agent continue-check
novel handoff --target-agent continue-check
```

`generic` 生成 `.specify/commands/*.md`，适合不支持专用命令格式的 agent。`continue-check` 生成 `.continue/prompts/*.md`，默认只输出检查结果和补丁式建议，不直接写项目文件。

## 有自定义命令或模板的项目

如果你修改过 AI 命令、`.specify/templates/` 或 `.specify/memory/`，使用交互模式：

```bash
novel upgrade -i
```

建议选择：

| 项目情况 | 建议选择 |
| --- | --- |
| 只改过正文和 tracking 数据 | `commands`、`scripts`、`spec` |
| 改过命令 prompt | 先 `--dry-run`，再只选 `commands`，升级后手动合并自定义片段 |
| 改过 `.specify/templates/` | 暂不选择 `templates`，先复制自定义模板到项目本地 override |
| 改过 `.specify/memory/` | 暂不选择 `memory`，除非你确认要接受新版默认记忆文件 |
| 多个 agent integration 同时使用 | 不指定 `--agent`，让 upgrade 更新所有已安装 integration |

手动合并建议：

```bash
# 先预览
novel upgrade --dry-run

# 正式升级，保留自动备份
novel upgrade --commands --scripts

# 对比旧命令与新命令
git diff -- .claude .gemini .codex .specify/scripts
```

如果你的自定义内容属于长期项目约定，优先放入 `.specify/memory/` 或 project-local template override，不建议直接修改生成后的平台命令文件。平台命令应尽量保持为可重新生成产物。

## 模板和 spec 的迁移

当前模板解析顺序是：

1. project-local overrides
2. preset
3. extension
4. core templates

因此旧项目的自定义模板应尽量保留在项目本地 override 层。需要更新框架模板时再执行：

```bash
novel upgrade --templates
```

`novel upgrade --spec` 会更新写作规范和预设，但会跳过用户数据目录：

- `spec/tracking/`
- `spec/knowledge/`

升级后请运行：

```bash
novel validate
novel validate --json
```

## 插件迁移

新版插件安装采用 plan/apply 两阶段。

```bash
novel plugins add authentic-voice --dry-run
novel plugins add authentic-voice
```

如果 dry-run 显示冲突，默认安装会停止。确认要覆盖时再使用：

```bash
novel plugins add authentic-voice --force
```

插件应通过 `config.yaml` manifest 声明 `commands`、`templates`、`knowledge`、`trackingRules`、`experts` 和 `hooks`。不建议在插件命令正文中隐式写入项目文件。

## 回滚

`novel upgrade` 默认会创建备份目录。升级失败或结果不符合预期时：

```bash
cd my-novel
ls backup
```

根据备份里的 `BACKUP_INFO.json` 找到对应时间戳，然后恢复受影响目录。示例：

```bash
Remove-Item -Recurse -Force .claude
Copy-Item -Recurse backup\2026-05-02T10-30-00\.claude .claude
```

如果你使用 Git，优先用 Git 查看差异并只恢复有问题的文件。

## 升级后验收清单

- [ ] `novel validate --severity error` 无 error。
- [ ] `novel status` 能看到故事、任务、追踪数据和 blocker 摘要。
- [ ] 已安装 agent integration 的命令目录存在，例如 `.specify/commands/`、`.continue/prompts/`、`.codex/prompts/`、`.claude/commands/`、`.gemini/commands/novel/`。
- [ ] `.specify/scripts/runtime/` 存在，旧脚本入口仍可调用。
- [ ] 自定义模板和记忆文件未被误覆盖。
- [ ] 试运行一个非破坏性命令，例如 `/novel-analyze` 或对应平台的 `/analyze`。

## 何时重新初始化

只有在以下情况才建议新建项目后手动迁移内容：

- 项目早于 v0.10，目录结构与当前 SDD 流程差异很大。
- 命令文件被大量手工改写，无法安全合并。
- 想彻底切换 agent integration 和模板体系。

可用路径：

```bash
novel init migrated-novel --agent codex
```

然后手动复制旧项目的 `stories/`、`spec/tracking/`、`spec/knowledge/` 和必要的 `.specify/memory/` 文件，再运行 `novel validate`。
