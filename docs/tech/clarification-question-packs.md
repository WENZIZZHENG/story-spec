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
```

## 必填规则

- 每个问题包必须有 `id`、`name`、`description`、`keywords`、`questions`。
- 每个问题必须符合 `ClarificationQuestion` schema。
- 每个问题必须包含 `whyItMatters`，说明这个回答会影响什么创作选择。
- 每个问题至少包含 2 个 `exampleAnswers`，推荐 3 个。
- 示例必须分叉，不能只有一个“标准答案”。

## 选择器规则

- `core.yaml` 默认参与选择。
- 其他问题包通过 `keywords` 命中用户输入。
- 默认每轮最多输出 10 个问题。
- `fewer` 模式最多输出 6 个问题。
- `examples-only` 模式不输出问题，只返回可复制示例。

## 当前内置问题包

- `core.yaml`：主角、舞台、目标读者、篇幅、文风、冲突、关系线、结局倾向。
- `portal-fantasy.yaml`：穿越机制、回家动机、异界秩序、文明差异。
- `magic-system.yaml`：规则硬度、失败代价、资源、禁忌、学习路径。
- `slow-burn-romance.yaml`：关系起点、边界、误会、升温节奏、确认节点。
- `civilization-threat.yaml`：局部异常、长线威胁形态、揭示节奏、终局代价。
- `cozy-adventure.yaml`：轻松来源、冒险单元、团队结构、危险强度。
- `kingdom-building-support.yaml`：建设目标、反作用力、工具边界、不要纯种田。
