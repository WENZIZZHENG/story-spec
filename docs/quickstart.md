# 快速入门指南

这份指南将帮助你在 5 分钟内开始使用 StorySpec 创作你的第一本小说。

## 8 步快速开始

### 步骤 1：安装 StorySpec

```bash
npm install -g story-spec-cn
```

### 步骤 2：初始化项目

```bash
storyspec init --workspace 我的第一本小说 --agent codex
cd 我的第一本小说
```

### 步骤 3：在 AI 助手中打开项目

在 Codex 或其他 AI 助手中打开项目目录。本文示例使用 Codex 的 `/storyspec-...` 前缀；如果你选择 Claude 或 Gemini，请按 [Agent 命令对照](agent-commands.md) 换成 `/storyspec.命令名` 或 `/storyspec:命令名`。

### 步骤 4：创建新故事创意草稿

先把一句话创意保存为草稿，不要急着让 AI 扩写完整设定：

```bash
storyspec story:new 法术编译纪元 --idea "异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁"
storyspec next 法术编译纪元
```

`storyspec next` 默认只显示一条最推荐、可复制的下一步命令，以及 2 个可选入口。先工作区路径，再素材入口，再复制命令，是这条开局路径的默认顺序。想看完整入口卡时运行 `storyspec next 法术编译纪元 --verbose`；想只看低负担今日玩法时运行 `storyspec next 法术编译纪元 --modes`。

### 步骤 5：完成创作访谈

```bash
storyspec interview 法术编译纪元 --focus protagonist --premise "异界穿越、轻松冒险、编程施法、慢热感情、文明级威胁" --max-questions 6
storyspec core 法术编译纪元 --missing
storyspec creative:report 法术编译纪元
```

你也可以把 `--focus protagonist` 换成 `--focus scene`、`--focus partner`、`--focus world` 等入口，先玩一个角色、一幕戏或一个世界压力点。你可以回答“稍后决定”“不知道”或选择示例；它们会被记录下来，但不会被当成已经定稿的正典设定。

如果你已经和 AI 聊出了一大段设定，或者想一次粘贴多条回复，不必拆成很多个 `questionId=answer`。先放进 `notes.md`，然后运行：

```bash
storyspec ingest 法术编译纪元 --file notes.md
storyspec co:create 法术编译纪元 --file notes.md --apply-confirmed --preview specify
```

`ingest` 默认只预览；`co:create` 会把长文吸收、核心缺口和规格预览串起来。无标题自然段只会进入候选，不会因为 `--apply-confirmed` 自动写入正典。长文、表格和多回复资料都遵循 candidate / preview / confirm / apply 的门禁，待澄清只是候选，不是失败。

### 步骤 6：生成 StorySpec v0 草案

```bash
storyspec preview specify 法术编译纪元
storyspec apply <preview-id>       # 只预览，不写入
storyspec apply <preview-id> --yes # 确认后写入 specification.md
```

如果还有 required 问题未确认，`apply --yes` 会被阻止，避免 AI 把候选建议写进正式规格。

### 步骤 7：可选：设定创作风格

如果你已经明确文风和更新节奏，可以在 AI 助手中补充作者偏好；如果还没想好，可以先跳过，不影响继续生成规格和计划。

在 AI 助手中输入平台对应的 agent 命令，例如：
```
/storyspec-constitution 我想写一本网络爽文风格的小说，节奏明快，代入感强，主角有明确的升级路线
```

### 步骤 8：继续规划和写作

```text
/storyspec-plan 基于已确认 specification 规划第一卷结构
/storyspec-tasks 把第一卷拆成可执行写作任务
/storyspec-write 开始写作第一章
```

如果你在终端里继续，先用 CLI 检查 `/storyspec-tasks` 生成的文件，再进入正文：

```bash
storyspec tasks:board 法术编译纪元
storyspec scene:init 法术编译纪元
storyspec context:pack 法术编译纪元
storyspec draft:new 法术编译纪元 --chapter 001
```

恭喜！你已经开始了你的小说创作之旅。

## 详细示例：创建《都市修仙者》

让我们通过一个完整的例子来了解整个创作流程。

### 第 1 步：项目初始化

```bash
# 创建项目
storyspec init --workspace 都市修仙者 --agent codex

# 进入项目目录
cd 都市修仙者
```

你会看到以下输出：
```
╔═══════════════════════════════════════╗
║     📚  StorySpec  📝              ║
║     AI 驱动的中文小说创作工具        ║
╚═══════════════════════════════════════╝

✓ 小说项目 "都市修仙者" 创建成功！

接下来:
  1. cd 都市修仙者 - 进入项目目录
  2. 在 Codex 中打开项目
  3. 先保存一句灵感，不急着生成完整大纲:
     storyspec story:new 故事名 --idea "一句话创意"
  4. 选择今天的创作入口:
     storyspec next 故事名
  5. 完成一轮低负担访谈，再预览规格:
     storyspec interview 故事名 --focus protagonist --premise "一句话创意"
     storyspec core 故事名 --missing
     storyspec creative:report 故事名
     storyspec preview specify 故事名
     storyspec apply <preview-id> --yes
```

### 第 2 步：保存创意并查看下一步入口

```bash
storyspec story:new 都市修仙者 --idea "25岁程序员陈凡，996加班时意外激活手机里的修仙 APP。"
storyspec next 都市修仙者
```

`next` 会根据当前故事状态推荐可以复制的下一步命令；加 `--verbose` 可展开主角、伙伴、世界、场景等完整入口卡。第一次进入项目时，优先看工作区位置，再选素材入口，最后复制命令继续。

### 第 3 步：完成创作访谈和报告

```bash
storyspec interview 都市修仙者 --premise "都市修仙、程序员、修仙 APP、隐藏身份、保护身边的人" --max-questions 6
storyspec core 都市修仙者 --missing
storyspec creative:report 都市修仙者
```

访谈阶段会把不确定的内容保留下来，例如：

- 修仙 APP 的来源是否先保密？
- 女主是否在第一卷觉醒？
- 反派组织是早登场还是只露出线索？

### 第 4 步：生成并确认 StorySpec v0 草案

```bash
storyspec preview specify 都市修仙者
storyspec apply <preview-id> --yes
```

AI 只会在 `apply --yes` 且无 blocking 风险时写入 `stories/都市修仙者/specification.md`。

### 第 5 步：可选：补充创作风格

如果你已经明确希望 AI 遵循的文风，可以在 AI 助手中输入：

```text
/storyspec-constitution 创作风格设定：
- 文体：网文爽文风格，节奏明快
- 视角：第三人称限制视角，以主角为主
- 语言：通俗易懂，对话生活化
- 描写：动作场面详细，打斗精彩
- 节奏：2-3章一个小高潮，10章一个大高潮
- 字数：每章3000-4000字
```

AI 会创建或更新 `.specify/memory/constitution.md` 文件，记录你的创作偏好。

### 第 6 步：规划章节结构（agent 内部命令）

```text
/storyspec-plan 规划前30章的结构：

第一卷：初入修仙（1-10章）
- 第1章：996猝死危机，激活修仙APP
- 第2章：初次修炼，体验炼体的神奇
- 第3章：上班炼神识，代码能力暴涨
- 第4-5章：第一个任务，公园寻宝遇张老
- 第6-7章：食堂灵气餐，引起林雨晴注意
- 第8-9章：夜遇劫匪，首次实战
- 第10章：突破炼气期，身体素质大变

第二卷：都市历练（11-20章）
- 第11-12章：公司项目危机，用修仙能力解决
- 第13-15章：林雨晴遇险，暴露部分实力
- 第16-17章：黑龙会出现，都市修仙者曝光
- 第18-19章：拜张老为师，学习隐藏之术
- 第20章：筑基成功，实力大进

第三卷：风起云涌（21-30章）
...
```

### 第 7 步：生成任务列表（agent 内部命令）

```text
/storyspec-tasks 基于章节规划生成写作任务
```

AI 会创建 `stories/001-都市修仙者/tasks.md`，包含：
- 每章的写作任务
- 需要补充的设定
- 角色深化任务
- 伏笔安排

生成后在终端中运行：

```bash
storyspec tasks:board 都市修仙者
```

如果任务清单还不存在，`tasks:board`、`context:pack` 和写作状态检查都会提示先执行 `/storyspec-tasks`，并给出后续可复制命令。

### 第 8 步：开始写作（agent 内部命令）

```text
/storyspec-write 开始写作第一章
```

AI 会先给出 3-6 条 scene beat 预览，确认方向、冲突、人物变化和风险；确认后再按正文块推进，并在收尾时汇总正文路径、字数、验证和 tracking 待确认项。下面是一段示例正文片段：

```markdown
# 第一章 996的尽头是修仙

凌晨两点，海天大厦23层still灯火通明。

陈凡揉了揉发涩的眼睛，第五杯咖啡已经下肚，但困意依然如潮水般涌来。
电脑屏幕上密密麻麻的代码开始模糊，他知道自己已经到了极限。

"凡哥，要不先回去休息吧？"旁边工位的小李关切地说道，
"你都连续通宵三天了，铁人也扛不住啊。"

陈凡摇了摇头："马上就改完了，这个版本明天必须上线。"

就在他敲下最后一行代码的瞬间，眼前一黑...

【叮！检测到宿主生命力即将耗尽，修仙APP紧急启动！】

一道机械的声音在脑海中响起，陈凡猛地睁开眼睛，
发现自己还坐在工位上，但整个世界似乎都不一样了...
```

## 命令详解

### storyspec story:new / storyspec next / storyspec interview / storyspec ingest / storyspec co:create / storyspec preview specify - 创建故事规格

**用途**：先保存原始创意，再选择入口澄清关键选择，最后生成可确认的 StorySpec v0 草案

**示例**：
```bash
storyspec story:new 重生之都市仙尊 --idea "前世仙尊重生回高三时期"
storyspec next 重生之都市仙尊
storyspec interview 重生之都市仙尊 --premise "都市修仙、重生、弥补遗憾、守护所爱之人"
storyspec ingest 重生之都市仙尊 --file notes.md
storyspec co:create 重生之都市仙尊 --file notes.md --apply-confirmed --preview specify
storyspec preview specify 重生之都市仙尊
```

### /storyspec-constitution - 可选设定创作风格

**用途**：定义你的写作风格和创作准则

建议在第一版 specification 已确认后补充；它不是创建故事的第一步。

**示例**：
```text
/storyspec-constitution
写作风格：轻松幽默的都市文
叙事视角：第一人称
语言特点：网络流行语适度使用，对话贴近生活
更新计划：日更4000字
```

### /storyspec-plan - 章节规划

**用途**：将故事分解为具体的章节，明确每章的目标

**示例**：
```text
/storyspec-plan
规划前50章内容，分为5个小高潮：
1-10章：重生归来，展现实力
11-20章：守护家人，初露锋芒
21-30章：商业布局，资源积累
31-40章：古武界现，强敌环伺
41-50章：灵气初现，大战将起
```

### /storyspec-tasks - 任务分解

**用途**：生成具体的写作任务清单

**示例**：
```text
/storyspec-tasks
基于大纲生成任务：
- 优先级1：写作开篇3章
- 优先级2：完善主要角色设定
- 优先级3：补充都市修炼体系
```

### /storyspec-write - 章节写作

**用途**：AI 辅助创作具体章节内容

**示例**：
```text
/storyspec-write
写作第二章，要点：
- 主角初次修炼成功
- 体现修炼的独特之处
- 埋下与女主相遇的伏笔
```

## 实用技巧

### 1. 保持风格一致性

每次使用 `/storyspec-write` 前，AI 都会参考 `.specify/memory/constitution.md`、作者画像、故事规格、创作计划、任务清单和 Scene Card，确保风格和任务边界一致。

### 2. 灵活调整大纲

故事大纲不是一成不变的，可以随时修改：
```text
修改第15章的内容，改为主角与反派首次正面冲突
```

### 3. 批量创作

可以一次性安排多个章节的写作：
```text
/storyspec-write 连续写作第3-5章，保持剧情连贯性
```

### 4. 版本管理

定期提交你的创作成果：
```bash
git add .
git commit -m "完成第一卷创作"
```

### 5. 角色一致性

创建角色卡片，确保性格统一：
```text
创建林雨晴的详细人设卡，包括：
- 性格特点
- 说话方式
- 行为习惯
- 成长弧线
```

## 常见问题

**Q: AI 生成的内容不符合我的预期怎么办？**

A: 可以通过以下方式调整：
1. 修改 `/storyspec-constitution` 中的风格设定
2. 在 `/storyspec-write` 时提供更详细的要求
3. 直接编辑生成的内容，AI 会学习你的修改

**Q: 如何确保剧情的连贯性？**

A: StorySpec 会：
1. 始终参考故事大纲和章节规划
2. 记住之前章节的内容
3. 追踪伏笔和未解决的剧情线

**Q: 可以同时创作多本小说吗？**

A: 可以，每个故事都在 `stories/` 目录下有独立的文件夹，互不干扰。

## 进阶使用

### 创作不同类型的小说

StorySpec 支持各种类型：

- **玄幻修仙**：完整的修炼体系和世界观
- **都市异能**：现代背景下的超能力设定
- **科幻未来**：硬科幻或软科幻都可以
- **历史架空**：基于历史的二次创作
- **言情小说**：细腻的情感描写
- **悬疑推理**：严密的逻辑和伏笔

### 协作创作

如果多人协作：

1. 使用 Git 进行版本管理
2. 每人负责不同的章节或角色
3. 定期合并和统一风格

## 下一步

恭喜你完成了快速入门！接下来你可以：

1. 📖 深入了解[创作流程](workflow.md)
2. 🎯 探索更多高级功能
3. 💡 加入社区分享创作经验

---

开始创作你的精彩故事吧！🚀
