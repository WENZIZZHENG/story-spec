---
change_type: minor
scope: domain,validation,templates,tests
---

# 伏笔计划回收状态

## CLI 行为

- `narrative:test` 在 Scene Card 声明 `foreshadowing.plannedPayoff` 时，会输出 planned payoff 的通过型 info。
- `validate` / 写作规则不再把已声明 `plannedPayoff` 的伏笔标为 `FORESHADOWING_OPEN_LOOP`。
- 未声明 `plannedPayoff` 且没有 `paidOff` 的伏笔仍保持 open loop 提示。

## 模板契约

- Scene Card 模板的 `foreshadowing` 新增 `plannedPayoff` 数组。
- 旧 Scene Card 不需要迁移；缺少该字段时按空数组处理。

## 生成产物

- 模板变化会同步到 agent 命令构建产物和 manifest。

## 验证

- 新增 `tests/unit/writing-rules.test.ts` 覆盖 planned payoff 不再触发 open loop。
- 新增 `tests/unit/run-narrative-tests.test.ts` 覆盖 planned payoff 的叙事测试输出。
