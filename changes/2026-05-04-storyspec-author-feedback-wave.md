---
change_type: minor
scope: onboarding,creative-report,context-pack,validation
---

# StorySpec 作者反馈闭环优化

## CLI 行为

- `ingestStoryInput` 的人类输出现在会先说明素材类型、推荐范围和核心要点清单，覆盖一句灵感、长文资料和 Markdown 表格资料。
- Markdown 表格资料只生成字段映射候选；即使传入 `applyConfirmed`，未确认表格也不会写入 `clarifications.json` 或正典。
- `creative:report` 增加第一卷一屏摘要，展示一句话目标、三幕摘要、12 章节奏、角色弧线、剧情起伏和人物关系概况。
- Context Pack 增加 `scope` 摘要；章节写作 pack 只暴露目标章节相关 Scene Card，并在缺少 Scene Card 时输出资料不足 warning。
- `validate` 输出新增 `blocking/advisory/info` 分桶和 scope 摘要，同时保留旧的 `error/warning/info` 字段。

## 模板契约

- 未修改 agent command 模板，不手工编辑 `dist/**`。
- Context Pack JSON 增加 `scope` 字段，包含 `type`、`id`、可选 task/chapter/scene 和 warning 列表。
- Validation issue 可携带 `scope`，当前覆盖 `task-output`、`foreshadowing`、`import-clarification` 和默认 `project-structure`。
- `creative:report` 结果增加结构化 `volumePlanDigest`，人类输出不依赖中文文案反解析。

## 生成产物

- 不新增用户故事正文或真实用户项目数据。
- 不手工修改发布产物；如后续模板变化，仍需通过 `npm run build:commands` 和 manifest 检查生成。
- Context Pack 继续写入 `.specify/context-packs/<pack-id>.json` 和 `.md`，新增 scope 信息随 pack 一起输出。

## 验证

- 已运行 `npx vitest run tests/unit/creative-report.test.ts tests/unit/ingest-story-input.test.ts tests/unit/manage-context-packs.test.ts tests/unit/validate-project.test.ts tests/unit/validation-severity.test.ts tests/unit/writing-rules.test.ts`。
- 已运行 `npm run build`。
- 已运行 `openspec validate --changes --strict --no-interactive`。
