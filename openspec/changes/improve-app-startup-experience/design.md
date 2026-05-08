## Design

### 启动信息模型

新增一个轻量启动结果模型，字段包括：`host`、`requestedPort`、`port`、`url`、`fallbackUsed`、`tokenRequired`、`status`。文本输出只展示必要 URL 和是否回退，不展示 token。

### 端口回退

`storyspec app` 继续优先尝试用户请求端口。若监听失败且错误为 `EADDRINUSE`，只在未显式要求固定端口语义的当前行为下，按小范围顺序尝试后续端口。仍默认绑定 `127.0.0.1`，不放宽网络暴露边界。

### Doctor

`storyspec doctor` 只做只读检查：Node 版本、Git 可用性、当前目录是否为 StorySpec 项目、默认 App 端口是否可监听、当前平台是否能尝试打开浏览器。输出使用 pass/warn/fail 三态；`--json` 使用稳定字段，便于 issue 模板和脚本消费。

### 文档边界

README 只描述真实可用命令，不承诺多用户、云端或 doctor 自动修复能力。启动体验完成后同步 changeset 和待办归档。
