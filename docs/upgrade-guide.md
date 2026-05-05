# 升级指南

本文说明如何把已有 StorySpec 小说项目更新到当前命令、脚本和 agent 入口。

## 先做检查

```bash
storyspec status
storyspec validate
git status --short
```

建议先提交当前项目，或至少保留一份备份。

## 预览升级

```bash
storyspec upgrade --dry-run
```

需要只更新某一类产物时：

```bash
storyspec upgrade --commands --dry-run
storyspec upgrade --scripts --dry-run
storyspec upgrade --templates --dry-run
```

## 执行升级

```bash
storyspec upgrade
```

只更新某个 agent：

```bash
storyspec upgrade --agent codex --commands
storyspec upgrade --agent gemini --commands
```

旧入口 `--ai` 仍可用，但新项目和新文档优先使用 `--agent`。

## 升级后验证

```bash
storyspec status
storyspec status --json
storyspec validate
storyspec agent:doctor
```

`storyspec status --json` 和兼容入口 `storyspec codex-status --json` 会输出稳定的 `navigationEntries`，可用于检查升级后的首程导航、素材分流和可复制命令是否仍能被 agent/UI 读取。

如果项目使用 Git：

```bash
git diff
git status --short
```

重点检查：

- `AGENTS.md`
- `.specify/agent-contract.md`
- agent 命令目录，例如 `.codex/prompts/`、`.claude/commands/`、`.gemini/commands/storyspec/`
- `scripts/` 或 `.specify/scripts/`

## 常见场景

### 从旧 CLI 名迁移

StorySpec 只保留 `storyspec` CLI，不再保留 `novel` 兼容别名。

```bash
npm install -g story-spec-cn@latest
storyspec --help
```

### 补充一个 agent

```bash
storyspec agent:add codex
storyspec agent:doctor
```

### 只更新 Gemini 命令

```bash
storyspec upgrade --agent gemini --commands
```

Gemini 使用 `/storyspec:命令名`，命令文件位于 `.gemini/commands/storyspec/`。

## 回滚

如果升级前有 Git 提交，优先用 Git 对比并手动回退不需要的文件。

如果升级命令创建了备份目录，可从备份目录恢复对应 agent 命令、脚本或模板。

## 相关文档

- [Agent 命令对照](agent-commands.md)
- [Agent integrations](agent-integrations.md)
