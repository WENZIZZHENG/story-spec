---
change_type: patch
scope: application,tests
---

# 创作回声与状态成熟度解释

## CLI 行为

- `creative:report` 和 `status` 现在共享更统一的创作回声口径。
- 输出新增“成熟度”“已长出的关键部件”“还需要补齐”“下一轮问题”等层次，减少同一句话在多个区域重复出现。

## 模板契约

- 不修改故事模板。
- 状态文案不再把已成形内容继续描述成“灵魂仍待共创”的唯一结论。

## 生成产物

- `creative:report` 与 `status` 的摘要更偏向“已成形 / 还缺 / 下一步”。
- 去重后的摘要减少了同一答案在创作回声中的重复露出。

## 验证

- 新增或更新 `tests/unit/creative-report.test.ts` 与 `tests/unit/get-project-status.test.ts`。
- 已运行 `npm run build` 与 `npx vitest run tests/unit/creative-report.test.ts tests/unit/get-project-status.test.ts tests/unit/preview-apply.test.ts`。
