# 创作控制权下一轮复核（2026-05-05）

## 范围

- 临时项目：`%TEMP%/storyspec-control-dogfood-*/workspace`
- 样例故事：`控制权核验`
- 目标：复核 `creative:report --json`、`next`、`clarification:rollback --json`、`preview specify`、`apply` 是否仍保护作者确认权，尤其是未确认候选、稍后决定和 preview/apply 门禁。

## 验证记录

| 命令 | 结果 | 说明 |
| --- | --- | --- |
| `npx vitest run tests/unit/creative-report.test.ts tests/unit/preview-apply.test.ts tests/unit/manage-clarifications.test.ts tests/unit/story-onboarding.test.ts` | 4 个测试文件、48 个测试通过 | 覆盖创作报告、preview/apply、澄清回滚和 next 导航中的控制权边界。 |

## CLI 走查摘要

| 路径 | 命令 | 观察 | 是否可能让 AI 过早定案 |
| --- | --- | --- | --- |
| 创作报告 | `storyspec creative:report 控制权核验 --json` | confirmed 只包含 `core.premise` 作者确认；`threat.shape` 作为 AI 候选列出；`driftIssues` 指出未确认 AI 建议“旧文明运行时重启”已进入 `specification.md`，并建议先确认或移回待确认任务。 | 否。报告能发现漂移，不自动重写正文。 |
| 下一步导航 | `storyspec next 控制权核验 --json` | `pendingQuestions` 同时列出 `partner.core` 和 `AI 建议待确认：threat.shape`；首个 action 把“稍后决定”的核心伙伴带回 `interview --focus partner`。 | 否。未决项被回流，不被忽略。 |
| 规格预览 | `storyspec preview specify 控制权核验 --json` | writeSummary 分成作者确认项、AI 候选、待确认项；risks 含 `required 待确认`、`AI 建议待确认`、`核心要素稍后决定` 三个 blocking。 | 否。预览不覆盖正式 `specification.md`，且风险可见。 |
| 应用预览 | `storyspec apply <preview-id> --json`、`storyspec apply <preview-id> --yes --json` | 不带 `--yes` 返回 `dryRun: true`、`applied: false`；带 `--yes` 仍因 blocking risks 拒绝写入。 | 否。显式确认也不能绕过 blocking 风险。 |
| 回滚澄清 | `storyspec clarification:rollback --story 控制权核验 --json` | 最近确认的 `partner.core` 被退回候选，保留 `evidencePath: clarifications.json#answers.partner.core`，不修改正文或正典文件。 | 否。回滚只改变澄清状态。 |

## 候选增强清单

| 候选 | 保护的控制权类型 | 涉及模块 | 验收方式 | 边界 |
| --- | --- | --- | --- | --- |
| rollback 后“稍后决定”显示为 AI 候选语义略怪 | 回滚解释权：作者需要知道这是从用户未决项退回候选，而非 AI 新建议 | `src/application/manage-clarifications.ts`、`clarifications.md` 渲染 | 回滚 `稍后决定` 后，markdown 使用“退回候选 / 待重新确认”之类 sourceLabel，而不是只进入“AI 建议，待确认”。 | 不改变回滚的保守语义，不自动删除原答案。 |
| preview 风险摘要可再短一些 | 写入确认权：降低作者判断 blocking 风险的阅读成本 | `src/application/preview-apply.ts` | blocking risks 在 CLI 普通输出中先显示 1-3 条最关键项，JSON 保留完整列表。 | 不隐藏任何风险；不允许 `--yes` 绕过 required / AI 候选风险。 |

## 本轮结论

- 控制权链条有效：报告能发现未确认 AI 候选漂移，next 能回流稍后决定，preview/apply 有明确 blocking 门禁，rollback 不改正文。
- 没有 P0/P1 缺陷；不创建实现 OpenSpec。
- 保留 2 个 P2 可读性候选，后续只有在真实作者走查中反复造成误解时再转实现。
