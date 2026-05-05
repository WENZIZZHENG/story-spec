# StorySpec 文档

*让 AI 成为你的创作伙伴，用可确认的共创流程编写长篇故事。*

**StorySpec 是面向中文长篇小说的共创型编辑台：先保存作者原始灵感，再通过低负担入口、候选分叉、预览确认和写作反馈，把故事逐步沉淀成规格、计划、任务和正文。**

## 什么是共创型编辑台？

共创型编辑台不是把一句灵感直接扩成完整大纲。StorySpec 会先帮作者选择今天从哪里继续：长文资料、一句灵感、表格资料、随便聊聊，或主角、伙伴、舞台、能力、势力、冲突等入口卡。AI 可以提出候选和示例，但进入正典、规格、计划或正文前，必须经过 preview / confirm / apply 或等价确认流程。

## 快速导航

- [安装指南](installation.md)
- [快速入门](quickstart.md)
- [创作流程](workflow.md)
- [创作控制权指南](creative-control.md)
- [升级指南](upgrade-guide.md)

## 核心理念

故事驱动创作是一个结构化的过程，强调：

- **意图驱动的创作** - 先定义"写什么"，再考虑"怎么写"
- **用户确认优先** - AI 可以建议，但未确认建议不能直接进入正典
- **素材分流优先** - 先判断作者手里是长文、一句灵感、表格还是闲聊，再给可复制下一步
- **多步骤细化过程** - 候选、预览、确认、应用分开，不一次性从 prompt 定稿
- **写作反馈可见** - 写正文前先看 scene beat，正文分块推进，结束时给出验证和 tracking 待确认项

## 创作阶段

| 阶段 | 重点 | 关键活动 |
|------|------|---------|
| **从零开始**（"白纸创作"） | 全新创作 | <ul><li>用 `storyspec story:new` 保存原始创意</li><li>通过 `storyspec next` 选择素材分流和入口卡</li><li>用 `storyspec interview` 逐步澄清，或用 `storyspec ingest` / `storyspec co:create` 吸收长文设定</li><li>用 `storyspec core` / `storyspec creative:report` 查看缺口和创作回声</li><li>生成并确认规格预览</li></ul> |
| **创意探索** | 多样化尝试 | <ul><li>探索不同的故事走向</li><li>比较 what-if 分支的小说风味、收益代价和关系偏移</li><li>把未确认示例保留为候选，不静默写入正典</li></ul> |
| **迭代完善**（"润色修改"） | 持续改进 | <ul><li>逐章添加内容</li><li>用 Scene Card、Context Pack 和任务边界控制写作</li><li>用 review / validate 检查漂移、追踪和写作规则</li></ul> |

## 核心特性

### 🎯 结构化创作流程
- 从原始灵感、素材分流、访谈澄清到 preview / apply 的完整路径
- 清晰的阶段划分，每步都有明确确认边界
- 系统化的任务管理，让正文写作前先有规格、计划、任务和 Scene Card

### 🤖 AI 智能辅助
- 支持 Codex、Claude、Cursor、Gemini 等主流 AI 助手
- AI 帮你提出候选、示例和下一轮问题，但不替作者抢定正典
- 写作入口默认先给 beat 预览，再分块写正文，最后输出验证摘要

### 📚 专业模板系统
- 故事规格模板 - 区分作者确认、AI 候选、待澄清和稍后决定
- 创作计划和任务模板 - 明确每章的功能、边界、读者承诺和追踪证据
- Agent contract 和命令模板 - 让不同工具共用同一套项目资料

### 🔄 版本管理支持
- 集成 Git 进行版本控制
- 轻松回溯和比较不同版本
- 多人协作创作支持

## 适用人群

### 网络小说作者
- 需要保持日更的网文作者
- 希望提高创作效率
- 想要保持情节连贯性

### 业余写作爱好者
- 有故事想法但不知如何下笔
- 希望系统学习小说创作
- 需要 AI 助手帮助完成作品

### 专业作家
- 探索 AI 辅助创作的可能性
- 管理复杂的长篇小说项目
- 提高创作产出效率

## 工作原理

1. **保存原始创意并选择入口** (`storyspec story:new` / `storyspec next`)
   - 先把一句话灵感保存下来
   - 从主角、伙伴、世界、场景、分支等入口选择今天要聊的方向

2. **创作访谈或长文吸收** (`storyspec interview` / `storyspec ingest` / `storyspec co:create`)
   - 从一句话灵感开始收集澄清答案
   - 把几百字设定或多条回复拆成明确项和候选项
   - 记录用户已明确、需要澄清和 AI 建议

3. **核心信息检查** (`storyspec core` / `storyspec creative:report`)
   - 快速查看主角、伙伴、第一舞台、能力体系、势力冲突和创作边界
   - 区分作者确认、部分确认、AI 候选、待澄清和稍后决定
   - 在可用时查看卷计划摘要、三幕结构、人物弧线、张力曲线和人物关系视图

4. **创建故事规格** (`storyspec preview specify` / `storyspec apply`)
   - 先输出可审阅的 preview
   - 只把已确认答案写入规格

5. **可选：设定创作风格** (`/storyspec-constitution`)
   - 定义你的写作风格和准则
   - AI 会记住并遵循这些设定

6. **规划章节结构** (`/storyspec-plan`)
   - 将故事分解为具体章节
   - 明确每章的目标和冲突

7. **生成写作任务** (`/storyspec-tasks`)
   - 创建可执行的任务列表
   - 按优先级组织写作进度

8. **AI 辅助写作** (`/storyspec-write`)
   - 先输出 3-6 条 scene beat 预览
   - 正文按 scene、自然段组或目标字数分块推进
   - 收尾输出正文路径、字数、验证和 tracking 待确认项

## 与传统写作的区别

| 传统写作 | StorySpec |
|----------|--------------|
| 独自构思情节 | AI 提供候选和问题，作者确认后才进入正典 |
| 手动管理大纲 | 规格、计划、任务、Scene Card 分层管理 |
| 容易偏离主线 | review / validate 检查未确认建议和创作漂移 |
| 风格容易飘忽 | 宪法、作者画像和 VoiceFingerprint 共同约束风味 |
| 进度难以把控 | `status`、`creative:report` 和 `tasks:board` 给出下一步 |

## 开始你的创作之旅

准备好让 AI 成为你的创作伙伴了吗？

1. 📦 [安装 StorySpec](installation.md)
2. 🚀 [5 分钟快速入门](quickstart.md)
3. 📖 [深入了解创作流程](workflow.md)
4. 🧭 [学习如何保留创作控制权](creative-control.md)

## 加入社区

- 🐛 [报告问题](https://github.com/WENZIZZHENG/story-spec/issues)
- 💡 [功能建议](https://github.com/WENZIZZHENG/story-spec/discussions)
- 🤝 [贡献代码](https://github.com/WENZIZZHENG/story-spec/pulls)

---

**StorySpec** - 基于 [Spec Kit](https://github.com/sublayerapp/spec-kit) 架构，专为中文小说创作者设计。
