# Agent Contract

Agent contract 是 StorySpec 项目的通用协作协议。它让不同 agent 在同一套小说项目文件上工作时，知道应该读什么、能写什么、如何降级和如何交接。

## 文件位置

初始化或升级后，项目会包含：

```text
AGENTS.md
.specify/agent-contract.md
```

- `AGENTS.md`：面向支持项目级说明的 agent，提供当前项目的协作规则。
- `.specify/agent-contract.md`：稳定 contract 文件，供 generic command、handoff 和 agent doctor 引用。

## 核心约束

命令执行前，agent 应确认：

- 当前任务来自 `stories/*/tasks.md` 或用户明确指令。
- 必须读取列表已经加载。
- 写入范围来自任务的“允许修改”、命令 spec 的 `allowedWrites` 或用户明确授权。
- 不确定是否允许写入时，先输出澄清项或补丁式建议。
- 完成后更新任务状态、tracking 或正文文件，前提是当前 agent 有写文件能力。

## 能力降级

Renderer 会根据 integration 能力写入不同说明：

| 能力 | 可用时 | 不可用时 |
| --- | --- | --- |
| `runShell` | 可以运行 `storyspec validate` 或 `.specify/scripts/**` | 不执行 CLI/脚本，改为人工检查并记录未验证项 |
| `writeFiles` | 可以在允许范围内写文件 | 不创建、修改或删除文件，只输出目标路径和补丁式建议 |
| `supportsSlashCommands` | 使用 `/write`、`/storyspec-write` 等命令 | 直接读取 Markdown 命令文件执行步骤 |

只读 agent 的典型输出应包含：

```text
目标路径：stories/001-demo/content/chapter-001.md
建议变更：...
补丁式说明：...
无法验证：未执行 storyspec validate
```

## Handoff 适配

`storyspec handoff` 可以按目标 agent 能力生成继续步骤：

```bash
storyspec handoff --target-agent codex
storyspec handoff --target-agent continue-check
```

当目标是 `continue-check` 这类只读 agent 时，handoff 会要求它只做检查和补丁式建议，不直接写正文、tracking 或任务文件。

## 同步

```bash
storyspec contract:print
storyspec contract:sync
storyspec agent:doctor
```

`contract:sync` 会同步项目 contract；`agent:doctor` 会检查 contract、命令目录和 manifest 是否一致。
