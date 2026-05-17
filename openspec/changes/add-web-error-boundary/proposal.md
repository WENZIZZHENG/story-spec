# Web 错误边界 UI 首片

## 背景

独立 Web shell 已有页面、权限、构建和本地预览入口，但还缺统一错误边界。多人 App 必须把 unauthorized、forbidden、offline、blocked 等状态转成可读下一步，而不是让用户只看到失败或空白。

## 目标

- 在 `apps/web` shell contract 中新增错误边界 UI。
- 展示关键错误状态、说明、下一步和安全边界。
- 保持本切片只读，不自动 retry、apply、logout 或修改权限。

## 非目标

- 不接真实 API client。
- 不实现自动恢复、重试队列、登录跳转或 E2E。
- 不引入前端框架或错误监控服务。
