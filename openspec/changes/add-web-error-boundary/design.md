# Web 错误边界 UI 首片设计

## Contract

新增 `errorBoundary`：

- `states`：覆盖 `unauthorized`、`forbidden`、`offline`、`blocked`、`conflict`。
- 每个状态包含 label、message、nextAction、severity、retryable。
- `boundaries`：说明错误面板只呈现状态，不触发 mutation。

## 渲染

`renderIndependentWebAppHtml()` 新增错误边界 section，用列表展示所有状态，retryable 状态打上可读标记，但不渲染表单或真实按钮。

## 测试

先写红测试验证 contract 与 HTML 包含错误状态、next action、retryable 和只读边界。
