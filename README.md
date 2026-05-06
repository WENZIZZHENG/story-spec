# StorySpec

[![npm version](https://badge.fury.io/js/story-spec-cn.svg)](https://www.npmjs.com/package/story-spec-cn)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

StorySpec 是一个面向中文长篇小说的共创型编辑台。它不是让 AI 把一句灵感直接扩写成完整大纲，而是先陪作者围绕主角、伙伴、舞台、能力、势力、冲突和场景做有趣选择，再把确认过的内容沉淀成规格、计划、正文和追踪文件。

你可以把它理解成：

- 先保存作者原始灵感，不静默改写成正典。
- 先给少量候选和有后果的分叉，不急着生成完整计划。
- 作者可以确认、改写、拒绝或稍后决定。
- AI 候选进入正典前必须经过 preview / confirm / apply 或等价确认流程。
- Codex、Claude、Gemini、Cursor、Continue 等 agent 可以共用同一套故事资料。
- 不同 agent 入口会共同指向 `.specify/agent-guides/story-creation-guide.md`，避免只解释 StorySpec 而不带作者进入第一轮创建。

## 安装

```bash
npm install -g story-spec-cn
```

要求 Node.js `>=18.0.0`。

本仓库开发时可以使用 `npm` 脚本；仓库锁文件是 `bun.lock`，安装依赖时优先保留现有包管理方式。

## 3 分钟体验

假设你想创建《编程施法》：

```bash
storyspec init --workspace my-novel --agent codex
cd my-novel
storyspec story:new 编程施法 --idea "主角晏无是一名工科马列青年，穿越到剑与魔法世界，并获得编程施法金手指，展开轻松冒险；慢热感情，文明级威胁。"
storyspec next 编程施法
```

首次路径建议先落到工作区，再进入 `storyspec story:new` 和 `storyspec next`。`storyspec next` 默认只给一条最推荐、可复制的下一步命令，并附 2 个可选入口；这样第一次使用时不会被完整工作台淹没。

想看低负担玩法时运行：

```bash
storyspec next 编程施法 --modes
```

## 实验性本机工作台

StorySpec 正在加入本机 Web 工作台地基。当前版本提供实验性本机服务入口：

```bash
storyspec app
```

它会启动只绑定 `127.0.0.1` 的本机服务，并提供 health、最近项目、打开/创建项目和当前项目状态 API。当前它还不是完整浏览器 UI，正式创作流程仍以 CLI 和 agent 命令为准；自动化检查可用 `storyspec app --json --no-open` 查看启动预览。

它会问你今天想怎么玩：

- 我想玩角色
- 我想写一幕
- 我想整理设定
- 我想比较分支
- 我只想随便聊聊

每个今日创作模式都默认低负担：最多 2 个问题、2 个候选、`--no-write`，先陪你发散，不写入文件，不生成完整大纲。

比如你今天只想玩能力：

```bash
storyspec interview 编程施法 --focus power --max-questions 2 --no-write
```

你可以先比较“轻量隐喻”“中度规则”“硬规则”会让这本书长成什么味道，再决定是否确认、改写、拒绝或稍后。

## 今日创作模式

| 模式 | 适合什么时候用 | 默认行为 |
| --- | --- | --- |
| 我想玩角色 | 想先抓主角、伙伴、关系张力 | 进入主角/伙伴入口，只给少量人物候选 |
| 我想写一幕 | 脑中已经有事故、相遇、对话或高光 | 进入场景/舞台/能力入口，先试一幕能不能写动 |
| 我想整理设定 | 世界观很多，但还没落到故事压力 | 进入世界/舞台/势力/能力入口，整理候选边界 |
| 我想比较分支 | 在几条路线之间摇摆 | 进入分支/冲突/结尾入口，比较风味和代价 |
| 我只想随便聊聊 | 不想开正式流程，只想发散 | 进入轻量入口，不写文件，不生成计划 |

这些模式借鉴了 Inquirer.js 的轻量选择、Twine 的任意入口探索、Redux 的可追溯决策思想和 Cucumber.js 的行为场景验收，但不会把 StorySpec 变成复杂 UI 或版本控制系统。

## 共创入口卡

`storyspec next` 会根据故事状态推荐入口卡。入口卡不是表单，而是“今天从哪里继续玩”。

| 入口 | 命令示例 | 会帮你创造什么 |
| --- | --- | --- |
| 主角 | `storyspec interview 编程施法 --focus protagonist` | 欲望、误判、成长代价、成功路线候选 |
| 伙伴 | `storyspec interview 编程施法 --focus partner` | 能挑战主角的人、慢热关系张力、互相改变的代价 |
| 舞台 | `storyspec interview 编程施法 --focus stage` | 第一眼异界、资源结构、普通人压力、开局碰撞 |
| 能力 | `storyspec interview 编程施法 --focus power` | 编程施法的爽点、限制、失败代价和世界误读 |
| 势力 | `storyspec interview 编程施法 --focus faction` | 谁垄断知识/资源/合法性，谁获利，谁受损 |
| 冲突 | `storyspec interview 编程施法 --focus conflict` | 第一卷阻力、阶段胜利、文明级威胁的小异常 |
| 场景 | `storyspec interview 编程施法 --focus scene` | 一幕可写的事故、对话、合作或高光 |
| 分支 | `storyspec interview 编程施法 --focus branch` | what-if 路线、风味差异、关系和世界压力变化 |

高影响候选会展示：吸引力、代价、关系影响、世界影响、后续钩子和确认边界。它检查的是系统给出的候选是否可玩，不评价作者创意高低。

## 最小快乐闭环

StorySpec 的早期目标不是马上生成完整 `creative-plan.md`，而是先让第一轮共创变得好玩：

```text
选择今日创作模式
  -> 看 2 个有后果的候选
  -> 确认 / 改写 / 拒绝 / 稍后
  -> 得到一句创作回声
  -> 核心要素不足时阻止完整 plan
```

`storyspec creative:report 编程施法` 会告诉你已经创造出了什么、哪些仍是候选、下一轮最值得玩哪里；如果已有卷计划摘要，还会展示三幕结构、章节节奏、人物弧线、张力曲线和人物关系视图。

## 候选不是正典

StorySpec 会尽量把“作者确认”和“AI 建议”分开：

- `source: user-explicit` 且 `confirmed: true` 的内容，才适合进入正典、规格、计划和正文。
- `source: ai-suggested`、`confirmed: false` 或跳过回答的内容，只能作为候选。
- `不知道`、`稍后决定`、`给我示例` 会保留在澄清记录里，但不算完成回答。
- `storyspec preview specify`、`storyspec preview plan` 和 `storyspec apply` 用来把“准备写入”和“确认写入”分开。
- `creative-plan.md` 不应过早替作者定稿；核心伙伴、第一舞台、能力边界、势力冲突等仍缺失时，计划预览应保留 `[需要澄清]` 或要求继续访谈。

如果你确认后又反悔，可以把答案退回候选：

```bash
storyspec clarification:rollback --story 编程施法 --question magic.rule-hardness
```

它会保留原答案和证据路径，把该项重新放回“AI 建议，待确认”，不会修改正文、正典、规格或创作计划。

## 适合谁

- 你想写长篇中文小说，希望 AI 帮忙推进，但不希望它抢走设定权。
- 你有一句灵感、几条类型偏好或一个模糊主题，需要先被追问，而不是被立即代写。
- 你想体验“创建小说世界”的乐趣，而不是只验收 AI 大纲。
- 你需要维护世界观、正典、人物关系、伏笔、章节任务和多轮修改记录。
- 你想让不同 AI 工具接力创作，并且每次接手都能读到同一份上下文。

## 不适合谁

- 你只想输入一句话，然后立刻得到完整大纲、人物小传和正文。
- 你希望 AI 自动决定所有设定，作者只负责验收成品。
- 你写的是一次性短文本，不需要长期维护资料、正典和版本。
- 你不想使用命令行，也不希望把小说拆成项目文件管理。

## 完整工作流

下面是一条更完整的新故事路径。重点是：先建项目，再保存灵感，然后进入共创访谈；规格和创作计划都先预览，确认后再写入。

```bash
storyspec init --workspace my-novel --agent codex
cd my-novel
storyspec author-profile --init --answers "genre=18+ 玄幻、异界穿越、轻松冒险;pacing=慢热共创，先玩关键选择;boundary=建设流和思想改造只是支撑工具"
storyspec story:new 法术编译纪元 --idea "异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁。建设流和思想改造只是支撑工具。"
storyspec next 法术编译纪元

storyspec interview 法术编译纪元 --focus protagonist --premise "异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁" --max-questions 6
storyspec interview 法术编译纪元 --answers "主角=晏无开朗务实，遇事先拆问题;第一舞台=魔导边境学院"
storyspec core 法术编译纪元 --missing
storyspec ingest 法术编译纪元 --file notes.md
storyspec reference:reverse 法术编译纪元 --file reference-notes.md --title "喜欢但不想照搬的参考作品"
storyspec co:create 法术编译纪元 --file notes.md --apply-confirmed --preview specify
storyspec creative:report 法术编译纪元

storyspec preview specify 法术编译纪元
# 从上一条命令输出里复制 preview id 后再应用
storyspec apply PREVIEW_ID --yes

storyspec preview plan 法术编译纪元
# 核心要素成熟后再应用；探索性草案可显式加 --draft
storyspec apply PLAN_PREVIEW_ID --yes

在 agent 中执行 /storyspec-tasks，生成 stories/法术编译纪元/tasks.md
storyspec tasks:board 法术编译纪元
storyspec scene:init 法术编译纪元
storyspec context:pack 法术编译纪元
storyspec draft:new 法术编译纪元 --chapter 001
storyspec status
storyspec validate
```

运行后通常会出现这些文件：

| 文件 | 用途 |
| --- | --- |
| `.specify/memory/author-profile.json` | 作者长期偏好画像；只影响推荐和示例，不进入故事正典 |
| `stories/<story>/idea.md` | 保存作者原始灵感，不把 AI 补全混进去 |
| `stories/<story>/clarifications.json` | 记录已确认、未确认、跳过和 AI 建议来源 |
| `stories/<story>/clarifications.md` | 给作者阅读的澄清摘要 |
| `.specify/previews/` | 存放待确认的规格预览 |
| `stories/<story>/specification.md` | 通过 `storyspec apply` 后才写入的正式规格 |
| `stories/<story>/creative-plan.md` | 通过 `storyspec preview plan` 并确认后才写入的创作计划 |
| `stories/<story>/tasks.md` | 在 agent 中执行 `/storyspec-tasks` 后生成的可执行任务清单 |
| `.specify/context-packs/` | `storyspec context:pack` 生成的写作上下文包 |

## 先澄清，而不是抢写

StorySpec 对低信息量输入的默认态度是：先围绕核心要素共创，再进入规格和计划。比如你只说：

```text
我想写一个异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁。
```

工具应该优先帮助你确认关键问题：

- 主角为什么会把“编程”理解成施法？这会带来什么成长路线？
- 核心伙伴会支持主角、挑战主角，还是代表异界秩序反驳主角？
- 第一舞台是学院、边境城邦、工坊、冒险队，还是某个正在出问题的魔法系统？
- 轻松冒险的喜剧边界在哪里，哪些伤害不能被轻飘飘处理？
- 慢热感情是同伴信任、暧昧拉扯，还是价值观互相改变？
- 文明级威胁是技术污染、神明系统、外敌入侵，还是世界规则崩坏？
- 建设流和思想改造只是工具，那么它们服务于哪条主线冲突？

你可以用“给我示例”“稍后决定”“不知道”回答。StorySpec 会记录这个状态，但不会把它当作已经确认的正典。

`storyspec core`、`storyspec creative:report` 和 preview 报告会在关键项旁标记 `[作者确认]`、`[部分确认]`、`[AI 候选]`、`[待澄清]` 或 `[稍后决定]`；`--json` 输出也保留 `sourceLabel`，便于 agent 继续区分正典和候选。长文和表格资料也遵循同一套 candidate / preview / confirm / apply 流程，待澄清不是失败，确认后再 `apply` 才进入正典。

如果你想把“粘贴长文 -> 查看核心缺口 -> 生成预览”串起来，可以用连续入口：

```bash
storyspec co:create 法术编译纪元 --file notes.md
storyspec co:create 法术编译纪元 --file notes.md --apply-confirmed --preview specify
```

第一条只预览，不写入澄清记录；第二条才把识别为作者明确表达的字段写入，并生成 specification 预览，仍需要 `storyspec apply PREVIEW_ID --yes` 才会覆盖正式文件。

### 可复制的开局示例

这些示例不是标准答案，只是帮助你启动访谈的输入模板。

```bash
storyspec story:new 星门调试员 --idea "异界穿越、轻松冒险、编程施法、队友情、文明级威胁。主角像调试系统一样修复魔法事故。"
storyspec interview 星门调试员 --premise "主角穿越到魔法世界，发现法术像旧系统一样有语法、依赖和运行时错误" --max-questions 8
```

```bash
storyspec story:new 月港补丁师 --idea "海港城冒险、低魔世界、编程施法、慢热恋爱。文明危机来自一段不断自我复制的古代咒文。"
storyspec interview 月港补丁师 --premise "主角靠写补丁修复咒文漏洞，逐渐卷入城市、商会和旧神遗产的冲突" --max-questions 8
```

```bash
storyspec story:new 王国异常日志 --idea "轻松群像、冒险调查、编程施法、文明级异常。建设和思想改造只作为解决危机的工具。"
storyspec interview 王国异常日志 --premise "主角团队用日志、断点和测试用例定位世界规则异常" --max-questions 8
```

## 流程总览

```text
init -> story:new -> next -> interview/clarify 或 ingest/co:create -> core/creative:report -> preview specify -> apply -> preview plan -> apply -> /storyspec-tasks -> tasks:board -> scene:init -> context:pack -> draft:new/write -> review -> validate
```

每一步的职责不同：

| 阶段 | 目标 |
| --- | --- |
| `storyspec init` | 创建小说项目、目录、模板和 agent 入口 |
| `storyspec story:new` | 保存作者原始想法，建立故事工作区 |
| `storyspec author-profile` | 可选维护作者画像；首次只做可跳过采样，后续才回填已确认偏好 |
| `storyspec next` | 根据当前状态显示一条可复制主命令；加 `--verbose` 展开创作模式、推荐入口卡、多入口导航和未决项回流 |
| `storyspec interview` / `storyspec clarify` | 访谈式澄清；可用 `--focus` 或 `--entry protagonist/partner/world/stage/power/faction/conflict/scene/ending/branch` 从某个共创入口开始；`--answers` 支持 `questionId=...` 和 `主角=...;第一舞台=...` 中文别名 |
| `storyspec core` | 查看核心创意、主角、伙伴、第一舞台、能力体系和创作边界；加 `--missing` 只看缺口 |
| `storyspec ingest` | 吸收自然语言长文，拆成核心澄清项预览；加 `--apply-confirmed` 才写入 |
| `storyspec co:create` | 连续共创入口：长文吸收、核心面板和可选 preview 串在一起；默认只预览 |
| `storyspec creative:report` | 查看作者已经创建的小说骨架、创作回声、卷计划视图、未决项回流、待澄清问题和 AI 建议风险 |
| `storyspec preview specify` | 生成规格写入预览 |
| `storyspec apply` | 确认无 blocking 风险后写入正式规格 |
| `storyspec preview plan` | 生成 `creative-plan.md` 写入预览，不直接替作者定稿 |
| `storyspec apply` | 确认无 blocking 风险后写入正式规格或创作计划；探索性计划可显式加 `--draft` |
| `/storyspec-tasks` | 在 agent 中把 `creative-plan.md` 拆成 `stories/<story>/tasks.md` |
| `storyspec tasks:board` | 终端检查任务看板、WRITE-READY、PLAN-ONLY 和输出路径 |
| `storyspec scene:init` / `storyspec context:pack` | 补 Scene Card 并生成写作上下文包 |
| `storyspec draft:new` / `/storyspec-write` | 创建草稿或在 agent 中按任务和 Scene Card 写正文 |
| `/review` / `storyspec validate` | 检查漂移、结构、任务和写作规则 |

## 两类命令

StorySpec 有两类入口，容易混淆：

| 入口 | 在哪里用 | 示例 |
| --- | --- | --- |
| 终端 CLI | PowerShell、Terminal、Bash | `storyspec status`、`storyspec validate`、`storyspec context:pack` |
| Agent 写作入口 | Codex、Claude、Gemini、Cursor 等 AI 工具 | `/storyspec-write`、`/storyspec.plan`、`/storyspec:review` |

斜杠命令不是终端命令。终端里运行 `storyspec ...`；AI 工具里使用初始化时生成的 agent prompt。

不同 agent 的命令前缀不同：

| Agent | 示例 |
| --- | --- |
| Generic Markdown | `/write` |
| Codex CLI | `/storyspec-write` |
| Claude Code | `/storyspec.write` |
| Gemini CLI | `/storyspec:write` |
| Continue Check | 只读检查提示，不直接写正文 |

## 高频命令

### 项目与导航

| 命令 | 作用 |
| --- | --- |
| `storyspec init [name]` | 初始化小说项目 |
| `storyspec upgrade` | 升级现有项目的命令、脚本、规范或模板 |
| `storyspec check` | 检查 Node.js、Git 和常见 AI CLI |
| `storyspec status` | 汇总项目、当前故事长成了什么、tracking、Git 状态和下一步 |
| `storyspec next [story]` | 根据故事状态给出精简下一步建议；`--verbose` 展开完整工作台，`--modes` 查看低负担模式 |
| `storyspec validate` | 校验项目结构、任务、tracking、world/canon、模板和写作规则 |

### 新故事与澄清

| 命令 | 作用 |
| --- | --- |
| `storyspec story:new <name> --idea <text>` | 新建故事工作区并保存原始灵感 |
| `storyspec author-profile` | 查看、初始化、确认、废弃、忽略或清空作者画像偏好 |
| `storyspec interview [story]` | 运行 CLI 创作访谈，保存澄清记录并输出 agent handoff prompt |
| `storyspec clarify [story]` | `interview` 的 CLI 澄清入口，适合非 agent 环境 |
| `storyspec core [story]` | 查看故事核心信息面板；支持 `--missing` 和 `--json` |
| `storyspec ingest [story]` | 从 `--text` 或 `--file` 吸收长文创作资料，默认预览；支持 `--apply-confirmed` 和 `--json` |
| `storyspec reference:reverse [story]` | 从作者提供的参考作品读后笔记或摘要中提取原创化候选，默认 preview-only，不写入正典，不生成原作续写 |
| `storyspec co:create [story]` | 把长文吸收、核心缺口查看和 `preview specify/plan` 串成一个低摩擦入口；支持 `--text`、`--file`、`--apply-confirmed`、`--preview specify|plan|both` |
| `storyspec creative:report [story]` | 查看作者确认、创作回声、卷计划视图、待澄清、AI 建议和漂移风险 |
| `storyspec clarification:rollback --story <story> [--question <id>]` | 把最近一次确认或指定问题退回候选，保留原答案和证据，不修改正文或正典文件 |
| `storyspec preview specify [story]` | 生成 StorySpec v0 规格草案，不直接写入正式规格 |
| `storyspec preview plan [story]` | 生成创作计划 v0 草案，不直接写入 `creative-plan.md` |
| `storyspec apply <preview-id>` | 默认 dry-run；加 `--yes` 后才应用无 blocking 风险的预览；计划草案可显式加 `--draft` |

`storyspec next [story]` 默认是新手视图：当前阶段、一条最推荐的可复制命令、为什么推荐、2 个可选入口和当前 Top 缺口。加 `--verbose` 后会显示五种创作模式：`discover`、`co-create`、`plan`、`write`、`reflect`，并给出主角、伙伴、世界、舞台、能力、势力、冲突、场景、结尾/反转、分支/what-if 等入口。主角、伙伴、舞台、能力、势力和冲突已升级为可测试入口卡：每张卡包含开场问题、有趣选择、候选产物、成熟度影响、正典边界和自然下一步；`next` 会按当前成熟度和灵感文本推荐最适合的入口。入口输出默认是候选，不会绕过确认门禁。

`storyspec next [story] --modes` 会单独展示“今日创作模式”：我想玩角色、我想写一幕、我想整理设定、我想比较分支、我只想随便聊聊。它们默认映射到 `storyspec interview <story> --focus <entry> --max-questions 2 --no-write`，只给少量候选和一句创作回声，不写入文件，不生成完整大纲。作者仍可以确认、改写、拒绝或稍后决定；核心要素不足时，`preview plan` 仍会被门禁阻止。

`storyspec creative:report [story]` 和 `storyspec status` 会展示“创作回声”：当前风味、成熟度、已长出的关键部件、还差的关键部件和下一轮创作回声。`creative:report` 还会在可用时渲染卷计划摘要和 Mermaid 视图，帮助作者检查三幕结构、章节节奏、人物弧线、张力曲线和人物关系。它只回顾已确认或部分确认的创作积累，不把未确认 AI 候选说成正典。

当作者回答“稍后决定”“不知道”“给我示例”等内容时，StorySpec 会把它们作为未决项记录在澄清 Markdown、`storyspec next` 和 `storyspec creative:report` 中，并给出回流条件、证据位置和继续访谈命令；它不会强制打断写作，只在相关上下文重新出现。

高影响示例分叉会尽量展示“有趣选择”的完整后果：吸引力、代价、关系影响、世界影响、后续钩子和确认边界。它检查的是系统给出的候选是否足够可用，不评价作者创意高低；候选仍需作者确认后才会进入正典。

势力入口会把“反派组织”拆成轻量权力结构：资源控制、合法性来源、获利者、受损者、公开叙事、内部裂缝、第一碰撞场景和关系钩子。`clarifications.md` 会展示这些候选结构；`creative:report` 会提示“只有势力名但缺少权力结构”的薄弱项，避免学院、贵族或教会只停留在名字上。

### 世界观、正典和结构

| 命令 | 作用 |
| --- | --- |
| `storyspec world:list` / `storyspec world:check` | 列出或校验 World Bible |
| `storyspec canon:list` / `storyspec canon:check` | 列出或校验 Canon Ledger |
| `storyspec entity:list` | 列出 Entity Graph 中的实体 |
| `storyspec graph:build` / `storyspec graph:check` | 生成或校验实体关系索引 |
| `storyspec scene:init <story>` | 为故事创建 Scene Card 模板 |
| `storyspec scene:list` / `storyspec scene:check` / `storyspec scene:compile` | 管理和检查场景卡 |
| `storyspec voice:list` / `storyspec voice:check` / `storyspec voice:sample` | 管理角色声音指纹 |
| `storyspec preset:list` / `storyspec preset:add <id>` / `storyspec preset:doctor` | 管理 Genre Preset 类型包 |

当前内置 preset：

| Preset | 用途 |
| --- | --- |
| `xuanhuan-cultivation` | 面向玄幻、修仙、升级流的世界观字段、节奏模板和审稿权重 |
| `mystery` | 面向推理悬疑的线索公平性、嫌疑关系、揭示节奏模板和审稿权重 |

### 写作工作台

| 命令 | 作用 |
| --- | --- |
| `storyspec context:pack [story]` | 生成写作上下文包，明确 mustRead reason 和 allowedWrites |
| `storyspec context:validate <pack>` | 校验 Context Pack 的路径、reason 和过期状态 |
| `storyspec draft:new [story]` / `storyspec draft:list [story]` | 创建或列出章节草稿 |
| `storyspec draft:promote <draftId>` | 预览或发布章节草稿到正式正文 |
| `storyspec narrative:test [story]` | 运行叙事测试，检查场景闭环和章节级 fallback |
| `storyspec dialogue:plan` / `storyspec dialogue:check` / `storyspec dialogue:extract` | 管理对话节拍 |
| `storyspec branch:create` / `storyspec branch:list` / `storyspec branch:compare` / `storyspec branch:promote` | 管理剧情 what-if 分支；compare 会输出小说风味、读者承诺变化、收益代价、关系线偏移和世界压力节奏 |
| `storyspec promise:list` / `storyspec promise:check` | 检查读者承诺和 payoff |
| `storyspec rhythm:init` | 初始化本地抽象节奏配置，只记录结构参数，不导入参考作品正文 |
| `storyspec tension:chart` | 输出张力曲线 Markdown 或 JSON |
| `storyspec review` | 运行 reviewer loop，输出结构化 findings 和任务草稿 |
| `storyspec handoff [story]` | 生成断点续写上下文包 |
| `storyspec tasks:board [story]` | 把 `tasks.md` 导出为本地任务看板和 GitHub issue 草稿 |

### 资料、文风、编译和反馈

| 命令 | 作用 |
| --- | --- |
| `storyspec research:add <title>` / `storyspec research:list` | 添加或列出本地 Research Source |
| `storyspec research:link <sourceId> <targetPath>` | 把资料来源关联到 world/canon/spec/story 目标 |
| `storyspec research:check` | 检查 Research Source 与 citation 的本地引用关系 |
| `storyspec reference:reverse [story]` | 将参考作品笔记拆成原作依赖项、高风险相似项、可原创化结构和新故事候选；不抓取原文、不写入 world/canon/spec |
| `storyspec style:lint [story]` | 按 `spec/style` 规则检查正文文风 |
| `storyspec style:explain <ruleId>` | 解释 style rule 的 pattern、severity 和 suggestion |
| `storyspec compile` | 编译 Markdown manuscript，只写入 `build/` |
| `storyspec feedback:import <path>` / `storyspec feedback:list` | 导入或列出结构化读者反馈 |
| `storyspec feedback:triage <id>` | 更新反馈状态，不修改正文 |
| `storyspec feedback:to-tasks` | 把 feedback 转为待确认任务草稿，不直接写入 `tasks.md` |

### Agent integrations

| 命令 | 作用 |
| --- | --- |
| `storyspec agent:list` | 列出支持的 agent integrations |
| `storyspec agent:add <id>` | 给当前项目添加 agent integration |
| `storyspec agent:doctor` | 检查已安装的 agent contract、命令和 manifest |
| `storyspec contract:print` | 输出当前 agent contract |
| `storyspec contract:sync` | 同步 `.specify/agent-contract.md` 和项目入口说明 |

当前内置 15 个 agent integration：

| ID | 名称 | 默认目录 |
| --- | --- | --- |
| `generic` | Generic Markdown Agent | `.specify/commands` |
| `continue-check` | Continue Check | `.continue/prompts` |
| `claude` | Claude Code | `.claude/commands` |
| `cursor` | Cursor | `.cursor/commands` |
| `gemini` | Gemini CLI | `.gemini/commands` |
| `windsurf` | Windsurf | `.windsurf/workflows` |
| `roocode` | Roo Code | `.roo/commands` |
| `copilot` | GitHub Copilot | `.github/prompts` |
| `qwen` | Qwen Code | `.qwen/commands` |
| `opencode` | OpenCode | `.opencode/command` |
| `codex` | Codex CLI | `.codex/prompts` |
| `kilocode` | Kilo Code | `.kilocode/workflows` |
| `auggie` | Auggie CLI | `.augment/commands` |
| `codebuddy` | CodeBuddy | `.codebuddy/commands` |
| `q` | Amazon Q Developer | `.amazonq/prompts` |

### 插件

| 命令 | 作用 |
| --- | --- |
| `storyspec plugins` | 显示插件帮助 |
| `storyspec plugins:list` | 列出已安装插件 |
| `storyspec plugins:add <name>` | 安装内置插件 |
| `storyspec extension:add <name>` | 安装 extension 扩展包；复用 `plugins:add` 的安装计划和安全预览 |
| `storyspec plugins:remove <name>` | 移除插件 |

内置插件：

| 插件 | 作用 |
| --- | --- |
| `authentic-voice` | 真实人声写作辅助 |
| `translate` | 中文小说英译和本地化润色 |
| `book-analysis` | 小说拆解分析 |
| `genre-knowledge` | 类型知识库和商业网文写作知识 |
| `stardust-dreams` | 连接星尘织梦工具市场的高级 AI 创作模板 |

## 初始化选项

```bash
# 在当前目录初始化
storyspec init --here --agent generic

# 生成所有 agent integration 的命令入口
storyspec init --workspace my-novel --all-agents

# 指定写作方法
storyspec init --workspace my-novel --method snowflake --agent claude

# 初始化时安装插件
storyspec init --workspace my-novel --plugins authentic-voice,genre-knowledge

# 为 Codex 生成更具体的 AGENTS.md 写作边界
storyspec init --workspace my-novel --agent codex --agents-profile adult,slow-burn,adventure

# 跳过 Git 初始化
storyspec init --workspace my-novel --no-git
```

## 项目目录

初始化后的项目大致如下：

```text
my-novel/
|-- .specify/
|   |-- config.json
|   |-- agent-contract.md
|   |-- commands/
|   |-- context-packs/
|   |-- memory/
|   |-- presets/
|   |-- previews/
|   |-- scripts/
|   `-- templates/
|-- .continue/
|   `-- prompts/
|-- .codex/
|   `-- prompts/
|-- AGENTS.md
|-- plugins/
|-- spec/
|   |-- canon/
|   |-- graph/
|   |-- knowledge/
|   |-- presets/
|   |-- style/
|   |-- tracking/
|   |-- voice/
|   `-- world/
|-- research/
|   |-- notes/
|   |-- sources/
|   `-- citations.json
|-- feedback/
|   `-- feedback.json
|-- build/
|   |-- manuscript.md
|   |-- manuscript.frontmatter.json
|   `-- reports/
`-- stories/
    `-- 001-story/
        |-- idea.md
        |-- clarifications.json
        |-- clarifications.md
        |-- specification.md
        |-- creative-plan.md
        |-- tasks.md
        |-- task-board.json
        |-- handoff.md
        |-- branches/
        |-- content/
        |-- dialogue/
        |-- drafts/
        |-- revisions/
        `-- scenes/
```

实际生成的 agent 目录取决于 `--agent`、`--all-agents` 和后续 `agent:add`。

## 当前边界

- `research:*` 默认离线管理本地资料和 citation，不抓取网络内容。
- `reference:reverse` 只处理作者提供的读后笔记、摘要或本地资料，输出原创化候选预览；不联网、不下载原作、不解析整本小说、不生成未授权续写正文。
- `style:lint` 只输出 findings 和建议，不自动改正文。
- `feedback:to-tasks` 只生成待确认任务草稿，不直接写入 `tasks.md`。
- `compile` 当前支持 Markdown manuscript，输出只写入 `build/`。
- `draft:promote` 和 `branch:promote` 默认偏预览，需要显式确认才会发布或推进。
- `clarifications.json` 中 `source: ai-suggested` 或 `confirmed: false` 的内容不得静默进入 specification、tasks 或正文。
- `storyspec review` 会把未确认 AI 建议提前落入正文或任务的情况标为 continuity finding。
- 斜杠写作入口由 agent 使用；终端 CLI 当前没有 `storyspec analyze` 这类同名终端命令。

## 升级已有项目

```bash
npm install -g story-spec-cn@latest
cd my-storyspec
storyspec upgrade
```

常用选项：

```bash
storyspec upgrade --agent codex
storyspec upgrade --all-agents
storyspec upgrade --commands
storyspec upgrade --scripts
storyspec upgrade --spec
storyspec upgrade --dry-run
storyspec upgrade --interactive
```

新项目和新文档建议使用 `--agent` / `--all-agents`。旧 `--ai` / `--all` 仍处于兼容期，会映射到 legacy AI 平台并输出迁移提示。

## 本仓库开发

```bash
npm install
npm run build
npm test
npm run test:smoke
```

生成各 agent 命令产物：

```bash
npm run build:commands
```

完整验证：

```bash
npm run verify
```

常用检查：

```bash
npm run check:changes
npm run check:command-manifest
```

## 文档

- [安装指南](docs/installation.md)
- [快速开始](docs/quickstart.md)
- [工作流程](docs/workflow.md)
- [创作控制权指南](docs/creative-control.md)
- [斜杠命令详解](docs/commands.md)
- [Agent integrations](docs/agent-integrations.md)
- [Agent contract](docs/agent-contract.md)
- [Agent 命令对照](docs/agent-commands.md)
- [升级指南](docs/upgrade-guide.md)
- [本地开发](docs/local-development.md)
- [技术架构](docs/tech/architecture.md)

## 许可证

MIT
