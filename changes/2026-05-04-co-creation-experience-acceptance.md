---
change_type: minor
scope: domain,docs,tests
---

# 创作乐趣体验验收

## CLI 行为

- 本次不新增命令；新增的是共创体验防回归验收。

## 模板契约

- 新增 `evaluateCoCreationExperience`，基于首轮共创脚本检查入口自由、低负担候选、有趣选择后果、创作回声、候选边界、plan 门禁和作者回应范围。
- 人工走查项明确要求判断“是否像在创造小说世界”，但不评价作者创意质量。

## 生成产物

- 新增 `docs/tech/co-creation-experience-acceptance.md`，记录自动验收和人工走查清单。

## 验证

- 新增 `tests/unit/co-creation-experience-acceptance.test.ts`，覆盖《编程施法》首轮脚本和退化的 plan-first 样例。
