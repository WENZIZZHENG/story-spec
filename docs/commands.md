# 命令语义速查

本文只解释“什么时候用哪个命令”。不同 agent 的斜杠前缀见 [Agent 命令对照](agent-commands.md)。

## 推荐顺序

```text
storyspec story:new
storyspec next
/clarify 或 storyspec interview --focus <entry>
/constitution
/specify
/plan
/tasks
/write
/analyze
```

核心原则：用户还没确认的信息，不直接写进正式规格；写正文前，先确认规格、计划和任务边界。

## 早期创意导航

| 命令 | 用途 |
| --- | --- |
| `storyspec story:new <name> --idea "..."` | 保存一句话灵感和原始创作意图 |
| `storyspec next [story]` | 根据当前阶段展示创作模式和多入口共创导航 |
| `storyspec interview [story]` | 在终端完成创作访谈，可用 `--focus` 从指定入口开始 |
| `storyspec creative:report [story]` | 查看已确认、待澄清、AI 候选和偏离风险 |
| `storyspec preview specify [story]` | 预览规格写入内容 |
| `storyspec apply <preview-id> --yes` | 明确确认后写入 preview |

## Agent 斜杠命令

| 命令 | 用途 | 写入重点 |
| --- | --- | --- |
| `/constitution` | 建立创作原则 | `.specify/memory/constitution.md` |
| `/specify` | 生成故事规格 | `stories/*/specification.md` |
| `/clarify` | 澄清模糊点 | `clarifications.*` |
| `/plan` | 生成创作计划 | `creative-plan.md` |
| `/tasks` | 拆分写作任务 | `tasks.md` |
| `/write` | 写章节草稿或正文 | `stories/*/content/` |
| `/analyze` | 检查结构、连续性和质量 | 分析报告或任务建议 |

辅助命令：

| 命令 | 用途 |
| --- | --- |
| `/checklist` | 按阶段检查规格、大纲或正文 |
| `/review` | 运行审稿循环并输出 findings |
| `/context-pack` | 生成接手上下文包 |
| `/scene` | 管理 Scene Card |
| `/timeline` | 管理时间线 |
| `/relations` | 管理人物关系变化 |
| `/track` / `/track-init` | 初始化或更新追踪数据 |
| `/expert` | 进入专家辅助模式 |

## 终端维护命令

| 命令 | 用途 |
| --- | --- |
| `storyspec status` | 查看项目是否可继续写 |
| `storyspec validate` | 校验项目结构、tracking、任务和模板 |
| `storyspec agent:list` | 查看支持的 agent integration |
| `storyspec agent:add <id>` | 给项目添加 agent integration |
| `storyspec agent:doctor` | 检查 agent 配置 |
| `storyspec contract:sync` | 同步 `AGENTS.md` 和 `.specify/agent-contract.md` |
| `storyspec upgrade` | 更新已有项目的命令、脚本或模板 |

更多 CLI 子命令可运行：

```bash
storyspec --help
storyspec <command> --help
```

## 常见判断

- 只有一句题材：先 `storyspec story:new` 或 `/clarify`，不要直接 `/specify` 到完整设定。
- 只想先玩一个局部：运行 `storyspec next [story]`，再复制某个入口命令，例如 `storyspec interview 编程施法 --focus scene`。
- 规格还不稳定：用 `preview`，不要直接覆盖正式文件。
- 想写正文：先确认 `specification.md`、`creative-plan.md`、`tasks.md`。
- 想让另一个 agent 接手：先运行 `storyspec status` 和 `storyspec context:pack`。
- 出现设定冲突：优先更新 `spec/world/`、`spec/canon/`、`spec/tracking/`，再继续写。

## 相关文档

- [创作流程](workflow.md)
- [创作控制权指南](creative-control.md)
- [Agent 命令对照](agent-commands.md)
