---
change_type: minor
scope: domain,templates,validation,tests
---

# 增强世界观场景压力检查

## CLI 行为

- `world:check` / `validate` 会对高影响 WorldFact 输出 warning，要求说明场景压力、受益者、代价、违规后果和场景证据路径。
- “知识垄断”这类设定若只写成百科描述，会提示补成考试、禁书、许可、身份审查、资源分配或具体冲突。

## 模板契约

- WorldFact 支持 `pressure`、`beneficiaries`、`costs`、`violationConsequence`、`sceneEvidencePaths`。
- Scene Card 示例新增 `worldReveal`，要求说明规则如何影响角色行动，以及谁获利或受损。

## 生成产物

- 新项目的世界观模板会提示作者把世界规则连接到场景证据，而不是只保存设定说明。

## 验证

- 新增/更新单测覆盖高影响世界事实的压力字段解析和缺失 warning。
