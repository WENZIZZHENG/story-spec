# Web Shell E2E 冒烟首片

## 背景

独立 Web shell 已有静态构建、本地预览服务和关键 UI contract，但还没有 `tests/e2e` 层面的真实服务冒烟。路线图要求 Playwright 或等价 e2e 覆盖首屏和核心路径；当前项目没有 Playwright 依赖，因此先落一个零依赖 HTTP 级 e2e。

## 目标

- 新增 `tests/e2e/web-shell.e2e.test.ts`。
- 测试启动真实 Web dev server，读取构建后的首页和 JS 入口。
- 覆盖首屏标题、登录/权限、错误边界、路由、写入边界和非目标。
- 增加根 `test:e2e` 脚本。

## 非目标

- 不引入 Playwright、浏览器下载或视觉回归。
- 不测试真实 API login 或多人 server。
- 不替代后续浏览器级 E2E。
