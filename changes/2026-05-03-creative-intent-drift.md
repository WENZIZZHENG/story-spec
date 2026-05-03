---
change_type: minor
scope: review,analysis,tasks,commands
---

# 创作意图漂移检测

## CLI 行为

- `novel review --json` 现在会输出 `CREATIVE_INTENT_DRIFT_*` findings。
- 漂移 finding 归入 continuity reviewer，并转换为任务草稿。
- 检测范围包括 `stories/*/specification.md`、`creative-plan.md`、`tasks.md`、`scenes/*.yaml` 和 `content/**/*.md`。
- `stories/*/candidates.md` 仍视为探索区，不作为 drift 污染源。

## 模板契约

- `/novel-review` 要求单列“创作意图漂移”，遇到未确认 AI 建议或 required 未答主题进入产物时，先确认或转任务草稿，不自动改正文。
- `/novel-analyze` 增加 `creative-control` 专项维度。
- `/novel-tasks` 要求正文任务追溯到已确认澄清答案；未确认 `ai-suggested` 或 `confirmed: false` 来源只能生成 `[PLAN-ONLY]` 澄清/复核任务。

## 生成产物

- 本批次更新 command artifact manifest，覆盖 review/analyze/tasks 模板变化。
- review JSON 中的 `taskDrafts` 会包含 drift finding 的 `sourceFinding` 和 `suggestedAction`。

## 验证

- 已运行 `npx vitest run tests/unit/detect-creative-intent-drift.test.ts tests/unit/review-project.test.ts`。
- 已运行 `npm run build`。
