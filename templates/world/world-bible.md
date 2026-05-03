# World Bible

## 用途

记录会影响剧情选择的世界观事实。不要把这里写成百科；每条事实都必须说明它在故事中的功能和约束。

## WorldFact 格式

```yaml
- id: world.example.rule
  title: 示例规则
  type: rule
  summary: 一句话说明世界事实。
  storyFunction: 这个事实如何制造冲突、限制选择或推动剧情。
  constraints:
    - 写作时必须遵守的限制。
  pressure: 这个事实如何在具体场景中压迫、诱惑或改变角色行动。
  beneficiaries:
    - 谁因此获利或维持权力。
  costs:
    - 谁因此付出代价或被排除。
  violationConsequence: 角色违反这条规则会发生什么后果。
  sceneEvidencePaths:
    - stories/<story>/scenes/scene-001.yaml
  sourcePaths:
    - spec/knowledge/world-setting.md
  source:
    confirmedByUser: false
    aiSuggested: false
    needsClarification:
      - 如果该规则来自 AI 推断，在这里写明需要用户确认的问题。
  status: draft
```

## 来源规则

- `confirmedByUser: true` 只能用于用户明确确认、或已有正文证据支持的事实。
- `aiSuggested: true` 表示该事实来自 AI 推断或推荐。
- 只要 `aiSuggested: true` 且 `confirmedByUser: false`，`status` 必须保持 `draft`，并在 `needsClarification` 中写明待确认问题。
- 不要把未确认 AI 建议写成 `confirmed`；`world:check` 会把这种情况标记为 warning。
- 高影响世界事实不要只写百科描述。请说明它如何变成考试、禁书、许可、身份审查、资源分配、行动代价或具体冲突。
- `sceneEvidencePaths` 用来连接 Scene Card 或正文证据，让世界观能回到读者实际看到的场景。

## Facts

```yaml
worldFacts: []
```
