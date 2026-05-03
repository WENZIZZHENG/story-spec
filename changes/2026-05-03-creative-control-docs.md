---
change_type: none
scope: docs,readme,workflow
---

# 创作控制权用户文档

## CLI 行为

- 本批次不改变 CLI 行为。
- README 快速开始现在优先展示 `novel interview`，引导用户先保存澄清记录，再进入 `status` / `validate`。

## 模板契约

- 本批次不修改 command 模板。
- 用户文档明确：低信息量输入应先澄清和预览，未确认 `ai-suggested` 或 `confirmed: false` 不得写入正典。

## 生成产物

- 新增 `docs/creative-control.md`。
- 更新 `README.md`、`docs/commands.md`、`docs/workflow.md`、`docs/index.md`。
- 更新 D10 路线图、统一待办入口和归档记录。

## 验证

- 已运行 `npm run check:changes`。
- 已运行 `git diff --check`。
