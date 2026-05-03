---
change_type: minor
scope: domain,templates,workbench,tests
---

# Scene Card 写作前门禁

## CLI 行为

- Scene Card 增加 `plotThread`、`readerPromise`、`relationshipChange`、`worldReveal`、`emotionalBeat`、`endingHook`、`successCriteria` 写作意图字段。
- `scene:check` / `inspectScenes` 会对缺少写作意图字段的 Scene Card 输出 `MISSING_SCENE_INTENT` warning。
- `narrative:test` 在目标章节缺少 Scene Card 时输出补卡建议；已有 Scene Card 时检查情节线、承诺、关系、世界揭示、情绪节拍和结尾钩子。
- `check-writing-state` 增加 Scene Card 写作门禁摘要，缺卡或缺意图字段时不再标记为可写。
- `context:pack` 对写作用途把目标 Scene Card 提升为 required mustRead，并在 constraints / validationChecklist 中保留缺卡或缺字段阻塞说明。

## 模板契约

- Scene Card 模板新增写作门禁字段。
- `/write`、`/scene`、`/context-pack`、`/tasks`、`/checklist` 模板要求正文写作前先确认 Scene Card，不再把缺卡章节标成可直接写作。

## 生成产物

- 命令构建产物同步更新各 agent 的 `/write`、`/scene`、`/context-pack`、`/tasks`、`/checklist` 命令提示。

## 验证

- `npm test -- tests/unit/story-structure.test.ts tests/unit/inspect-story-structure.test.ts tests/unit/run-narrative-tests.test.ts tests/unit/check-writing-state.test.ts tests/unit/manage-context-packs.test.ts`
