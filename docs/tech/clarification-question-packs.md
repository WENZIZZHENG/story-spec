# 澄清问题库贡献规范

## 状态

Active。本文说明 `templates/clarification/*.yaml` 的结构、示例要求和选择器约定。

## 目标

澄清问题库用于把用户的一句模糊创意转化为可回答的问题，而不是替用户定稿。每个问题包只提供创作分叉、影响说明和可复制示例。

## 文件结构

```yaml
id: magic-system
name: 编程施法
description: 处理魔法规则硬度、失败代价、资源、禁忌和学习路径。
keywords:
  - 编程
  - 施法
questions:
  - id: magic.rule-hardness
    stage: specify
    topic: magic-system
    question: 编程施法更偏硬规则，还是轻量隐喻？
    whyItMatters: 规则硬度决定读者会期待严谨解谜，还是期待轻松奇思妙想。
    type: single-choice
    required: true
    exampleAnswers:
      - 硬规则，读者能看懂 bug、补丁和法术失败原因。
      - 轻量隐喻，重点是主角用工程思维解决异界问题。
    exampleBranches:
      - label: 轻量隐喻
        answer: 编程施法偏轻量隐喻，主角用工程思维理解魔法，不展开完整代码体系。
        flavor: 轻松、顺滑，重点是奇思妙想和角色行动。
        tradeoffs:
          - 技术辨识度会弱一些。
        downstreamImpact: 阅读承诺更接近轻松冒险，能力边界要靠失败代价呈现。
        recommendedFor:
          - 轻松冒险优先
```

## 必填规则

- 每个问题包必须有 `id`、`name`、`description`、`keywords`、`questions`。
- 每个问题必须符合 `ClarificationQuestion` schema。
- 每个问题必须包含 `whyItMatters`，说明这个回答会影响什么创作选择。
- 每个问题至少包含 2 个 `exampleAnswers`，推荐 3 个。
- 高影响问题推荐包含 2-3 个 `exampleBranches`，字段包括 `label`、`answer`、`flavor`、`tradeoffs`、`downstreamImpact`、`recommendedFor`。
- 示例必须分叉，不能只有一个“标准答案”；分叉要说明风味、代价和后续影响。

## 共创访谈覆盖要求

问题库的首要目标是让作者享受创造小说世界的过程，所以问题应围绕“有趣选择”组织，而不是把用户推入一次性表单。

- `core.yaml` 必须覆盖主角、核心伙伴、第一舞台、势力与冲突、阅读承诺、成功路线和作品声音。
- 类型问题包必须补齐本类型会真正改变故事走向的选择，例如 `magic-system.yaml` 负责能力边界和失败代价，`civilization-threat.yaml` 负责小异常、揭示节奏和文明级代价。
- 每个高影响问题都应能说明它会影响哪些下游产物：`specification.md`、`creative-plan.md`、章节任务、世界观、正典、人物关系或读者承诺。
- 问题分叉应提供 2-3 个风味明显不同的方向，避免只有“稳妥推荐”。其中至少一个方向应鼓励作者继续自定义或暂缓决定。
- 示例分叉只用于启发和改写；除非用户明确确认，否则不能进入正典、规格、计划、任务或正文。
- 当主角、伙伴、舞台、能力、势力冲突、长线威胁等核心要素仍缺失时，选择器应优先继续访谈，而不是推动 `creative-plan.md` 直接落盘。

## 选择器规则

- `core.yaml` 默认参与选择。
- 其他问题包通过 `keywords` 命中用户输入。
- 默认每轮最多输出 10 个问题。
- `fewer` 模式最多输出 6 个问题。
- `examples-only` 模式不输出问题，只返回可复制示例。
- 选择器输出应标注访谈阶段，优先顺序为：种子灵感、核心角色、第一舞台、能力体系、势力冲突、阅读承诺、成功路线、作品声音。
- AI 生成的候选项必须保留来源和确认状态，不能被选择器当作作者已确认答案。

## 当前内置问题包

- `core.yaml`：主角、舞台、目标读者、篇幅、文风、冲突、关系线、结局倾向。
- `portal-fantasy.yaml`：穿越机制、回家动机、异界秩序、文明差异。
- `magic-system.yaml`：规则硬度、失败代价、资源、禁忌、学习路径。
- `slow-burn-romance.yaml`：关系起点、边界、误会、升温节奏、确认节点。
- `civilization-threat.yaml`：局部异常、长线威胁形态、揭示节奏、终局代价。
- `cozy-adventure.yaml`：轻松来源、冒险单元、团队结构、危险强度。
- `kingdom-building-support.yaml`：建设目标、反作用力、工具边界、不要纯种田。
