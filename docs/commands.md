# 命令语义速查

本文只解释“什么时候用哪个命令”。不同 agent 的斜杠前缀见 [Agent 命令对照](agent-commands.md)。

## 推荐顺序

```text
storyspec story:new
storyspec next
storyspec interview --focus <entry> / storyspec ingest / storyspec co:create
storyspec core 或 storyspec creative:report
/constitution
storyspec preview specify -> storyspec apply
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
| `storyspec next [story]` | 根据当前阶段展示创作模式、推荐入口卡和多入口共创导航 |
| `storyspec interview [story]` | 在终端完成创作访谈，可用 `--focus` 或 `--entry` 从指定入口卡开始 |
| `storyspec ingest [story]` | 从 `--text` 或 `--file` 吸收长文创作资料；默认只预览，`--apply-confirmed` 只写入明确字段 |
| `storyspec co:create [story]` | 把长文吸收、核心缺口和可选 preview 串起来；适合一次粘贴多条回复或几百字设定 |
| `storyspec core [story]` | 查看核心信息面板；`--missing` 只显示缺口，`--json` 保留 `sourceLabel` |
| `storyspec creative:report [story]` | 查看已确认、创作回声、卷计划视图、未决项回流、待澄清、AI 候选和偏离风险 |
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

`/write` 的正文执行默认分三阶段反馈：先输出 3-6 条 scene beat 预览（JSON `stage=plan`），再按 scene、自然段组或目标字数分块输出正文（`stage=write`），最后给出正文路径、字数、验证和 tracking 待确认项（`stage=finish`）。写作入口仍需要 Scene Card、任务边界和 preview / confirm / apply 门禁。

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

## What-if 分支

| 命令 | 用途 |
| --- | --- |
| `storyspec branch:create <title>` | 创建一个剧情 what-if，只写入 `stories/*/branches/` |
| `storyspec branch:compare <branchId>` | 输出 what-if 对照卡，比较小说风味、读者承诺变化、收益代价、关系线偏移和世界压力节奏 |
| `storyspec branch:promote <branchId>` | 生成或确认 promote 清单；不会自动覆盖 main 正文或 canon |

`storyspec next` 和 `storyspec creative:report` 会提示活跃 exploring 分支，方便你先比较“这条路会长成什么小说”，再决定继续探索、promote 或放弃。

## 创作回声

| 命令 | 用途 |
| --- | --- |
| `storyspec creative:report [story]` | 显示当前风味、最有生命力的核心部件、关键缺口、下一轮创作回声和卷计划视图 |
| `storyspec status` | 在项目状态里回答“当前故事长成了什么”，不只显示文件是否存在 |

创作回声是给作者看的成果摘要，不是宣传文案。它只引用已确认或部分确认的核心要素，同时保留缺口，避免把未确认候选说成已经完成。`creative:report` 在卷计划摘要可用时还会渲染三幕结构、章节节奏、人物弧线、张力曲线和人物关系 Mermaid 视图，用来检查计划是否能支撑下一轮写作。

## 未决项回流

| 命令 | 用途 |
| --- | --- |
| `storyspec next [story]` | 当历史问题回答为“稍后决定”等 deferred 状态时，优先显示回流命令和触发条件 |
| `storyspec interview [story]` | 在 handoff prompt 中带上未决项，提醒 agent 继续追问而不是当作已确认 |
| `storyspec creative:report [story]` | 以决策日志形式展示当初选择、原因、回流条件、继续命令和证据位置 |

未决项回流不是强制打扰。它只把作者过去暂存的创作选择重新放到相关上下文前台，继续保持候选和确认边界。

## 有趣选择

| 命令 | 用途 |
| --- | --- |
| `storyspec interview [story]` | 在澄清 Markdown 的示例分叉中展示高影响候选的吸引力、代价、关系影响、世界影响、后续钩子和确认边界 |
| `storyspec validate` | 通过澄清 schema 检查高影响候选是否缺少关键影响字段 |

有趣选择不是给作者创意打分，而是防止系统把重要创作岔路做成普通选项列表。候选仍保持 `confirmed: false`，确认后才适合写入规格、计划或追踪文件。

## 入口卡

| 命令 | 用途 |
| --- | --- |
| `storyspec next [story]` | 按成熟度和灵感文本推荐主角、伙伴、舞台、能力、势力、冲突等入口卡 |
| `storyspec interview [story] --entry power` | 从指定入口卡启动一轮访谈；`--entry` 与 `--focus` 等价 |
| `storyspec interview [story] --entry faction` | 围绕资源控制、合法性来源、获利者、受损者、第一碰撞场景和关系钩子设计势力 |

六大核心入口卡会展示开场问题、有趣选择、候选产物、成熟度影响、正典边界和下一步推荐。它们不是强制流程，作者可以从任意入口开始，也可以跳过或改写候选。

势力入口不是让作者填政治百科，而是把“学院/贵族/教会/工会为什么能挡住主角”落到行动压力。候选权力结构默认只留在澄清记录里；确认后才适合进入 World Bible、specification 或 conflict plan。

## 终端维护命令

| 命令 | 用途 |
| --- | --- |
| `storyspec status` | 查看项目是否可继续写，并回顾当前故事长成了什么 |
| `storyspec validate` | 校验项目结构、tracking、任务和模板 |
| `storyspec agent:list` | 查看支持的 agent integration |
| `storyspec agent:add <id>` | 给项目添加 agent integration |
| `storyspec agent:doctor` | 检查 agent 配置 |
| `storyspec contract:sync` | 同步 `AGENTS.md` 和 `.specify/agent-contract.md` |
| `storyspec upgrade` | 更新已有项目的命令、脚本或模板 |
| `storyspec plugins:add <name>` | 安装通用生态包，dry-run 会显示 manifest kind、写入路径和 agent impact |
| `storyspec extension:add <name>` | 安装 extension 扩展包；复用 `plugins:add` 的安装计划和安全预览 |

`storyspec status --json` 和兼容入口 `storyspec codex-status --json` 会输出稳定的 `navigationEntries` 数组。每个入口包含 `action`、`label`、`description` 和 `copyableCommand`，方便 agent 或 UI 不解析中文文案也能区分“长文资料 / 一句灵感 / 表格资料 / 随便聊聊”四类首程入口。

更多 CLI 子命令可运行：

```bash
storyspec --help
storyspec <command> --help
```

## 常见判断

- 只有一句题材：先 `storyspec story:new` 或 `/clarify`，不要直接 `/specify` 到完整设定。
- 已经有一大段设定或多条回复：先 `storyspec ingest [story] --file notes.md` 看候选，再用 `storyspec co:create [story] --file notes.md --apply-confirmed --preview specify` 串起写入前预览。
- 只想先玩一个局部：运行 `storyspec next [story]`，再复制某个入口命令，例如 `storyspec interview 编程施法 --entry power`。
- 想快速看核心缺口：运行 `storyspec core [story] --missing`，再决定继续访谈、吸收长文还是生成 preview。
- 规格还不稳定：用 `preview`，不要直接覆盖正式文件。
- 想写正文：先确认 `specification.md`、`creative-plan.md`、`tasks.md`。
- 想让另一个 agent 接手：先运行 `storyspec status` 和 `storyspec context:pack`。
- 出现设定冲突：优先更新 `spec/world/`、`spec/canon/`、`spec/tracking/`，再继续写。

## 相关文档

- [创作流程](workflow.md)
- [创作控制权指南](creative-control.md)
- [Agent 命令对照](agent-commands.md)
