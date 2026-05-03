---
change_type: minor
scope: domain,templates,validation,tests
---

# 增强人物情感与关系追踪

## CLI 行为

- `creative:report` 的核心伙伴评估会识别“只有引路/解释/辅助功能”的浅层伙伴，并提示继续确认独立欲望、立场冲突和挑战主角的张力。
- `storyspec interview` 在慢热关系答案后追加关系变化追问，覆盖信任、距离、冲突、脆弱和修复节点。

## 模板契约

- `relationships.json` 新增 `relationshipArcs` 示例，支持 `trust`、`distance`、`conflict`、`vulnerability`、`repair` 和 `turningPoints.evidencePath`。
- `character-state.json` 新增主角欲望、恐惧、误判、成长代价，以及配角挑战主角和关系张力字段。
- `/tasks` 和 `/write` 要求关系线任务声明 relationshipArc、关系状态变化和 evidencePath。

## 生成产物

- 新项目和升级后的模板会带有慢热关系追踪结构示例。
- 关系追踪文件若声明 `relationshipArcs`，校验会检查参与者、trust 数值和转折证据路径。

## 验证

- 新增/更新单测覆盖核心伙伴深度评估、关系追问和 relationshipArcs schema。
