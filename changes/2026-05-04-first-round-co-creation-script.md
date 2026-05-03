---
change_type: minor
scope: fixtures,domain,docs,tests
---

# 首轮共创样例脚本

## CLI 行为

- 本次不新增命令；新增的是首轮共创体验的可测试契约。
- 后续修改 `storyspec next`、`storyspec interview`、`creative:report` 或模板时，可用该样例判断是否仍符合“先共创，不抢写计划”的体验。

## 模板契约

- 新增 `validateFirstRoundScript`，校验首轮脚本必须覆盖保存灵感、推荐入口、给候选、用户选择/改写、创作回声和下一步推荐。
- 首轮脚本必须覆盖能力、舞台、势力三个入口。
- 高影响候选必须包含完整有趣选择字段；势力候选还必须包含权力结构字段。

## 生成产物

- 新增《编程施法》首轮共创脚本 fixture：`tests/fixtures/co-creation/programming-casting-first-round.json`。
- 样例明确禁止首轮直接写完整 `creative-plan.md`，也禁止把未确认角色和势力写入正典。

## 验证

- 新增 `tests/unit/co-creation-first-round-script.test.ts`，覆盖有效样例和退化样例。
