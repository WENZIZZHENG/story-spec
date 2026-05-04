---
change_type: patch
scope: application,cli,tests,docs
---

# StorySpec v0 规格预览

## CLI 行为

- `preview specify` 现在直接生成 StorySpec v0 骨架，而不是“规格预览”式原始记录。
- `apply specify` 写入正式 `specification.md` 时保留 StorySpec v0 的首页结构，不再保留“只有 apply 后才进入正式 specification”的旧语义。

## 模板契约

- `specification.md` 的默认结构改为：作品定位、一句话故事、主角核心、关系线、关键冲突、世界规则、文风约束、下一步入口。
- 输出继续保留 `[作者已确认]`、`[agent 建议]` 和 `[待确认]` 三层，不把缺口填成假设。

## 生成产物

- `specification.md` 会以 `StorySpec v0` 作为首页标题。
- preview 内容和 applied 内容都不再出现“本文件由 preview 生成”的旧尾注。

## 验证

- 新增或更新 `tests/unit/preview-apply.test.ts`。
- 已运行 `npm run build` 与 `npx vitest run tests/unit/preview-apply.test.ts`。
