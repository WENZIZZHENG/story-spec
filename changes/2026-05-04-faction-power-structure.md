---
change_type: minor
scope: schema,templates,cli,docs,tests
---

# 势力入口与权力结构共创

## CLI 行为

- `storyspec interview [story] --entry faction` 现在会通过内置 faction 高影响分叉展示更完整的权力结构候选。
- `storyspec creative:report [story]` 会提示“只有势力或反派名称”的薄弱项，要求补资源控制、合法性来源、获利者/受损者和第一碰撞场景。

## 模板契约

- `ClarificationExampleBranch` 新增可选 `powerStructure` 字段，用于势力候选。
- faction 高影响候选缺少 `powerStructure` 关键字段时会产生 warning。
- `templates/clarification/core.yaml` 的 `core.faction-conflict` 升级为高影响问题，并为学院许可、地方贵族、禁忌守护者提供完整权力结构样例。

## 生成产物

- `clarifications.md` 会渲染势力候选的资源控制、合法性来源、获利者、受损者、公开叙事、内部裂缝、第一碰撞场景和关系钩子。
- 势力结构仍保持候选状态，确认后才适合进入 World Bible、specification 或 conflict plan。

## 验证

- 新增 schema、模板选择、澄清 Markdown 和 creative report 单测，覆盖权力结构字段完整性和薄弱势力提示。
