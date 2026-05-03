# 作者画像设计说明

## 目标

作者画像用于帮助 StorySpec 记住作者长期偏好，减少后续新故事重复提问。它只影响推荐、示例、提问顺序和风味参考，不是故事正典。

## 存储位置

- 模板源：`memory/author-profile.json`
- 用户项目：`.specify/memory/author-profile.json`

## 生命周期

1. 第一次使用没有历史画像可回填，只能做可跳过偏好采样。
2. 首次采样默认最多 4 个问题，结果写为 `provisional`。
3. 后续使用读取 `confirmed` 条目作为强偏好，`provisional` 只作为弱提示。
4. 作者可通过 `storyspec author-profile --confirm/--deprecate/--ignore/--clear` 显式修正。
5. 单次故事选择不能自动升级为长期偏好；只能形成候选，等待作者确认。

## Schema 摘要

```json
{
  "schemaVersion": "1.0",
  "updatedAt": "ISO-8601",
  "notes": ["作者画像只影响推荐、示例和提示词上下文，不是故事正典。"],
  "entries": [
    {
      "id": "pref.genre",
      "category": "genre",
      "label": "题材偏好",
      "value": "用户原话",
      "status": "provisional",
      "source": "sampled",
      "evidence": ["作者画像首次/手动采样"],
      "createdAt": "ISO-8601",
      "updatedAt": "ISO-8601"
    }
  ]
}
```

## 正典边界

- `clarifications.json`、用户即时指令、正文证据优先于作者画像。
- 作者画像不得写入 `WorldFact`、`CanonFact`、`Scene Card` 或正文，除非用户在当前故事中再次明确确认。
- `context:pack` 可把画像列入 `mustRead`，reason 必须说明“不作为故事正典”。

## 参考项目借鉴

- Foam / Dendron / Logseq：借鉴本地优先、可修正长期记忆和 evidence path，不照搬完整知识库。
- Inquirer.js / Yeoman：借鉴首次只问少量必要问题、可跳过和先采样再生成，不做重 onboarding。
