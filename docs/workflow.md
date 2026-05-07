# 创作流程

StorySpec 的目标不是替作者一次性生成完整小说，而是把“创意、澄清、规格、计划、任务、正文、追踪”拆成可确认的步骤，让作者保留控制权。

## 总览

```text
一句话灵感
  -> 澄清访谈或长文吸收
  -> 核心信息面板
  -> 创作宪法
  -> 故事规格
  -> 创作计划
  -> 写作任务
  -> 章节写作
  -> 分析、追踪、修订
```

## 1. 保存原始创意

```bash
storyspec story:new 法术编译纪元 --idea "异界穿越、编程施法、慢热感情、文明级威胁"
storyspec next 法术编译纪元
```

这个阶段只保存作者原意和待澄清问题，不急着生成完整设定。

## 2. 澄清或吸收长文，而不是代写设定

适合使用：

```bash
storyspec interview 法术编译纪元
```

如果作者已经有几百字聊天记录、设定笔记或一次性给了多个回答，适合使用：

```bash
storyspec ingest 法术编译纪元 --file notes.md
storyspec co:create 法术编译纪元 --file notes.md --apply-confirmed --preview specify
```

`ingest` 会把明确字段和无标题自然段拆成“建议写入 / 保留候选 / 仍需确认”。`co:create` 把长文吸收、核心面板和可选 preview 串成一个入口；默认不写入，只有明确表达的字段才会在 `--apply-confirmed` 后进入澄清记录。

或在 agent 中使用：

```text
/clarify
```

好问题应该给作者选择空间，例如：

- 主角穿越前的专业背景偏工程、算法、运维，还是产品化开发？
- 编程施法更像写代码、调试符文，还是声明式规则编排？
- 慢热感情是互相欣赏、共同冒险，还是长期误解后靠行动建立信任？

## 3. 查看核心信息面板

```bash
storyspec core 法术编译纪元 --missing
storyspec creative:report 法术编译纪元
```

`core` 适合快速看核心创意、主角、伙伴、第一舞台、能力体系和创作边界是否已确认。它会标记 `[作者确认]`、`[AI 候选]`、`[待澄清]`、`[稍后决定]` 等状态，避免把候选误当成正典。

`creative:report` 适合看作者已经创造出的故事骨架和下一轮入口；如果已有卷计划摘要，它还会显示三幕结构、章节节奏、人物弧线、张力曲线和人物关系视图。

## 4. 建立创作宪法

```text
/constitution
```

创作宪法用于记录长期不变的写作原则，例如叙事边界、文风、关系处理、爽点克制方式。它不应该替代故事规格，也不应该写成正文。

## 5. 生成规格并先预览

```bash
storyspec preview specify 法术编译纪元
storyspec apply <preview-id> --yes
```

规格只写已经确认的内容。AI 可以提出候选设定，但候选内容应先留在澄清记录或 preview 中。

## 6. 制定计划和任务

```text
/plan
/tasks
```

计划回答“怎么写”，任务回答“下一步写什么”。任务应该能被检查，例如：

- 本章要推进哪个冲突？
- 哪个角色关系发生变化？
- 哪个伏笔建立或兑现？
- 允许修改哪些文件？

## 7. 写章节

```text
/write 第一章
```

写作入口先输出章节前置约束卡；作者确认后给 3-6 条 scene beat 或等价章节方向预览；beat 确认后先给 800-1500 字左右章节小样，用来确认读感、情绪顺序、人物反应、冲突推进、尺度边界和文风方向；小样确认或改写后再分块输出完整正文，最后单独给出写后自检和收尾验证摘要。JSON 输出时阶段仍只使用 `plan`、`write`、`finish`：约束卡、beat 和小样属于 `plan`，完整正文属于 `write`，自检收尾属于 `finish`。

写作前先读取：

- `AGENTS.md`
- `.specify/agent-contract.md`
- `stories/*/specification.md`
- `stories/*/creative-plan.md`
- `stories/*/tasks.md`
- 必要的 `spec/world/`、`spec/canon/`、`spec/tracking/`

## 8. 检查和修订

常用命令：

```bash
storyspec status
storyspec validate
storyspec context:pack 法术编译纪元
```

Agent 命令：

```text
/analyze
/review
/track
```

## 写作方法怎么选

| 方法 | 适合场景 | 使用建议 |
| --- | --- | --- |
| 三幕结构 | 大多数类型小说 | 默认选择，节奏稳定 |
| 英雄之旅 | 冒险、成长、奇幻 | 强调角色转变 |
| 雪花法 | 从一句话慢慢扩展 | 适合早期构思 |
| 七点结构 | 冲突清晰的类型故事 | 适合检查转折点 |
| 故事圆环 | 角色从缺失到改变 | 适合慢热关系和成长线 |
| Pixar 公式 | 短篇、单元剧情 | 适合快速验证故事核心 |

方法只是支架，不是模板牢笼。长篇项目可以主线用三幕结构，角色线用故事圆环，单章用 Scene Card。

## 实践原则

- 少量确认，多轮推进。
- AI 建议先作为候选，不直接进入正典。
- 规划阶段不写正文。
- 写正文前先检查任务边界。
- 每次大改前保留 Git 提交。
- 设定事实放进 `spec/world/` 或 `spec/canon/`，不要只留在对话里。

## 相关文档

- [快速开始](quickstart.md)
- [命令语义速查](commands.md)
- [创作控制权指南](creative-control.md)
