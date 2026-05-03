# 故事成熟度模型

## 状态

Accepted。本文记录 Batch D4 引入的故事成熟度阶段，用于让早期灵感成为合法项目状态。

## 阶段定义

| 阶段 | 触发信号 | 含义 |
| --- | --- | --- |
| `idea` | 只有 `idea.md`，或没有更高阶段产物 | 一句话、标签组、粗略愿望、角色候选仍可保存 |
| `interviewing` | 存在 `clarifications.md` 或 `clarifications.json` | 用户正在回答问题或审阅 AI 建议 |
| `specified` | 存在 `specification.md` | 故事目标已经可被规划，但计划可能尚未生成 |
| `planned` | 存在 `creative-plan.md` | 创作计划已经存在，等待拆任务 |
| `tasked` | 存在 `tasks.md` | 已进入任务执行准备 |
| `drafting` | 存在正文 Markdown | 已进入正文写作 |
| `revising` | 预留 | 后续用于修订期状态 |

当前实现按产物信号自动推断阶段，尚未引入显式 stage 文件。

## 早期合法状态

以下文件被视为早期创作状态的一部分：

- `stories/<story>/idea.md`
- `stories/<story>/clarifications.md`
- `stories/<story>/clarifications.json`
- `stories/<story>/candidates.md`

当故事处于 `idea` 或 `interviewing` 阶段时，`validate` 不把缺少 `specification.md`、`creative-plan.md`、`tasks.md` 当成 warning。`status` 会输出创作缺口和下一步问题，而不是催用户补文件。

## 必需产物规则

- `idea` / `interviewing`：不要求 spec、plan、tasks。
- `specified`：允许缺 plan/tasks，但以 info 提醒下一步。
- `planned`：允许缺 tasks，但以 info 提醒下一步。
- `tasked` / `drafting`：开始按任务和正文阶段检查缺失产物。

## 当前边界

- CLI 暂未新增独立的 `status --creative` 参数；现有 `novel status` 已直接输出创作阶段、创作缺口和下一步问题。
- `revising` 阶段仅作为领域枚举保留，后续由修订工作流或 review 结果接入。
- `candidates.md` 已作为早期信号扫描，但候选内容的结构化解析留给后续示例分叉和来源追踪批次。
