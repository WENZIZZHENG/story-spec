# 登录/权限 UI 只读切片设计

## 设计决策

本切片把登录/权限 UI 作为独立 Web shell 的只读状态面板，而不是账号系统实现。面板输入来自已有 session/project guard、角色权限模型和 API contract 语言；输出是可测试的 UI contract 与静态 HTML 渲染。

## 数据模型

- `authPanel.session`：展示 session 状态、用户名称和项目名称。
- `authPanel.role`：展示项目角色、角色中文标签和说明。
- `authPanel.actions`：列出关键权限动作、是否允许、边界、禁用原因和推荐动作。
- `authPanel.boundaries`：说明账号/团队/角色变更仍由后续 OpenSpec 处理。

## UI 边界

界面只显示“已绑定 session”“权限不足”“需要 owner/editor 调整权限”等状态语言。所有按钮或动作在本切片中都是展示性 contract，不调用 mutation endpoint。

## 验证策略

先为 `apps/web/src/app-shell.ts` 写红测试，验证 contract 和 HTML 包含登录/权限状态、允许/禁用动作和非目标边界。再实现最小 contract 和渲染。
