---
change_type: minor
scope: cli,application,validation,tests
---

# 核心要素成熟度模型

## CLI 行为

- `storyspec creative:report` 新增“核心要素面板”，显示主角、核心伙伴、第一舞台、能力体系、势力与冲突、长线威胁、类型体验、成功路线和独特声音的成熟度。
- `storyspec next` 在规格已存在但 P0 核心要素仍不成熟时，优先推荐继续共创访谈，而不是直接进入完整 plan。

## 模板契约

- 本批次不修改 slash command 模板。
- 核心要素面板只读取 `clarifications.json`，不会自动把候选写入 specification、creative-plan、tasks 或正文。
- 核心要素状态复用澄清答案的 `source`、`confirmed` 与“稍后决定”语义，保持作者确认优先。

## 生成产物

- `storyspec creative:report --json` 和 `storyspec next --json` 输出新增 `coreElements` 字段。
- `storyspec validate` 对 plan 后仍未成熟的核心要素新增 `CORE_ELEMENT_NOT_READY_FOR_PLAN` warning。
- 写入前 preview 会继续把 `deferred` 核心要素视为 blocking risk，避免稍后决定内容被直接应用。

## 验证

- 增加《编程施法》共创样例的核心要素回归测试，覆盖主角部分确认、能力和长线威胁确认，以及伙伴、舞台、势力冲突仍需共创。
- 增加第一舞台质量判断测试，避免世界观只停留在百科式设定堆叠。
- 已运行 `npx vitest run tests/unit/story-core-elements.test.ts tests/unit/creative-report.test.ts tests/unit/story-onboarding.test.ts tests/unit/validate-project.test.ts`。
