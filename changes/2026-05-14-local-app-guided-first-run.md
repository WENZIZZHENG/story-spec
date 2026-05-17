---
change_type: patch
scope: app,docs
---

# 本机 Web 首屏开始路径

## CLI 行为

- `storyspec app` 命令不变。

## 多用户控制面

- 无 server API 行为变化。

## 模板契约

- 无模板生成产物变化。

## 生成产物

- 不手工修改 `dist/**`。

## App 体验

- 本机 Web 工作室首屏新增“开始路径”引导。
- 引导以三步说明打开/创建项目、创建或选择故事、继续写作或审阅候选。
- 引导明确候选和预览不会自动写入正式故事，继续保留 Preview / Confirm / Apply 边界。

## 边界

- 不引入独立前端框架。
- 不实现账号、云端多人协作、富文本编辑器或实时协同。
- 不改变任何本机 App API。

## 验证

- `npx openspec validate add-local-app-guided-first-run --strict --json --no-interactive`
- `npx vitest run tests/unit/local-app-html.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
