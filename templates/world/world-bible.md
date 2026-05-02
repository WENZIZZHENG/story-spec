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
  sourcePaths:
    - spec/knowledge/world-setting.md
  status: draft
```

## Facts

```yaml
worldFacts: []
```
