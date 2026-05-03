---
change_type: minor
scope: cli,application,tests
---

# 共创入口导航基线

## CLI 行为

- `storyspec next` 在 idea/interviewing 阶段会输出主角、伙伴、舞台、能力、势力、冲突等共创入口，帮助作者继续探索候选，而不是只看到线性命令。
- idea 阶段的创作缺口会更明确提示核心伙伴、第一舞台、能力边界和势力冲突细节仍需共创。

## 模板契约

- 本批次不修改 slash command 模板。
- 共创入口仍指向现有 `storyspec interview <story>`，不新增正式写入契约。
- 共创入口只用于引导候选探索，不会把候选写入 specification、tasks 或正文。

## 生成产物

- 新增《编程施法》共创体验 fixture：`tests/fixtures/co-creation/programming-casting.json`。
- `storyspec next --json` 输出新增 `coCreationEntrypoints` 字段，包含入口 ID、标签、命令和原因。

## 验证

- 已运行 `npx vitest run tests/unit/story-onboarding.test.ts tests/unit/interview-story.test.ts tests/unit/creative-report.test.ts tests/unit/preview-apply.test.ts`。
- 已运行 `npm run build`。
