# 参考作品反向拆解路线图

## 状态

Active。本文登记“参考作品反向拆解 / 原创化转译”的实现待办。实现前应按影响范围转为 OpenSpec change；本文不替代 OpenSpec artifacts。

## 背景和目标

作者常会喜欢一部小说的世界运行逻辑、爽点结构、主角处境、权力关系或未完成读者承诺，但原作可能太监、后续情节令人不适，或作者希望把喜欢的结构转成自己的新故事。StorySpec 目前已有本地 `research:*`、`ingest`、`world/canon`、`preview/apply` 和候选/确认边界，但缺少一个明确流程，帮助作者把“喜欢和讨厌的参考作品”拆成可原创开发的设计输入。

目标是提供一条克制的反向拆解路径：提取参考作品的结构、读者承诺和创作偏好，再转译成原创候选，而不是默认复制受保护作品的专有世界观、角色、剧情、术语或未授权续写内容。

## 非目标

- 不提供盗版抓取、联网下载或整本解析。
- 不默认生成原作续写正文。
- 不把受保护作品的专有名词、角色、设定细节、剧情线直接写入原创项目正典。
- 不绕过 `candidate / preview / confirm / apply` 边界。
- 不把“同人续写记录”误标为原创项目可发布内容。

## 模式划分

| 模式 | 用途 | 边界 |
| --- | --- | --- |
| 同人续写记录 | 私人自用，整理原作世界观、坑点和想续方向 | 明确标注非原创，不默认进入正式项目 |
| 精神内核提取 | 提取“我喜欢它什么”：类型承诺、爽点、关系张力、世界压力 | 不保留专有名词、角色名、原设定细节 |
| 原创化转译 | 把原作吸引力转成新故事的世界观候选 | 输出 candidate，必须经作者确认后才进正典 |

推荐优先实现“原创化转译”垂直切片。

## P0 立即处理

### P0-1 参考作品反向拆解与原创化转译

- 类型：创作输入、资料内化、原创边界、agent prompt、CLI preview。
- 背景/问题：作者想沿用喜欢作品的世界观气质、读者承诺和未完成路线，但如果直接沿用原作世界观，容易变成侵权续写、专有设定复制或正典污染。StorySpec 需要帮助作者把“喜欢什么、讨厌什么、想修复什么”拆成原创设计输入。
- 已有基础：`storyspec research:add/list/link/check` 能管理本地资料来源；`storyspec ingest` 和 `co:create` 能把长文资料拆成候选；`storyspec world/canon` 能承载世界观和正典；`preview/apply`、`confirmed`、`sourceLabel` 已能保护作者确认边界；README 已写明 research 默认离线、不抓取网络内容。
- 缺口：缺少专门的反向拆解命令或 prompt 流程，无法输出“吸引力拆解 / 原作依赖项 / 高风险相似项 / 可原创化功能结构 / 想保留的读者承诺 / 想修复的情节路线 / 新故事候选世界观 / 不得直接照搬清单”。
- 建议方案：后续 OpenSpec 先设计一个 preview-only 流程，例如 `storyspec reference:reverse` 或 agent command。输入来自作者提供的摘要、读后笔记或本地研究资料；输出只进入候选文档或 preview，不直接写入 world/canon/spec。第一版不解析整本小说，不联网，不生成续写正文。
- 涉及文件/模块：`src/application/` 中 research / ingest / preview 相关模块、`src/cli/commands/`、`templates/commands/`、`docs/creative-control.md`、`README.md`、`tests/unit/`、`tests/smoke/`。
- 参考项目/资料：现有 `research:*` 本地资料管理、`ingest/co:create` 候选吸收、`preview/apply` 确认门禁、`rhythm:init` “只记录结构参数，不导入参考作品正文”的原创边界、`storyspec branch:*` 的 what-if 分支管理。
- OpenSpec 输入：新建 OpenSpec change `add-reference-reverse-extraction`。proposal 必须写清版权/原创边界；design 需定义输入来源、输出结构、candidate 标记、不可照搬清单、同人/原创两种项目标签；tasks 至少包含 schema/DTO、prompt 或 CLI preview、测试 fixture、文档同步、changeset 和待办状态更新。
- 验收标准：给定一段作者写的参考作品读后笔记，系统能输出结构化反向拆解；输出必须区分“原作依赖项”“高风险相似项”“可原创化结构”和“新故事候选”；默认不写入正典；确认写入前必须经过 preview/apply；README 或用户文档不承诺未授权续写。
- 验收命令：`npm run build`、相关 unit、相关 CLI smoke、`npm run check:changes`、`git diff --check`。若修改命令模板，额外运行 `npm run build:commands` 和 `npm run check:command-manifest`。
- 不做/边界：不下载或抓取原作文本；不复述长篇原文；不把原作专有角色、势力、地名、术语或剧情线默认转入原创项目；不自动判断法律风险，只提供创作边界和确认门禁。

## 完成同步

- 实现前先转 OpenSpec change。
- 若新增 CLI 或 agent command，更新 README / commands / agent guide 中的真实可用能力。
- 若修改命令模板，运行 `npm run build:commands` 和 `npm run check:command-manifest`。
- 涉及用户可见行为或模板契约时新增 changeset。
- 完成后更新本文状态，追加 [todo-archive.md](todo-archive.md) 归档条目，并从 [todo-index.md](todo-index.md) 移除活跃路线。
